import { useEffect, useMemo, useRef, useState } from 'react'
import { FundCard } from './components/FundCard'
import { FundCardSkeleton } from './components/FundCardSkeleton'
import { useLocalStorage } from './hooks/useLocalStorage'
import { fetchFundEstimate, searchFunds } from './services/fundApi'
import type { FundSearchResult } from './services/fundApi'
import type { Fund, FundGroup } from './types/fund'
import './App.css'

function App() {
  const [groups, setGroups] = useLocalStorage<FundGroup[]>('fundGroups', () => {
    try {
      const legacy = window.localStorage.getItem('fundCodes')
      const codes: string[] = legacy ? JSON.parse(legacy) : []
      return [{ id: Math.random().toString(36).slice(2, 9), name: '默认', codes }]
    } catch {
      return [{ id: Math.random().toString(36).slice(2, 9), name: '默认', codes: [] }]
    }
  })
  useEffect(() => {
    if (!window.localStorage.getItem('fundGroups')) {
      window.localStorage.setItem('fundGroups', JSON.stringify(groups))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fundCodes = useMemo(
    () => [...new Set(groups.flatMap((g) => g.codes))],
    [groups]
  )

  const [activeGroupId, setActiveGroupId] = useState<string>('')
  const resolvedActiveGroupId = (activeGroupId && groups.find((g) => g.id === activeGroupId))
    ? activeGroupId
    : groups[0]?.id ?? ''

  const [refreshInterval, setRefreshInterval] = useLocalStorage<number>('refreshInterval', 30000)
  const [layoutMode, setLayoutMode] = useLocalStorage<'normal' | 'compact' | 'minimal'>('layoutMode', 'normal')
  const [sortKey, setSortKey] = useLocalStorage<'none' | 'name' | 'rate' | 'holding_gain_rate'>('sortKey', 'none')
  const [sortOrder, setSortOrder] = useLocalStorage<'asc' | 'desc'>('sortOrder', 'desc')
  const [privacyMode, setPrivacyMode] = useLocalStorage<boolean>('privacyMode', false)
  const [cachedFunds, setCachedFunds] = useLocalStorage<Fund[]>('cachedFunds', [])
  const [funds, setFunds] = useState<Fund[]>(cachedFunds)
  const [loadingCodes, setLoadingCodes] = useState<string[]>([])
  const [inputCode, setInputCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingFunds, setPendingFunds] = useState<FundSearchResult[]>([])
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const genRef = useRef(0)

  useEffect(() => {
    const kw = inputCode.trim()
    if (!kw) {
      setSearchResults([])
      setShowDropdown(false)
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    setShowDropdown(true)
    let cancelled = false
    const timer = setTimeout(() => {
      searchFunds(kw).then((results) => {
        if (cancelled) return
        setSearchLoading(false)
        setSearchResults(results)
      })
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [inputCode])

  const loadFundsStreaming = (codes: string[]) => {
    const gen = ++genRef.current
    setFunds([])
    setLoadingCodes([...codes])

    codes.forEach(async (code) => {
      const fund = await fetchFundEstimate(code)
      if (genRef.current !== gen) return // 已被新一轮取代，丢弃
      setLoadingCodes((prev) => prev.filter((c) => c !== code))
      if (fund) {
        setFunds((prev) => {
          // 按 codes 原始顺序插入
          const next = prev.filter((f) => f.code !== code)
          const insertIdx = codes.indexOf(code)
          const before = next.filter((f) => codes.indexOf(f.code) < insertIdx)
          const after  = next.filter((f) => codes.indexOf(f.code) >= insertIdx)
          return [...before, fund, ...after]
        })
      }
    })
  }

  const refreshFundsSilent = (codes: string[]) => {
    codes.forEach(async (code) => {
      const fund = await fetchFundEstimate(code)
      if (!fund) return
      setFunds((prev) =>
        prev.map((f) => (f.code === fund.code ? fund : f))
      )
    })
  }

  useEffect(() => {
    if (funds.length > 0) {
      setCachedFunds(funds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funds])

  useEffect(() => {
    if (fundCodes.length === 0) return
    const validCache = cachedFunds.filter((f) => fundCodes.includes(f.code))
    if (validCache.length > 0) {
      // 缓存命中：立刻展示旧数据，后台悄悄拉新数据替换
      setFunds(validCache)
      refreshFundsSilent(fundCodes)
    } else {
      // 无缓存：流式加载 + 骨架屏
      loadFundsStreaming(fundCodes)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (fundCodes.length === 0) return
    const timer = setInterval(() => {
      refreshFundsSilent(fundCodes)
    }, refreshInterval)
    return () => clearInterval(timer)
  }, [fundCodes, refreshInterval])

  const handleSelectSuggestion = (item: FundSearchResult) => {
    if (fundCodes.includes(item.code) || pendingFunds.some((p) => p.code === item.code)) {
      return
    }
    setPendingFunds((prev) => [...prev, item])
    setError('')
    // 保持下拉框开着，让用户可以继续选择
    inputRef.current?.focus()
  }

  const handleRemovePending = (code: string) => {
    setPendingFunds((prev) => prev.filter((p) => p.code !== code))
  }

  const handleAdd = async () => {
    const toAdd = pendingFunds.filter((p) => !fundCodes.includes(p.code))
    if (toAdd.length === 0) {
      setError('请先选择要添加的基金')
      return
    }
    setLoading(true)
    setError('')
    const newFunds: Fund[] = []
    for (const item of toAdd) {
      const fund = await fetchFundEstimate(item.code)
      if (fund) {
        newFunds.push(fund)
      } else {
        // 估值接口无数据（如货币基金），用搜索时已知名称构建基础条目
        newFunds.push({
          code: item.code,
          name: item.name,
          netValue: '--',
          estimatedValue: '--',
          estimatedRate: '0.00',
          estimatedTime: '',
          lastUpdateDate: '',
          topHoldings: [],
        })
      }
    }
    if (newFunds.length === 0) {
      setError('所选基金数据获取失败，请重试')
      setLoading(false)
      return
    }
    const addedCodes = newFunds.map((f) => f.code)
    const targetId = resolvedActiveGroupId
    setGroups((prev) =>
      prev.map((g) =>
        g.id === targetId ? { ...g, codes: [...g.codes, ...addedCodes] } : g
      )
    )
    setFunds((prev) => [...prev, ...newFunds])
    setPendingFunds([])
    setLoading(false)
  }

  const handleRemove = (code: string) => {
    setGroups((prev) => prev.map((g) => ({ ...g, codes: g.codes.filter((c) => c !== code) })))
    setFunds((prev) => prev.filter((f) => f.code !== code))
    setLoadingCodes((prev) => prev.filter((c) => c !== code))
  }

  const [showGroupManager, setShowGroupManager] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [gmEditingId, setGmEditingId] = useState('')
  const [gmEditingName, setGmEditingName] = useState('')
  const newGroupInputRef = useRef<HTMLInputElement>(null)

  const handleNewGroupConfirm = () => {
    // Guard: ignore if fired within 150ms of a rename commit (Enter key leak)
    if (Date.now() - gmLastCommitRef.current < 150) return
    const name = newGroupName.trim()
    if (!name) return
    const id = Math.random().toString(36).slice(2, 9)
    setGroups((prev) => [...prev, { id, name, codes: [] }])
    setActiveGroupId(id)
    setNewGroupName('')
  }

  const handleMoveGroup = (id: string, dir: 'up' | 'down') => {
    setGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  const gmLastCommitRef = useRef(0)

  const gmCommit = (id: string) => {
    // Guard against double-fire from onKeyDown + onBlur
    const now = Date.now()
    if (now - gmLastCommitRef.current < 100) return
    gmLastCommitRef.current = now
    const trimmed = gmEditingName.trim()
    if (trimmed) handleRenameGroup(id, trimmed)
    setGmEditingId('')
    setGmEditingName('')
  }

  const handleRenameGroup = (id: string, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)))
  }

  const handleDeleteGroup = (id: string) => {
    const group = groups.find((g) => g.id === id)
    if (!group) return
    setGroups((prev) => prev.filter((g) => g.id !== id))
    setFunds((prev) => prev.filter((f) => !group.codes.includes(f.code)))
    setLoadingCodes((prev) => prev.filter((c) => !group.codes.includes(c)))
    if (resolvedActiveGroupId === id) {
      const remaining = groups.filter((g) => g.id !== id)
      if (remaining.length > 0) setActiveGroupId(remaining[0].id)
    }
  }

  const handleMoveFund = (code: string, fromGroupId: string, toGroupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === fromGroupId) {
          const next = { ...(g.holdings ?? {}) }
          delete next[code]
          return { ...g, codes: g.codes.filter((c) => c !== code), holdings: next }
        }
        if (g.id === toGroupId) {
          const fromGroup = prev.find((x) => x.id === fromGroupId)
          const entry = fromGroup?.holdings?.[code]
          const holdings = entry ? { ...(g.holdings ?? {}), [code]: entry } : g.holdings
          return { ...g, codes: [...g.codes, code], holdings }
        }
        return g
      })
    )
  }

  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = tabsScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabsScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  useEffect(() => {
    setTimeout(updateScrollState, 50)
  }, [groups])

  const handleSetHolding = (code: string, field: 'shares' | 'cost', value: number | undefined) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== resolvedActiveGroupId) return g
        const next = { ...(g.holdings ?? {}) }
        const entry = { ...(next[code] ?? {}) }
        if (value == null) { delete entry[field] } else { entry[field] = value }
        if (Object.keys(entry).length === 0) { delete next[code] } else { next[code] = entry }
        return { ...g, holdings: next }
      })
    )
  }

  const handleBatchSetHolding = (code: string, shares: number, cost: number) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== resolvedActiveGroupId) return g
        const next = { ...(g.holdings ?? {}), [code]: { ...(g.holdings?.[code] ?? {}), shares, cost } }
        return { ...g, holdings: next }
      })
    )
  }

  const totalProfit = useMemo(() => {
    const ag = groups.find((g) => g.id === resolvedActiveGroupId)
    if (!ag?.holdings) return null
    let profit = 0; let hasProfit = false
    for (const [code, entry] of Object.entries(ag.holdings)) {
      const fund = funds.find((f) => f.code === code)
      if (!fund) continue
      const netPrice = parseFloat(fund.netValue)
      if (entry.shares != null && !isNaN(netPrice) && netPrice > 0) {
        profit += entry.shares * netPrice * parseFloat(fund.estimatedRate || '0') / 100
        hasProfit = true
      }
    }
    return hasProfit ? profit : null
  }, [groups, resolvedActiveGroupId, funds])

  const getHoldingGainRate = (fund: Fund, holdings?: Record<string, { shares?: number; cost?: number }>) => {
    const entry = holdings?.[fund.code]
    if (!entry?.shares || !entry?.cost) return null
    const netPrice = parseFloat(fund.netValue)
    if (isNaN(netPrice) || netPrice <= 0) return null
    const holdingAmount = entry.shares * netPrice
    return (holdingAmount - entry.cost) / entry.cost * 100
  }

  const sortFunds = (list: Fund[], holdings?: Record<string, { shares?: number; cost?: number }>) => {
    if (sortKey === 'none') return list
    return [...list].sort((a, b) => {
      let compareValue = 0
      if (sortKey === 'name') {
        compareValue = a.name.localeCompare(b.name, 'zh-Hans-CN')
      } else if (sortKey === 'rate') {
        const rateA = Number.parseFloat(a.estimatedRate) || 0
        const rateB = Number.parseFloat(b.estimatedRate) || 0
        compareValue = rateA - rateB
      } else if (sortKey === 'holding_gain_rate') {
        const rateA = getHoldingGainRate(a, holdings)
        const rateB = getHoldingGainRate(b, holdings)
        if (rateA === null && rateB === null) return 0
        if (rateA === null) return 1
        if (rateB === null) return -1
        compareValue = rateA - rateB
      }
      if (compareValue === 0 && sortKey !== 'holding_gain_rate') {
        compareValue = a.name.localeCompare(b.name, 'zh-Hans-CN')
      }
      return sortOrder === 'asc' ? compareValue : -compareValue
    })
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="FundWatcher logo" width="32" height="32" />
          </div>
          <div className="header-text">
            <h1>基察员</h1>
          </div>
        </div>
        <div className="header-controls">
          <div className="refresh-control">
            <label htmlFor="refresh-interval">刷新间隔</label>
            <div className="refresh-group">
              <select
                id="refresh-interval"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
              >
                <option value={30000}>30秒</option>
                <option value={60000}>60秒</option>
                <option value={120000}>120秒</option>
                <option value={180000}>180秒</option>
                <option value={240000}>240秒</option>
                <option value={300000}>300秒</option>
              </select>
              <button
                className="btn-refresh"
                onClick={() => refreshFundsSilent(fundCodes)}
                disabled={loading || fundCodes.length === 0}
                title="手动刷新"
              >
                ↻
              </button>
              <button
                className={`btn-privacy${privacyMode ? ' active' : ''}`}
                onClick={() => setPrivacyMode(!privacyMode)}
                title={privacyMode ? '显示金额' : '隐藏金额'}
                aria-pressed={privacyMode}
              >
                {privacyMode ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="market-status-bar">
        <span className="dot" />
        <span className="stat-item">
          <span className="stat-label">监控基金</span>
          <span className="stat-value">{funds.length} 只</span>
        </span>
        {funds.length > 0 && (
          <span className="stat-item stat-item-rise">
            <span className="stat-label">上涨</span>
            <span className="stat-value" style={{ color: 'var(--up)' }}>
              {funds.filter(f => parseFloat(f.estimatedRate) >= 0).length}
            </span>
          </span>
        )}
        {funds.length > 0 && (
          <span className="stat-item">
            <span className="stat-label">下跌</span>
            <span className="stat-value" style={{ color: 'var(--down)' }}>
              {funds.filter(f => parseFloat(f.estimatedRate) < 0).length}
            </span>
          </span>
        )}
        {totalProfit != null && (
          <span className="stat-item stat-item-profit">
            <span className="stat-label">今日总盈亏</span>
            <span className="stat-value" style={{ color: privacyMode ? 'var(--text-muted)' : (totalProfit >= 0 ? 'var(--up)' : 'var(--down)') }}>
              {privacyMode ? '¥ ••••' : `${totalProfit >= 0 ? '+' : '−'}¥${Math.abs(totalProfit).toFixed(2)}`}
            </span>
          </span>
        )}
      </div>

      <section className="panel add-section">
        <h2>添加基金</h2>
        {pendingFunds.length > 0 && (
          <div className="pending-tags">
            {pendingFunds.map((p) => (
              <span key={p.code} className="pending-tag">
                <span className="tag-name">{p.name}</span>
                <span className="tag-code">{p.code}</span>
                <button className="tag-remove" onClick={() => handleRemovePending(p.code)} title="移除">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="add-form">
          <div className="search-wrapper">
            <input
              ref={inputRef}
              className="input-code"
              placeholder="输入代码或名称搜索，如 020 或 沪深300"
              value={inputCode}
              onChange={(e) => { setInputCode(e.target.value); setError('') }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setShowDropdown(false); setInputCode('') }
              }}
              onFocus={() => { if (inputCode.trim()) setShowDropdown(true) }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              disabled={loading}
              autoComplete="off"
            />
            {showDropdown && (
              <ul className="search-dropdown">
                {searchLoading && (
                  <li className="dropdown-hint">搜索中…</li>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <li className="dropdown-hint">无匹配结果</li>
                )}
                {!searchLoading && searchResults.map((item) => {
                  const alreadyAdded = fundCodes.includes(item.code)
                  const alreadyPending = pendingFunds.some((p) => p.code === item.code)
                  return (
                    <li
                      key={item.code}
                      className={`dropdown-item${alreadyAdded ? ' dropdown-item--disabled' : ''}${alreadyPending ? ' dropdown-item--selected' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault() // 防止 input 失焦关闭下拉框
                        if (alreadyAdded) return
                        if (alreadyPending) {
                          handleRemovePending(item.code)
                        } else {
                          handleSelectSuggestion(item)
                        }
                      }}
                    >
                      <span className="dropdown-code">{item.code}</span>
                      <span className="dropdown-name">{item.name}</span>
                      {item.type && <span className="dropdown-type">{item.type}</span>}
                      {alreadyAdded && <span className="dropdown-badge">已添加</span>}
                      <span className="dropdown-check">{alreadyPending ? '✓' : ''}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <button className="primary" onClick={handleAdd} disabled={loading || pendingFunds.length === 0}>
            {loading ? '添加中...' : `添加${pendingFunds.length > 0 ? `（${pendingFunds.length}）` : ''}`}
          </button>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </section>

      <section className="funds-list">
        {/* ── Group tab bar ── */}
        <div className="group-tabs">
          {canScrollLeft && (
            <button className="group-tabs-arrow group-tabs-arrow-left" onClick={() => scrollTabs('left')} aria-label="向左滚动">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 5 7 10 13 15" />
              </svg>
            </button>
          )}
          <div
            className="group-tabs-scroll"
            ref={tabsScrollRef}
            onScroll={updateScrollState}
          >
            {groups.map((group) => {
              const isActive = group.id === resolvedActiveGroupId
              return (
                <button
                  key={group.id}
                  className={`group-tab${isActive ? ' active' : ''}`}
                  onClick={() => setActiveGroupId(group.id)}
                >
                  <span className="group-tab-name">{group.name}</span>
                  <span className="group-tab-count">{group.codes.length}</span>
                </button>
              )
            })}
          </div>
          {canScrollRight && (
            <button className="group-tabs-arrow group-tabs-arrow-right" onClick={() => scrollTabs('right')} aria-label="向右滚动">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7 5 13 10 7 15" />
              </svg>
            </button>
          )}
          <button className="group-tab-add" onClick={() => setShowGroupManager(true)} title="管理分组">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <line x1="10" y1="4" x2="10" y2="16" />
              <line x1="4" y1="10" x2="16" y2="10" />
            </svg>
          </button>
        </div>

        {/* ── Sort / view toolbar ── */}
        <div className="sort-bar">
          <span className="sort-label">排版方式</span>
          <div className="layout-toggle" role="group" aria-label="排版方式">
            <button
              className={`layout-btn ${layoutMode === 'normal' ? 'active' : ''}`}
              onClick={() => setLayoutMode('normal')}
              aria-pressed={layoutMode === 'normal'}
              title="普通"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="3" width="5" height="5" rx="1.2" />
                <rect x="12" y="3" width="5" height="5" rx="1.2" />
                <rect x="3" y="12" width="5" height="5" rx="1.2" />
                <rect x="12" y="12" width="5" height="5" rx="1.2" />
              </svg>
            </button>
            <button
              className={`layout-btn ${layoutMode === 'compact' ? 'active' : ''}`}
              onClick={() => setLayoutMode('compact')}
              aria-pressed={layoutMode === 'compact'}
              title="简洁"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="4" width="14" height="2" rx="1" />
                <rect x="3" y="9" width="14" height="2" rx="1" />
                <rect x="3" y="14" width="14" height="2" rx="1" />
              </svg>
            </button>
            <button
              className={`layout-btn ${layoutMode === 'minimal' ? 'active' : ''}`}
              onClick={() => setLayoutMode('minimal')}
              aria-pressed={layoutMode === 'minimal'}
              title="极简"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="4" y="6" width="12" height="2" rx="1" />
                <rect x="4" y="12" width="12" height="2" rx="1" />
              </svg>
            </button>
          </div>
          <div className="sort-separator" />
          <span className="sort-label">排序</span>
          <button
            className={`sort-btn ${sortKey === 'name' ? 'active' : ''}`}
            onClick={() => {
              if (sortKey === 'name') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
              } else {
                setSortKey('name')
                setSortOrder('asc')
              }
            }}
          >
            名称
            {sortKey === 'name' && (
              <span className="sort-arrow">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            className={`sort-btn ${sortKey === 'rate' ? 'active' : ''}`}
            onClick={() => {
              if (sortKey === 'rate') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
              } else {
                setSortKey('rate')
                setSortOrder('desc')
              }
            }}
          >
            当日收益率
            {sortKey === 'rate' && (
              <span className="sort-arrow">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button            className={`sort-btn ${sortKey === 'holding_gain_rate' ? 'active' : ''}`}
            onClick={() => {
              if (sortKey === 'holding_gain_rate') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
              } else {
                setSortKey('holding_gain_rate')
                setSortOrder('desc')
              }
            }}
          >
            持有收益率
            {sortKey === 'holding_gain_rate' && (
              <span className="sort-arrow">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button            className={`sort-btn ghost ${sortKey === 'none' ? 'active' : ''}`}
            onClick={() => setSortKey('none')}
          >
            默认
          </button>
        </div>

        {/* ── Active group content ── */}
        {(() => {
          const activeGroup = groups.find((g) => g.id === resolvedActiveGroupId)
          if (!activeGroup) return null
          const groupFunds = sortFunds(
            activeGroup.codes
              .map((code) => funds.find((f) => f.code === code))
              .filter((f): f is Fund => !!f),
            activeGroup.holdings
          )
          const groupLoadingCodes = loadingCodes.filter((c) => activeGroup.codes.includes(c))
          const otherGroups = groups.filter((g) => g.id !== resolvedActiveGroupId)

          // Compute rank map when sorted by holding gain rate
          const rankMap: Record<string, number> = {}
          if (sortKey === 'holding_gain_rate') {
            let rank = 0
            for (const fund of groupFunds) {
              if (getHoldingGainRate(fund, activeGroup.holdings) !== null) {
                rankMap[fund.code] = ++rank
              }
            }
          }

          if (groupFunds.length === 0 && groupLoadingCodes.length === 0 && fundCodes.length === 0) {
            return (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 17l4-8 4 4 3-5 4 9H3zM21 7l-3 3-2-2-3 3" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p>暂无基金，请在上方输入6位基金代码添加</p>
                <small>示例：161725（白酒ETF）、050025（博时标普500）</small>
              </div>
            )
          }

          return (
            <>
              {groupFunds.map((fund) => (
                <FundCard
                  key={fund.code}
                  fund={fund}
                  onRemove={handleRemove}
                  layoutMode={layoutMode}
                  otherGroups={otherGroups.length > 0 ? otherGroups : undefined}
                  onMoveFund={otherGroups.length > 0 ? (code, toGroupId) => handleMoveFund(code, activeGroup.id, toGroupId) : undefined}
                  holdingShares={activeGroup.holdings?.[fund.code]?.shares}
                  holdingCost={activeGroup.holdings?.[fund.code]?.cost}
                  onSetHolding={handleSetHolding}
                  onBatchSetHolding={handleBatchSetHolding}
                  rank={rankMap[fund.code]}
                  privacyMode={privacyMode}
                />
              ))}
              {groupLoadingCodes.map((code) => (
                <FundCardSkeleton key={`skel-${code}`} code={code} layoutMode={layoutMode} />
              ))}
              {groupFunds.length === 0 && groupLoadingCodes.length === 0 && (
                <div className="group-empty">此分组暂无基金</div>
              )}
            </>
          )
        })()}
      </section>

      {showGroupManager && (
        <div className="dialog-overlay" onClick={() => setShowGroupManager(false)}>
          <div className="dialog gm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="gm-header">
              <h3 className="dialog-title">管理分组</h3>
              <button className="gm-close" onClick={() => setShowGroupManager(false)} aria-label="关闭">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>

            <table className="gm-table">
              <thead>
                <tr>
                  <th>分组名称</th>
                  <th className="gm-th-num">基金数</th>
                  <th className="gm-th-ops">操作</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, idx) => (
                  <tr key={g.id} className={g.id === resolvedActiveGroupId ? 'gm-row-active' : ''}>
                    <td className="gm-td-name">
                      {gmEditingId === g.id ? (
                        <input
                          className="gm-name-input"
                          value={gmEditingName}
                          autoFocus
                          onChange={(e) => setGmEditingName(e.target.value)}
                          onBlur={() => gmCommit(g.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); e.stopPropagation(); gmCommit(g.id) }
                            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setGmEditingId(''); setGmEditingName('') }
                          }}
                        />
                      ) : (
                        <span
                          className="gm-name-text"
                          title="双击重命名"
                          onDoubleClick={() => { setGmEditingId(g.id); setGmEditingName(g.name) }}
                        >{g.name}</span>
                      )}
                    </td>
                    <td className="gm-td-num">{g.codes.length}</td>
                    <td className="gm-td-ops">
                      <button
                        className="gm-btn"
                        title="重命名"
                        onClick={() => { setGmEditingId(g.id); setGmEditingName(g.name) }}
                      >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2.5l3 3L5 18H2v-3L14.5 2.5z" />
                        </svg>
                      </button>
                      <button
                        className="gm-btn"
                        title="上移"
                        disabled={idx === 0}
                        onClick={() => handleMoveGroup(g.id, 'up')}
                      >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="4 13 10 7 16 13" />
                        </svg>
                      </button>
                      <button
                        className="gm-btn"
                        title="下移"
                        disabled={idx === groups.length - 1}
                        onClick={() => handleMoveGroup(g.id, 'down')}
                      >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="4 7 10 13 16 7" />
                        </svg>
                      </button>
                      {groups.length > 1 && (
                        <button
                          className="gm-btn gm-btn-delete"
                          title="删除分组"
                          onClick={() => {
                            handleDeleteGroup(g.id)
                          }}
                        >
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 6 16 6" />
                            <path d="M7 6V4h6v2" />
                            <path d="M5 6l1 11h8l1-11" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="gm-add-row">
              <input
                ref={newGroupInputRef}
                className="gm-add-input"
                placeholder="输入新分组名称…"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleNewGroupConfirm()
                  if (e.key === 'Escape') setNewGroupName('')
                }}
              />
              <button
                className="primary gm-add-btn"
                onClick={handleNewGroupConfirm}
                disabled={!newGroupName.trim()}
              >
                + 新建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

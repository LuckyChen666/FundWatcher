import { useEffect, useState } from 'react'
import type { Fund } from '../types/fund'
import { fetchTopHoldings } from '../services/fundApi'

interface FundCardProps {
  fund: Fund
  onRemove: (code: string) => void
  layoutMode: 'normal' | 'compact' | 'minimal'
  otherGroups?: { id: string; name: string }[]
  onMoveFund?: (code: string, toGroupId: string) => void
  holdingShares?: number  // 存储层：份额（静态）
  holdingCost?: number    // 存储层：持仓成本（静态）
  onSetHolding?: (code: string, field: 'shares' | 'cost', value: number | undefined) => void
  onBatchSetHolding?: (code: string, shares: number, cost: number) => void
  rank?: number
  privacyMode?: boolean
}

export function FundCard({ fund, onRemove, layoutMode, otherGroups, onMoveFund, holdingShares, holdingCost, onSetHolding, onBatchSetHolding, rank, privacyMode }: FundCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [holdings, setHoldings] = useState(fund.topHoldings || [])
  const [loading, setLoading] = useState(false)
  const [editingAmount, setEditingAmount] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [editingGain, setEditingGain] = useState(false)
  const [gainInput, setGainInput] = useState('')
  const [showMoveSheet, setShowMoveSheet] = useState(false)

  const isPositive = parseFloat(fund.estimatedRate) >= 0
  const rateClass = isPositive ? 'positive' : 'negative'

  // 展示层：持有金额 = 份额 × 昨日净值（确认值），今日盈亏用估值涨跌幅推算
  const netPrice = parseFloat(fund.netValue)
  const validNetPrice = !isNaN(netPrice) && netPrice > 0
  const holdingAmount = holdingShares != null && validNetPrice ? holdingShares * netPrice : null
  const profit = holdingAmount != null ? holdingAmount * parseFloat(fund.estimatedRate || '0') / 100 : null
  const holdingGain = holdingAmount != null && holdingCost != null ? holdingAmount - holdingCost : null
  const holdingGainRate = holdingGain != null && holdingCost != null && holdingCost > 0
    ? (holdingGain / holdingCost) * 100 : null

  // 用户输入「持有金额」→ 转存为份额 = 金额 ÷ 昨日净值
  // 若已有成本，按金额变化量同步调整成本，保持持有收益不变
  const commitAmount = () => {
    const val = amountInput.trim().replace(/,/g, '')
    const n = parseFloat(val)
    if (!val || isNaN(n) || n < 0) {
      onSetHolding?.(fund.code, 'shares', undefined)
    } else if (validNetPrice) {
      const newShares = n / netPrice
      if (holdingCost != null && holdingAmount != null) {
        const delta = n - holdingAmount
        onBatchSetHolding?.(fund.code, newShares, holdingCost + delta)
      } else {
        onSetHolding?.(fund.code, 'shares', newShares)
      }
    }
    setEditingAmount(false)
  }

  // 用户输入「持有收益」→ 转存为成本 = 当前持有金额 − 收益
  const commitGain = () => {
    const val = gainInput.trim().replace(/,/g, '')
    const n = parseFloat(val)
    if (!val || isNaN(n)) {
      onSetHolding?.(fund.code, 'cost', undefined)
    } else if (holdingAmount != null) {
      onSetHolding?.(fund.code, 'cost', holdingAmount - n)
    }
    setEditingGain(false)
  }

  const handleExpand = async () => {
    if (!expanded && holdings.length === 0) {
      setLoading(true)
      const data = await fetchTopHoldings(fund.code)
      setHoldings(data)
      setLoading(false)
    }
    setExpanded(!expanded)
  }

  useEffect(() => {
    if (!showMoveSheet) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMoveSheet(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [showMoveSheet])

  return (
    <div className={`fund-card layout-${layoutMode} ${isPositive ? 'card-up' : 'card-down'}`}>
      {/* ── 顶部：名称 + 涨跌幅 + 删除 ── */}
      <div className="fund-header">
        {rank != null && (
          <div className={`fund-rank${rank <= 3 ? ` fund-rank-top${rank}` : ''}`}>
            {rank}
          </div>
        )}
        <div className="fund-info">
          <h3>{fund.name}</h3>
          <div className="fund-meta-row">
            <span className="fund-code">{fund.code}</span>
            {fund.lastUpdateDate && (
              <span className="fund-date">{fund.lastUpdateDate}</span>
            )}
          </div>
        </div>
        <div className="fund-right">
          <span className="rate-label">涨跌幅</span>
          <span className={`rate-badge ${rateClass}`}>
            {isPositive ? '+' : ''}{fund.estimatedRate}%
          </span>
          {otherGroups && otherGroups.length > 0 && onMoveFund && (
            <button
              className="btn-move"
              onClick={() => setShowMoveSheet(true)}
              aria-label="移动到其他分组"
              title="移动到其他分组"
              type="button"
            >
              移至
            </button>
          )}
          <button className="btn-remove" onClick={() => onRemove(fund.code)} aria-label="删除">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 行1：市场数据  行2：持仓数据 ── */}
      {layoutMode !== 'minimal' && (
        <div className="fund-values">
          {/* 市场行：净值 → 估值 + 估值时间 */}
          <div className="values-row values-row--market">
            <div className="value-block value-block-nav">
              <span className="value-label">昨日净值</span>
              <span className="value-num value-num-muted">{fund.netValue || '—'}</span>
            </div>
            <div className="value-nav-arrow" aria-hidden="true">→</div>
            <div className="value-block">
              <span className="value-label">今日估值</span>
              <span className={`value-num ${isPositive ? 'positive' : 'negative'}`}>{fund.estimatedValue}</span>
            </div>
            <div className="value-block value-block-time">
              <span className="value-label">估值时间</span>
              <span className="value-num value-num-muted">{fund.estimatedTime || '—'}</span>
            </div>
          </div>
          {/* 持仓行：金额 | 收益 | 今日盈亏 | 收益率 */}
          <div className="values-row values-row--holding">
            <div className="value-block">
              <span className="value-label">持有金额</span>
              {editingAmount ? (
                <input
                  className="holding-input"
                  value={amountInput}
                  autoFocus
                  placeholder="如 10000"
                  onChange={(e) => setAmountInput(e.target.value)}
                  onBlur={commitAmount}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitAmount()
                    if (e.key === 'Escape') setEditingAmount(false)
                  }}
                />
              ) : (
                <span
                  className="value-num holding-amount"
                  onClick={() => { setAmountInput(holdingAmount != null ? holdingAmount.toFixed(2) : ''); setEditingAmount(true) }}
                  title="点击设置持有金额"
                >
                  {holdingAmount != null
                    ? (privacyMode ? <span className="holding-masked">¥ ••••</span> : `¥${holdingAmount.toFixed(2)}`)
                    : <span className="holding-unset">点击设置</span>}
                </span>
              )}
            </div>
            <div className="value-divider" />
            <div className="value-block">
              <span className="value-label">持有收益</span>
              {editingGain ? (
                <input
                  className="holding-input"
                  value={gainInput}
                  autoFocus
                  placeholder="如 500 或 -200"
                  onChange={(e) => setGainInput(e.target.value)}
                  onBlur={commitGain}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitGain()
                    if (e.key === 'Escape') setEditingGain(false)
                  }}
                />
              ) : (
                <span
                  className={`value-num holding-amount${holdingGain != null ? (holdingGain >= 0 ? ' positive' : ' negative') : ''}`}
                  onClick={() => { setGainInput(holdingGain != null ? holdingGain.toFixed(2) : ''); setEditingGain(true) }}
                  title="点击设置持有收益"
                >
                  {holdingGain != null
                    ? (privacyMode ? <span className="holding-masked">¥ ••••</span> : `${holdingGain >= 0 ? '+' : '−'}¥${Math.abs(holdingGain).toFixed(2)}`)
                    : <span className="holding-unset">点击设置</span>}
                </span>
              )}
            </div>
            {holdingGain != null && (
              <>
                <div className="value-divider" />
                <div className="value-block">
                  <span className="value-label">持有收益率</span>
                  <span className={`value-num value-num-highlight ${holdingGain >= 0 ? 'positive' : 'negative'}`}>
                    {holdingGainRate != null
                      ? (privacyMode ? <span className="holding-masked">••••</span> : `${holdingGainRate >= 0 ? '+' : ''}${holdingGainRate.toFixed(2)}%`)
                      : '—'}
                  </span>
                </div>
              </>
            )}
            {profit != null && (
              <>
                <div className="value-divider value-divider--push" />
                <div className="value-block">
                  <span className="value-label">今日盈亏</span>
                  <span className={`value-num value-num-highlight ${profit >= 0 ? 'positive' : 'negative'}`}>
                    {privacyMode ? <span className="holding-masked">¥ ••••</span> : `${profit >= 0 ? '+' : '−'}¥${Math.abs(profit).toFixed(2)}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {layoutMode === 'normal' && (
        <>
          <button className={`btn-expand ${expanded ? 'expanded' : ''}`} onClick={handleExpand}>
            {expanded ? '收起重仓股' : '查看前10重仓股'}
            <svg viewBox="0 0 24 24" aria-hidden="true" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {expanded && (
            <div className="holdings">
              {loading ? (
                <p className="loading">加载中...</p>
              ) : holdings.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>股票名称</th>
                      <th>代码</th>
                      <th>占比</th>
                      <th>涨跌幅</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding, idx) => {
                      const changeVal = holding.changePercent !== undefined ? parseFloat(holding.changePercent) : null
                      const changeClass = changeVal !== null ? (changeVal >= 0 ? 'stock-up' : 'stock-down') : ''
                      return (
                        <tr key={idx}>
                          <td>{holding.stockName}</td>
                          <td><span className="fund-code">{holding.stockCode}</span></td>
                          <td>{holding.ratio ? `${parseFloat(holding.ratio).toFixed(2)}%` : '—'}</td>
                          <td className={changeClass}>
                            {changeVal === null ? '—' : `${changeVal >= 0 ? '+' : ''}${holding.changePercent}%`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">暂无持仓数据</p>
              )}
            </div>
          )}
        </>
      )}

      {showMoveSheet && otherGroups && otherGroups.length > 0 && onMoveFund && (
        <div className="move-sheet-overlay" onClick={() => setShowMoveSheet(false)}>
          <div className="move-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="move-sheet-handle" aria-hidden="true" />
            <div className="move-sheet-title">移至其他分组</div>
            <div className="move-sheet-list">
              {otherGroups.map((g) => (
                <button
                  key={g.id}
                  className="move-sheet-item"
                  type="button"
                  onClick={() => {
                    onMoveFund(fund.code, g.id)
                    setShowMoveSheet(false)
                  }}
                >
                  {g.name}
                </button>
              ))}
            </div>
            <button className="move-sheet-cancel" type="button" onClick={() => setShowMoveSheet(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import type { Fund, TopHolding } from '../types/fund'

const isProd = import.meta.env.PROD
const FUND_API_BASE = isProd ? 'https://fundgz.1234567.com.cn' : '/api/fund'
const EASTMONEY_API_BASE = isProd ? 'https://fundf10.eastmoney.com' : '/api/eastmoney'
const QTIMG_API_BASE = isProd ? 'https://qt.gtimg.cn' : '/api/qtimg'

type JsonpgzPayload = {
  fundcode?: string
  name?: string
  dwjz?: string
  gsz?: string
  gszzl?: string
  gztime?: string
  jzrq?: string
}

type FundJsonpTask = {
  code: string
  resolve: (value: Fund | null) => void
}

let fundJsonpRunning = false
const fundJsonpQueue: FundJsonpTask[] = []

function payloadToFund(data: JsonpgzPayload): Fund | null {
  if (!data.fundcode || !data.name) return null
  return {
    code: data.fundcode,
    name: data.name,
    netValue: data.dwjz || '0.0000',
    estimatedValue: data.gsz || '0.0000',
    estimatedRate: data.gszzl || '0.00',
    estimatedTime: data.gztime || '',
    lastUpdateDate: data.jzrq || '',
    topHoldings: [],
  }
}

function runNextFundJsonpTask() {
  if (fundJsonpRunning || fundJsonpQueue.length === 0) return
  const task = fundJsonpQueue.shift()
  if (!task) return

  fundJsonpRunning = true
  const { code, resolve } = task
  const cbName = 'jsonpgz'
  const prevCallback = (window as unknown as Record<string, unknown>)[cbName]

  const finish = (result: Fund | null) => {
    clearTimeout(timer)
    // 安全地恢复或清理回调（避免在严格模式下 delete 报错）
    try {
      if (typeof prevCallback === 'function') {
        ;(window as unknown as Record<string, unknown>)[cbName] = prevCallback
      } else {
        ;(window as unknown as Record<string, unknown>)[cbName] = undefined
      }
    } catch (e) {
      console.warn('[runNextFundJsonpTask] cleanup callback failed:', e)
    }
    if (script.parentNode) script.parentNode.removeChild(script)
    fundJsonpRunning = false
    resolve(result)
    runNextFundJsonpTask()
  }

  ;(window as unknown as Record<string, unknown>)[cbName] = (data: JsonpgzPayload) => {
    finish(payloadToFund(data))
  }

  const script = document.createElement('script')
  script.src = `${FUND_API_BASE}/js/${code}.js?rt=${Date.now()}`
  script.async = true
  script.onerror = () => finish(null)

  const timer = window.setTimeout(() => finish(null), 8000)
  document.body.appendChild(script)
}

function fetchFundEstimateByJsonp(code: string): Promise<Fund | null> {
  return new Promise((resolve) => {
    fundJsonpQueue.push({ code, resolve })
    runNextFundJsonpTask()
  })
}

type EastmoneyApiData = { content?: string }
let eastmoneyTaskChain: Promise<unknown> = Promise.resolve()

function fetchEastmoneyByScript(code: string): Promise<string | null> {
  const job = new Promise<string | null>((resolve) => {
    const prevApiData = (window as unknown as Record<string, unknown>).apidata
    const script = document.createElement('script')
    script.src = `${EASTMONEY_API_BASE}/FundArchivesDatas.aspx?type=jjcc&code=${code}&page=1&per=10&topline=10&_=${Date.now()}`
    script.async = true
    script.referrerPolicy = 'no-referrer'

    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script)
      // 安全地恢复或清理 apidata（避免在严格模式下 delete 报错）
      try {
        if (prevApiData === undefined) {
          ;(window as unknown as Record<string, unknown>).apidata = undefined
        } else {
          ;(window as unknown as Record<string, unknown>).apidata = prevApiData
        }
      } catch (e) {
        console.warn('[fetchEastmoneyByScript] cleanup apidata failed:', e)
      }
      clearTimeout(timer)
    }

    const finish = (html: string | null) => {
      cleanup()
      resolve(html)
    }

    script.onload = () => {
      const data = (window as unknown as Record<string, unknown>).apidata as EastmoneyApiData | undefined
      finish(typeof data?.content === 'string' ? data.content : null)
    }
    script.onerror = () => finish(null)

    const timer = window.setTimeout(() => finish(null), 8000)
    document.body.appendChild(script)
  })

  const chained = eastmoneyTaskChain.then(() => job, () => job)
  eastmoneyTaskChain = chained.then(() => undefined, () => undefined)
  return chained
}

export interface FundSearchResult {
  code: string
  name: string
  type: string
}

/**
 * 搜索基金（JSONP script 注入，绕过 CORS）
 * 使用东方财富搜索接口，最多返回 5 条
 */
export function searchFunds(keyword: string): Promise<FundSearchResult[]> {
  const kw = keyword.trim()
  if (!kw) return Promise.resolve([])

  return new Promise((resolve) => {
    const cbName = `_fscb_${Date.now()}`
    const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(kw)}&callback=${cbName}&_=${Date.now()}`

    const timer = setTimeout(() => {
      cleanup()
      resolve([])
    }, 5000)

    const cleanup = () => {
      clearTimeout(timer)
      // 安全地清理回调（避免在严格模式下 delete 报错）
      try {
        ;(window as unknown as Record<string, unknown>)[cbName] = undefined
      } catch (e) {
        console.warn('[searchFunds] cleanup callback failed:', e)
      }
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    ;(window as unknown as Record<string, unknown>)[cbName] = (data: { Datas?: Array<{ CODE: string; NAME: string; CATEGORYDESC?: string; CATEGORY?: number | string }> }) => {
      cleanup()
      const datas = data?.Datas ?? []
      const funds = datas.filter((d) => d.CATEGORYDESC === '基金' || d.CATEGORY === 700 || d.CATEGORY === '700')
      resolve(
        funds.slice(0, 5).map((d) => ({
          code: d.CODE,
          name: d.NAME,
          type: d.CATEGORYDESC ?? '',
        }))
      )
    }

    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onerror = () => { cleanup(); resolve([]) }
    document.body.appendChild(script)
  })
}

/**
 * 预加载（JSONP 方案无需预加载，保留接口兼容）
 */
export function preloadFundList(): void {}

/**
 * 获取基金实时估值信息
 * 使用天天基金的公开接口；无估值时返回 null
 */
export async function fetchFundEstimate(code: string): Promise<Fund | null> {
  if (isProd) {
    return fetchFundEstimateByJsonp(code)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(
      `${FUND_API_BASE}/js/${code}.js?rt=${Date.now()}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error('Failed to fetch fund:', code, response.status)
      return null
    }
    
    const text = await response.text()
    
    // 解析 JSONP 格式：jsonpgz({"fundcode":"161725",...});
    const jsonMatch = text.match(/jsonpgz\((.*)\)/)
    if (!jsonMatch || !jsonMatch[1].trim()) {
      // 空响应（如未披露持仓的新基金），返回 null
      return null
    }

    const data = JSON.parse(jsonMatch[1]) as JsonpgzPayload
    return payloadToFund(data)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('Fund fetch timed out:', code)
      return null
    }
    console.error('Failed to fetch fund estimate:', code, error)
    return null
  }
}

// Backward-compatible alias for existing hooks/imports.
export const fetchFundData = fetchFundEstimate

/**
 * 将东方财富 secid 转换为腾讯行情代码
 * 1.600519 → sh600519, 0.000858 → sz000858, 116.00700 → hk00700
 */
function secidToQQCode(secid: string): string | null {
  const [market, code] = secid.split('.')
  if (!market || !code) return null
  const m = Number(market)
  if (m === 1) return `sh${code}`
  if (m === 0 || m === 51) return `sz${code}`
  if (m === 116) return `hk${code}`
  return null // 美股等暂不支持
}

/**
 * 批量获取股票实时涨跌幅，使用腾讯行情接口
 * 返回 map: qqCode (如 "sh600519") → 涨跌幅字符串 (如 "-1.71")
 */
async function fetchStockChangePercents(qqCodes: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (qqCodes.length === 0) return map
  try {
    const resp = await fetch(`${QTIMG_API_BASE}/q=${qqCodes.join(',')}`)
    if (!resp.ok) return map
    const text = await resp.text()
    // 每行格式: v_sh600519="1~茅台~600519~price~prevClose~open~...~changeAmt~changePercent~..."
    for (const line of text.split('\n')) {
      const match = line.match(/^v_(\w+)="(.+)"/) 
      if (!match) continue
      const qqCode = match[1]   // 如 sh600519
      const fields = match[2].split('~')
      const changePercent = fields[32]  // 涨跌幅%（field31=涨跌额, field32=涨跌幅）
      if (changePercent !== undefined && changePercent !== '' && !isNaN(Number(changePercent))) {
        map.set(qqCode, changePercent)
      }
    }
  } catch (e) {
    console.warn('QQ stock quote fetch failed', e)
  }
  return map
}

/**
 * 获取基金前10重仓股票
 * 使用东方财富 fundf10 接口
 * 返回格式：var apidata={ content:"<table>...</table>", ... }
 */
export async function fetchTopHoldings(code: string): Promise<TopHolding[]> {
  try {
    let html = ''
    if (isProd) {
      const content = await fetchEastmoneyByScript(code)
      if (!content) {
        console.warn('Holdings API failed in production mode')
        return []
      }
      html = content
    } else {
      const response = await fetch(
        `${EASTMONEY_API_BASE}/FundArchivesDatas.aspx?type=jjcc&code=${code}&page=1&per=10&topline=10&_=${Date.now()}`
      )

      if (!response.ok) {
        console.warn('Holdings API failed:', response.status)
        return []
      }

      const text = await response.text()

      // 响应格式: var apidata={ content:"<table>...</table>", arryear:[...], curyear:"" }
      const contentMatch = text.match(/content:\s*"(.*?)",\s*arryear/s)
      if (!contentMatch) {
        console.warn('Holdings: unexpected response format', text.substring(0, 200))
        return []
      }

      // 反转义 HTML 内容
      html = contentMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\\//g, '/')
        .replace(/\\n/g, '')
        .replace(/\\t/g, '')
    }

    const holdings: TopHolding[] = []

    // 匹配 <tr> 行：序号 | 股票代码 | 股票名称 | 占净值比 | 持股数 | 持仓市值
    const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi
    const rows = html.match(rowRegex) || []
    console.log(`[fetchTopHoldings] 基金 ${code} 找到 ${rows.length} 行数据`)

    for (const row of rows) {
      // 跳过表头
      if (/<th/i.test(row)) continue

      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
      const cells: string[] = []
      let m
      while ((m = tdRegex.exec(row)) !== null) {
        // 去除 HTML 标签提取纯文本
        cells.push(m[1].replace(/<[^>]+>/g, '').trim())
      }

      // 列顺序根据季度报表不同有两种格式：
      // 最新季度(9列): 序号(0) 代码(1) 名称(2) 最新价(3) 涨跌幅(4) 相关资讯(5) 占净值比例(6) 持股数(7) 持仓市值(8)
      // 往期季度(7列): 序号(0) 代码(1) 名称(2) 相关资讯(3) 占净值比例(4) 持股数(5) 持仓市值(6)
      if (cells.length < 6) continue

      const is9Column = cells.length >= 9
      const ratioIndex = is9Column ? 6 : 4
      const sharesIndex = is9Column ? 7 : 5
      const valueIndex = is9Column ? 8 : 6

      const ratio = cells[ratioIndex].replace('%', '')
      if (!cells[1] || !cells[2] || isNaN(Number(ratio))) continue

      // 从 href 中提取 secid，如 "1.600519"、"116.00700"
      const secidMatch = row.match(/quote\.eastmoney\.com\/unify\/r\/(\d+\.[\w.]+)/)
      const secid = secidMatch ? secidMatch[1] : ''

      holdings.push({
        stockCode: cells[1],
        stockName: cells[2],
        ratio,
        shares: cells[sharesIndex] || '0',
        value: cells[valueIndex] || '0',
        changePercent: undefined,
        _secid: secid,
      } as TopHolding & { _secid: string })

      if (holdings.length >= 10) break
    }

    if (holdings.length === 0) {
      console.warn(`[fetchTopHoldings] 基金 ${code} 未解析到任何持仓数据`)
      return []
    }

    console.log(`[fetchTopHoldings] 基金 ${code} 成功解析 ${holdings.length} 只股票`)

    // 批量获取实时涨跌幅（腾讯行情接口）
    const qqCodesMap = new Map<string, string>() // qqCode → stockCode
    for (const h of holdings as Array<TopHolding & { _secid: string }>) {
      const qq = secidToQQCode(h._secid)
      if (qq) qqCodesMap.set(qq, h.stockCode)
    }
    const changeMap = await fetchStockChangePercents([...qqCodesMap.keys()])

    return (holdings as Array<TopHolding & { _secid: string }>).map(({ _secid, ...h }) => {
      const qq = secidToQQCode(_secid)
      return { ...h, changePercent: qq ? changeMap.get(qq) : undefined }
    })
  } catch (error) {
    console.error('Failed to fetch top holdings:', code, error)
    return []
  }
}

/**
 * 批量获取多个基金的估值信息
 */
export async function fetchMultipleFunds(codes: string[]): Promise<Fund[]> {
  const results = await Promise.all(codes.map((code) => fetchFundEstimate(code)))
  return results.filter((fund): fund is Fund => fund !== null)
}

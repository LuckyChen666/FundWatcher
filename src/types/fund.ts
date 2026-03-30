export interface Fund {
  code: string
  name: string
  netValue: string // 最新净值
  estimatedValue: string // 估值
  estimatedRate: string // 估值涨幅百分比
  estimatedTime: string // 估值时间
  lastUpdateDate: string // 净值日期
  topHoldings?: TopHolding[] // 前10重仓股票
}

export interface TopHolding {
  stockCode: string
  stockName: string
  ratio: string // 占比百分比
  shares: string // 持股数量（万股）
  value: string // 持股市值（万元）
  changePercent?: string // 股票涨跌幅
}

export interface FundGroup {
  id: string
  name: string
  codes: string[]
  holdings?: Record<string, { shares?: number; cost?: number }> // code → 持有份额(静态)/持仓成本(静态)
}

export interface FundDetail {
  code: string
  name: string
  type: string
  netValue: string
  estimatedValue: string
  estimatedRate: string
  estimatedTime: string
  lastUpdateDate: string
  dayGrowth: string // 日增长率
  topHoldings: TopHolding[]
}

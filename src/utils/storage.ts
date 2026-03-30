import type { Fund } from '../types/fund'

const STORAGE_KEY = 'fundwatcher_funds'

export const storage = {
  // 获取所有基金
  getFunds(): Fund[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  // 保存所有基金
  saveFunds(funds: Fund[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(funds))
    } catch (error) {
      console.error('Failed to save funds to localStorage:', error)
    }
  },

  // 添加单个基金
  addFund(fund: Fund): Fund[] {
    const funds = this.getFunds()
    const exists = funds.find((f) => f.code === fund.code)
    if (exists) {
      return funds
    }
    const updated = [...funds, fund]
    this.saveFunds(updated)
    return updated
  },

  // 删除基金
  removeFund(code: string): Fund[] {
    const funds = this.getFunds()
    const updated = funds.filter((f) => f.code !== code)
    this.saveFunds(updated)
    return updated
  },

  // 更新基金数据
  updateFund(code: string, updates: Partial<Fund>): Fund[] {
    const funds = this.getFunds()
    const updated = funds.map((f) => (f.code === code ? { ...f, ...updates } : f))
    this.saveFunds(updated)
    return updated
  },

  // 清空所有基金
  clearFunds(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}

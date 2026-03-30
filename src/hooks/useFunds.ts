import { useEffect, useState, useCallback } from 'react'
import type { Fund } from '../types/fund'
import { storage } from '../utils/storage'
import { fetchFundData, fetchMultipleFunds } from '../services/fundApi'

const REFRESH_INTERVAL = 30000 // 30秒

export function useFunds() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初始化：从 localStorage 加载
  useEffect(() => {
    const saved = storage.getFunds()
    setFunds(saved)
    
    // 首次加载时刷新数据
    if (saved.length > 0) {
      refreshAllFunds(saved.map((f) => f.code))
    }
  }, [])

  // 刷新所有基金数据
  const refreshAllFunds = useCallback(async (codes: string[]) => {
    if (codes.length === 0) return

    try {
      setLoading(true)
      setError(null)
      const updatedFunds = await fetchMultipleFunds(codes)
      
      // 合并到现有数据
      setFunds((prev) =>
        prev.map((f) => {
          const updated = updatedFunds.find((u) => u.code === f.code)
          return updated ? { ...f, ...updated } : f
        })
      )
      
      // 保存到 localStorage
      const merged = storage.getFunds().map((f) => {
        const updated = updatedFunds.find((u) => u.code === f.code)
        return updated ? { ...f, ...updated } : f
      })
      storage.saveFunds(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
      setLoading(false)
    }
  }, [])

  // 自动刷新定时器
  useEffect(() => {
    if (funds.length === 0) return

    const timer = setInterval(() => {
      refreshAllFunds(funds.map((f) => f.code))
    }, REFRESH_INTERVAL)

    return () => clearInterval(timer)
  }, [funds, refreshAllFunds])

  // 添加基金
  const addFund = useCallback(async (code: string) => {
    // 检查是否已存在
    if (funds.find((f) => f.code === code)) {
      setError('基金已存在')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const fundData = await fetchFundData(code)
      if (!fundData) {
        setError('未找到该基金，请检查代码')
        return
      }

      const updated = storage.addFund(fundData)
      setFunds(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fund')
    } finally {
      setLoading(false)
    }
  }, [funds])

  // 删除基金
  const removeFund = useCallback((code: string) => {
    const updated = storage.removeFund(code)
    setFunds(updated)
  }, [])

  // 手动刷新
  const refresh = useCallback(() => {
    refreshAllFunds(funds.map((f) => f.code))
  }, [funds, refreshAllFunds])

  return {
    funds,
    loading,
    error,
    addFund,
    removeFund,
    refresh,
  }
}

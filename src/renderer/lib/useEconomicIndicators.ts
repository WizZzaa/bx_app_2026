import { useState, useEffect, useCallback } from 'react'
import { loadIndicators } from './db/referenceRepo'
import type { Indicator } from '../data/reference/types'
import { todayISO } from './dates'

// Сверено 03.07.2026: БРВ и МРОТ — с 01.08.2025 (действуют на 2026),
// основная ставка ЦБ — 14% с 20.03.2025 (подтверждена заседаниями 2026).
const FALLBACK_VALUES: Record<string, number> = {
  brv: 412000,
  mrot: 1271000,
  refi: 14
}

const STORAGE_KEY = 'bx_cached_indicators'

export const useEconomicIndicators = () => {
  const [indicators, setIndicators] = useState<Indicator[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchIndicators = async () => {
      try {
        const { data } = await loadIndicators()
        if (active && data.length > 0) {
          setIndicators(data)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        }
      } catch (err) {
        console.warn('Failed to load online indicators, using local data', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    fetchIndicators()
    return () => {
      active = false
    }
  }, [])

  const getIndicatorValue = useCallback((key: string, dateStr?: string): number => {
    const targetDate = dateStr || todayISO()
    const ind = indicators.find(i => i.key === key)
    
    if (!ind || !ind.history || ind.history.length === 0) {
      return FALLBACK_VALUES[key] ?? 0
    }

    // Сортируем историю: новые (с наибольшей датой from) сверху
    const sortedHistory = [...ind.history].sort((a, b) => b.from.localeCompare(a.from))
    
    // Ищем запись, где from <= targetDate
    for (const val of sortedHistory) {
      if (val.from <= targetDate) {
        if (!val.to || val.to >= targetDate) {
          return val.value
        }
      }
    }

    // Если дата слишком ранняя, берем самое старое доступное значение
    if (sortedHistory.length > 0) {
      return sortedHistory[sortedHistory.length - 1].value
    }

    return FALLBACK_VALUES[key] ?? 0
  }, [indicators])

  const brv = getIndicatorValue('brv')
  const mrot = getIndicatorValue('mrot')
  const refi = getIndicatorValue('refi')

  return {
    indicators,
    loading,
    getIndicatorValue,
    brv,
    mrot,
    refi
  }
}

import { useState, useEffect, useCallback } from 'react'
import { db, type ExchangeRate } from './db/localDb'
import { widgetsApi } from './widgetsApi'

const DEFAULT_RATES: Record<string, number> = {
  UZS: 1,
  USD: 12850,
  EUR: 13900,
  RUB: 145
}

export const useExchangeRates = () => {
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratesList, setRatesList] = useState<ExchangeRate[]>([])

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setError(null)
    const today = new Date().toISOString().slice(0, 10)

    try {
      const data = await widgetsApi.getRates(['USD', 'EUR', 'RUB'])
      
      if (Array.isArray(data) && data.length > 0) {
        const parsedRates: Record<string, number> = { UZS: 1 }
        const list: ExchangeRate[] = []

        data.forEach((item: any) => {
          parsedRates[item.code] = item.value
          list.push({
            code: item.code,
            rate: item.value,
            date: item.date || today,
            diff: String(item.diff)
          })
        })

        // Сохраняем в локальную БД Dexie
        await db.exchange_rates.clear()
        await db.exchange_rates.bulkPut(list)

        setRates(parsedRates)
        setRatesList(list)
      } else {
        throw new Error('Получены пустые курсы')
      }
    } catch (err: any) {
      console.warn('Не удалось загрузить курсы валют из API, используем локальный кэш:', err)
      setError(err?.message || 'Ошибка загрузки курсов')
      
      try {
        const cached = await db.exchange_rates.toArray()
        if (cached.length > 0) {
          const parsedRates: Record<string, number> = { UZS: 1 }
          cached.forEach((item) => {
            parsedRates[item.code] = item.rate
          })
          setRates(parsedRates)
          setRatesList(cached)
        } else {
          setRates(DEFAULT_RATES)
        }
      } catch (dbErr) {
        console.error('Ошибка чтения курсов из Dexie:', dbErr)
        setRates(DEFAULT_RATES)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const convert = useCallback((amount: number, from: string, to: string): number => {
    const f = from === 'сум' ? 'UZS' : from
    const t = to === 'сум' ? 'UZS' : to
    if (f === t) return amount
    
    const fromRate = rates[f] || DEFAULT_RATES[f] || 1
    const toRate = rates[t] || DEFAULT_RATES[t] || 1
    
    const amountInUzs = amount * fromRate
    return amountInUzs / toRate
  }, [rates])

  return { rates, ratesList, loading, error, convert, refetch: fetchRates }
}

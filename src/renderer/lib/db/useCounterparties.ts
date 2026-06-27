import { useState, useEffect, useCallback } from 'react'
import { db, type BxCounterparty } from './localDb'


export type { BxCounterparty }
export type NewCounterparty = Omit<BxCounterparty, 'id' | 'created_at' | 'updated_at'>

export function useCounterparties(companyId?: string | null) {
  const [counterparties, setCounterparties] = useState<BxCounterparty[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let rows: BxCounterparty[] = []
      if (companyId) {
        rows = await db.counterparties
          .where('company_id')
          .equals(companyId)
          .toArray()
      } else {
        rows = await db.counterparties.toArray()
      }
      // Сортируем по имени
      rows.sort((a, b) => a.name.localeCompare(b.name))
      setCounterparties(rows)
    } catch (e) {
      console.error('[useCounterparties]', e)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    load()
  }, [load])

  const add = useCallback(async (input: NewCounterparty): Promise<BxCounterparty | null> => {
    const newCp: BxCounterparty = {
      ...input,
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    try {
      await db.counterparties.put(newCp)
      setCounterparties(prev => [...prev, newCp].sort((a, b) => a.name.localeCompare(b.name)))
      return newCp
    } catch (e) {
      console.error('[useCounterparties.add]', e)
      return null
    }
  }, [])

  const update = useCallback(async (id: string, patch: Partial<NewCounterparty>) => {
    const withTs = { ...patch, updated_at: new Date().toISOString() }
    try {
      const existing = await db.counterparties.get(id)
      if (existing) {
        const updated = { ...existing, ...withTs }
        await db.counterparties.put(updated)
        setCounterparties(prev => prev.map(c => c.id === id ? updated : c))
      }
    } catch (e) {
      console.error('[useCounterparties.update]', e)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    try {
      await db.counterparties.delete(id)
      setCounterparties(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      console.error('[useCounterparties.remove]', e)
    }
  }, [])

  return { counterparties, loading, reload: load, add, update, remove }
}

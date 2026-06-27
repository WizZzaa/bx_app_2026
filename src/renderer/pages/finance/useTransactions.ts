import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/db/supabase'
import { addToSyncQueue, syncOfflineData, getSyncQueue } from '../../lib/db/syncQueue'
import { db, type BxTransaction } from '../../lib/db/localDb'

export type { BxTransaction }
export type NewTransaction = Omit<BxTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>


export function useTransactions(companyId?: string | null) {
  const [transactions, setTransactions] = useState<BxTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<string>('')

  const handleSyncStatus = useCallback((status: string) => {
    setSyncStatus(status)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Сначала читаем локальный кэш из Dexie (IndexedDB)
      let localRows: BxTransaction[] = []
      if (companyId) {
        localRows = await db.transactions
          .where('company_id')
          .equals(companyId)
          .reverse()
          .sortBy('date')
      } else {
        localRows = await db.transactions
          .orderBy('date')
          .reverse()
          .toArray()
      }
      setTransactions(localRows)
      setLoading(false) // Сразу показываем локальные данные

      if (navigator.onLine) {
        if (getSyncQueue().length > 0) {
          await syncOfflineData(handleSyncStatus)
        }

        let q = supabase.from('bx_transactions').select('*').order('date', { ascending: false })
        if (companyId) q = q.eq('company_id', companyId)
        const { data, error } = await q
        if (error) throw error
        const rows = (data ?? []) as BxTransaction[]
        const localRows = rows.map(r => ({ ...r, last_synced_at: r.updated_at }))
        
        // Обновляем локальный кэш в Dexie
        if (companyId) {
          await db.transactions.where('company_id').equals(companyId).delete()
        } else {
          await db.transactions.clear()
        }
        if (localRows.length > 0) {
          await db.transactions.bulkPut(localRows)
        }
        
        setTransactions(rows)
        setSyncStatus('Синхронизировано')
      } else {
        setSyncStatus('Офлайн режим')
      }
    } catch (e) {
      console.error('[useTransactions]', e)
      setSyncStatus('Используется локальная БД')
    } finally {
      setLoading(false)
    }
  }, [companyId, handleSyncStatus])

  useEffect(() => {
    load()

    const handleOnline = () => {
      syncOfflineData(handleSyncStatus).then(() => {
        load()
      })
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [load, handleSyncStatus])

  const add = useCallback(async (input: NewTransaction): Promise<BxTransaction | null> => {
    const tempId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
    let userId = ''
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch (err) {
      console.warn('Не удалось получить пользователя для транзакции, оффлайн режим:', err)
    }

    const newTx: BxTransaction = {
      ...input,
      id: tempId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Сразу сохраняем локально в IndexedDB
    await db.transactions.put(newTx)
    setTransactions(prev => [newTx, ...prev])

    if (!navigator.onLine) {
      addToSyncQueue('transactions', 'insert', tempId, newTx)
      setSyncStatus(`Сохранено локально (ожидает сети: ${getSyncQueue().length})`)
      return newTx
    }

    try {
      const { data, error } = await supabase.from('bx_transactions').insert(newTx).select().single()
      if (error) throw error
      return data as BxTransaction
    } catch (err) {
      console.error('Ошибка вставки в Supabase, добавляем в очередь:', err)
      addToSyncQueue('transactions', 'insert', tempId, newTx)
      setSyncStatus(`Ошибка сети. В очереди синхронизации: ${getSyncQueue().length}`)
      return newTx
    }
  }, [])

  const update = useCallback(async (id: string, patch: Partial<NewTransaction>) => {
    const withTs = { ...patch, updated_at: new Date().toISOString() }
    
    // Сразу обновляем локально в IndexedDB
    const existing = await db.transactions.get(id)
    let lastSyncedAt: string | null = null
    if (existing) {
      lastSyncedAt = existing.last_synced_at ?? null
      const updated = { ...existing, ...withTs }
      await db.transactions.put(updated)
      setTransactions(prev => prev.map(t => t.id === id ? updated : t))
    }

    if (!navigator.onLine) {
      addToSyncQueue('transactions', 'update', id, withTs, lastSyncedAt)
      setSyncStatus(`Изменение сохранено локально (ожидает сети: ${getSyncQueue().length})`)
      return
    }

    try {
      const { error } = await supabase.from('bx_transactions').update(withTs).eq('id', id)
      if (error) throw error
      await db.transactions.update(id, { last_synced_at: withTs.updated_at })
    } catch (err) {
      console.error('Ошибка обновления в Supabase, добавляем в очередь:', err)
      addToSyncQueue('transactions', 'update', id, withTs, lastSyncedAt)
      setSyncStatus(`Ошибка сети. В очереди синхронизации: ${getSyncQueue().length}`)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    const existing = await db.transactions.get(id)
    const lastSyncedAt = existing ? (existing.last_synced_at ?? null) : null

    // Сразу удаляем локально из IndexedDB
    await db.transactions.delete(id)
    setTransactions(prev => prev.filter(t => t.id !== id))

    if (!navigator.onLine) {
      addToSyncQueue('transactions', 'delete', id, null, lastSyncedAt)
      setSyncStatus(`Удаление сохранено локально (ожидает сети: ${getSyncQueue().length})`)
      return
    }

    try {
      const { error } = await supabase.from('bx_transactions').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Ошибка удаления в Supabase, добавляем в очередь:', err)
      addToSyncQueue('transactions', 'delete', id, null, lastSyncedAt)
      setSyncStatus(`Ошибка сети. В очереди синхронизации: ${getSyncQueue().length}`)
    }
  }, [])

  return { transactions, loading, syncStatus, reload: load, add, update, remove }
}



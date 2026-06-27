import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/db/supabase'
import { addToSyncQueue, syncOfflineData, getSyncQueue } from '../../lib/db/syncQueue'
import { db } from '../../lib/db/localDb'

export interface BxEmployee {
  id: string
  user_id: string
  company_id: string | null
  full_name: string
  position: string | null
  department: string | null
  hire_date: string | null
  salary: number
  employment_type: 'основное' | 'совместительство' | 'договор ГПХ'
  status: 'active' | 'fired'
  pinfl: string | null
  inn: string | null
  phone: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export type NewEmployee = Omit<BxEmployee, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export function useEmployees(companyId?: string | null) {
  const [employees, setEmployees] = useState<BxEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<string>('')

  const handleSyncStatus = useCallback((status: string) => {
    setSyncStatus(status)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Читаем локальный кэш сотрудников из Dexie
      let localRows: BxEmployee[] = []
      if (companyId) {
        localRows = await db.employees
          .where('company_id')
          .equals(companyId)
          .sortBy('full_name')
      } else {
        localRows = await db.employees
          .orderBy('full_name')
          .toArray()
      }
      setEmployees(localRows)
      setLoading(false)

      if (navigator.onLine) {
        if (getSyncQueue().length > 0) {
          await syncOfflineData(handleSyncStatus)
        }

        let q = supabase.from('bx_employees').select('*').order('full_name', { ascending: true })
        if (companyId) q = q.eq('company_id', companyId)
        const { data, error } = await q
        if (error) throw error
        const rows = (data ?? []) as BxEmployee[]
        const localRows = rows.map(r => ({ ...r, last_synced_at: r.updated_at }))
        
        // Перезаписываем кэш в Dexie
        if (companyId) {
          await db.employees.where('company_id').equals(companyId).delete()
        } else {
          await db.employees.clear()
        }
        if (localRows.length > 0) {
          await db.employees.bulkPut(localRows)
        }
        
        setEmployees(rows)
        setSyncStatus('Синхронизировано')
      } else {
        setSyncStatus('Офлайн режим')
      }
    } catch (e) {
      console.error('[useEmployees]', e)
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

  const add = useCallback(async (input: NewEmployee): Promise<BxEmployee | null> => {
    const tempId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
    let userId = ''

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch (err) {
      console.warn('Не удалось получить пользователя для сотрудника, оффлайн режим:', err)
    }

    const newEmp: BxEmployee = {
      ...input,
      id: tempId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Сохраняем в Dexie
    await db.employees.put(newEmp)
    setEmployees(prev => [...prev, newEmp].sort((a, b) => a.full_name.localeCompare(b.full_name)))

    if (!navigator.onLine) {
      addToSyncQueue('employees', 'insert', tempId, newEmp)
      setSyncStatus(`Сотрудник сохранен локально (ожидает сети: ${getSyncQueue().length})`)
      return newEmp
    }

    try {
      const { data, error } = await supabase.from('bx_employees').insert(newEmp).select().single()
      if (error) throw error
      return data as BxEmployee
    } catch (err) {
      console.error('Ошибка добавления сотрудника в Supabase, добавляем в очередь:', err)
      addToSyncQueue('employees', 'insert', tempId, newEmp)
      setSyncStatus(`Ошибка сети. В очереди синхронизации: ${getSyncQueue().length}`)
      return newEmp
    }
  }, [])

  const update = useCallback(async (id: string, patch: Partial<NewEmployee>) => {
    const withTs = { ...patch, updated_at: new Date().toISOString() }

    // Обновляем в Dexie
    const existing = await db.employees.get(id)
    let lastSyncedAt: string | null = null
    if (existing) {
      lastSyncedAt = existing.last_synced_at ?? null
      const updated = { ...existing, ...withTs }
      await db.employees.put(updated)
      setEmployees(prev => prev.map(e => e.id === id ? updated : e))
    }

    if (!navigator.onLine) {
      addToSyncQueue('employees', 'update', id, withTs, lastSyncedAt)
      setSyncStatus(`Изменение сохранено локально (ожидает сети: ${getSyncQueue().length})`)
      return
    }

    try {
      const { error } = await supabase.from('bx_employees').update(withTs).eq('id', id)
      if (error) throw error
      await db.employees.update(id, { last_synced_at: withTs.updated_at })
    } catch (err) {
      console.error('Ошибка обновления сотрудника в Supabase, добавляем в очередь:', err)
      addToSyncQueue('employees', 'update', id, withTs, lastSyncedAt)
      setSyncStatus(`Ошибка сети. В очереди синхронизации: ${getSyncQueue().length}`)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    const existing = await db.employees.get(id)
    const lastSyncedAt = existing ? (existing.last_synced_at ?? null) : null

    // Удаляем из Dexie
    await db.employees.delete(id)
    setEmployees(prev => prev.filter(e => e.id !== id))

    if (!navigator.onLine) {
      addToSyncQueue('employees', 'delete', id, null, lastSyncedAt)
      setSyncStatus(`Удаление сохранено локально (ожидает сети: ${getSyncQueue().length})`)
      return
    }

    try {
      const { error } = await supabase.from('bx_employees').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Ошибка удаления сотрудника в Supabase, добавляем в очередь:', err)
      addToSyncQueue('employees', 'delete', id, null, lastSyncedAt)
      setSyncStatus(`Ошибка сети. В очереди синхронизации: ${getSyncQueue().length}`)
    }
  }, [])

  return { employees, loading, syncStatus, reload: load, add, update, remove }
}



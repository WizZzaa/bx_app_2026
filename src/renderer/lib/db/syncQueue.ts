import { supabase } from './supabase'
import { detectAndRegisterConflict } from './syncConflictResolver'
import { db } from './localDb'

export interface SyncQueueItem {
  id: string
  entity: 'transactions' | 'employees'
  action: 'insert' | 'update' | 'delete'
  payload: any
  targetId: string
  createdAt: string
  lastSyncedAt?: string | null
}

const SYNC_QUEUE_KEY = 'bx_sync_queue_v1'

export const getSyncQueue = (): SyncQueueItem[] => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export const saveSyncQueue = (queue: SyncQueueItem[]) => {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

export const addToSyncQueue = (
  entity: 'transactions' | 'employees',
  action: 'insert' | 'update' | 'delete',
  targetId: string,
  payload: any,
  lastSyncedAt?: string | null
) => {
  const queue = getSyncQueue()
  const newItem: SyncQueueItem = {
    id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
    entity,
    action,
    targetId,
    payload,
    createdAt: new Date().toISOString(),
    lastSyncedAt
  }
  queue.push(newItem)
  saveSyncQueue(queue)
}

export const removeFromSyncQueue = (id: string) => {
  const queue = getSyncQueue()
  const filtered = queue.filter(item => item.id !== id)
  saveSyncQueue(filtered)
}

let isSyncing = false

export const syncOfflineData = async (onStatusChange?: (status: string) => void): Promise<boolean> => {
  if (isSyncing) return false
  const queue = getSyncQueue()
  if (queue.length === 0) return true

  isSyncing = true
  onStatusChange?.(`Синхронизация... Осталось: ${queue.length}`)

  try {
    for (const item of queue) {
      const table = item.entity === 'transactions' ? 'bx_transactions' : 'bx_employees'
      const localTable = item.entity === 'transactions' ? db.transactions : db.employees

      if (item.action === 'insert') {
        const { error } = await supabase.from(table).insert(item.payload)
        if (error) {
          if (error.code !== '23505') {
            throw error
          }
        }
        await (localTable as any).update(item.targetId, { last_synced_at: item.payload.updated_at })
      } else if (item.action === 'update' || item.action === 'delete') {
        const { data: serverRecord, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('id', item.targetId)
          .maybeSingle()

        if (fetchError) throw fetchError

        if (serverRecord) {
          const serverUpdatedAt = serverRecord.updated_at
          const expectedSyncTime = item.lastSyncedAt

          if (expectedSyncTime && serverUpdatedAt && new Date(serverUpdatedAt) > new Date(expectedSyncTime)) {
            console.warn(`[Sync Conflict] Запись ${item.targetId} изменена на сервере.`)
            const localRecord = await (localTable as any).get(item.targetId)
            await detectAndRegisterConflict(
              item.entity,
              item.targetId,
              localRecord || item.payload,
              serverRecord
            )
            removeFromSyncQueue(item.id)
            continue
          }
        }

        if (item.action === 'update') {
          const { error } = await supabase.from(table).update(item.payload).eq('id', item.targetId)
          if (error) throw error
          await (localTable as any).update(item.targetId, { last_synced_at: item.payload.updated_at })
        } else {
          const { error } = await supabase.from(table).delete().eq('id', item.targetId)
          if (error) throw error
        }
      }

      removeFromSyncQueue(item.id)
      onStatusChange?.(`Синхронизация... Осталось: ${getSyncQueue().length}`)
    }
    onStatusChange?.('В сети · Синхронизировано')
    return true
  } catch (err) {
    console.error('[syncOfflineData] Ошибка при отправке оффлайн данных:', err)
    onStatusChange?.(`Ошибка синхронизации: ${getSyncQueue().length} в очереди`)
    return false
  } finally {
    isSyncing = false
  }
}

import { supabase } from './supabase'
import { detectAndRegisterConflict } from './syncConflictResolver'
import { db } from './localDb'
import { logger } from '../logger'
import type { Table } from 'dexie'
import type { SyncEntityData } from './localDb'

export interface SyncQueueItem {
  id: string
  entity: 'transactions' | 'employees'
  action: 'insert' | 'update' | 'delete'
  payload: SyncEntityData | null
  targetId: string
  createdAt: string
  lastSyncedAt?: string | null
  // Серверная версия строки (rev), от которой сделана правка — для надёжного
  // обнаружения конкурентных изменений. Если не задано, откат на updated_at.
  lastSyncedRev?: number | null
}

const SYNC_QUEUE_KEY = 'bx_sync_queue_v1'
const MAX_RETRIES = 2         // дополнительных попыток к первой
const BASE_DELAY_MS = 500     // 500ms, 1500ms (экспоненциальный backoff)

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// Транзиентная (сетевая) ошибка — есть смысл повторить.
// Логические ошибки Postgres/PostgREST имеют SQLSTATE-код (начинается с цифры) —
// повтор не поможет, не ретраим.
export const isTransientError = (err: unknown): boolean => {
  const code = (err as { code?: unknown })?.code
  if (typeof code === 'string' && /^\d/.test(code)) return false
  return true
}

export const getSyncQueue = (): SyncQueueItem[] => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
  } catch (err) {
    logger.warn('sync', 'Битая очередь синхронизации, начинаю с пустой', err)
    return []
  }
}

export const saveSyncQueue = (queue: SyncQueueItem[]) => {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

export const addToSyncQueue = <T extends object>(
  entity: 'transactions' | 'employees',
  action: 'insert' | 'update' | 'delete',
  targetId: string,
  payload: T | null,
  lastSyncedAt?: string | null,
  lastSyncedRev?: number | null
) => {
  const queue = getSyncQueue()
  const newItem: SyncQueueItem = {
    id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
    entity,
    action,
    targetId,
    payload: payload as SyncEntityData | null,
    createdAt: new Date().toISOString(),
    lastSyncedAt,
    lastSyncedRev,
  }
  queue.push(newItem)
  saveSyncQueue(queue)
}

export const removeFromSyncQueue = (id: string) => {
  const queue = getSyncQueue()
  saveSyncQueue(queue.filter(item => item.id !== id))
}

// Изменилась ли строка на сервере после базовой версии правки.
// Предпочитаем монотонный rev; при его отсутствии — updated_at.
const serverChangedSinceBase = (item: SyncQueueItem, serverRecord: SyncEntityData): boolean => {
  if (item.lastSyncedRev != null && typeof serverRecord.rev === 'number') {
    return serverRecord.rev > item.lastSyncedRev
  }
  if (item.lastSyncedAt && typeof serverRecord.updated_at === 'string') {
    return new Date(serverRecord.updated_at) > new Date(item.lastSyncedAt)
  }
  return false
}

type PushResult = 'synced' | 'conflict'

// Отправка одного элемента очереди. Бросает при транзиентной/фатальной ошибке —
// решение о повторе принимает syncOfflineData.
const pushItem = async (item: SyncQueueItem): Promise<PushResult> => {
  const table = item.entity === 'transactions' ? 'bx_transactions' : 'bx_employees'
  const localTable = item.entity === 'transactions' ? db.transactions : db.employees
  const entityTable = localTable as unknown as Table<SyncEntityData, string>
  const payloadUpdatedAt = item.payload && typeof item.payload.updated_at === 'string'
    ? item.payload.updated_at
    : undefined

  if (item.action === 'insert') {
    if (!item.payload) throw new Error('В очереди синхронизации отсутствуют данные для добавления')
    const { data, error } = await supabase.from(table).insert(item.payload).select('rev, updated_at').maybeSingle()
    if (error && error.code !== '23505') throw error // 23505 — уже существует, считаем синхронизированным
    await entityTable.update(item.targetId, {
      last_synced_at: payloadUpdatedAt,
      ...(data?.rev != null ? { rev: data.rev } : {}),
    })
    return 'synced'
  }

  // update | delete: сперва проверяем конкурентные изменения на сервере
  const { data: serverRecord, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .eq('id', item.targetId)
    .maybeSingle()
  if (fetchError) throw fetchError

  if (serverRecord && serverChangedSinceBase(item, serverRecord)) {
    logger.warn('sync', `Конкурентное изменение ${item.entity} ${item.targetId} — регистрирую конфликт`)
    const localRecord = await entityTable.get(item.targetId)
    await detectAndRegisterConflict(item.entity, item.targetId, localRecord || item.payload || {}, serverRecord)
    return 'conflict'
  }

  if (item.action === 'update') {
    if (!item.payload) throw new Error('В очереди синхронизации отсутствуют данные для обновления')
    const { data, error } = await supabase.from(table).update(item.payload).eq('id', item.targetId).select('rev, updated_at').maybeSingle()
    if (error) throw error
    await entityTable.update(item.targetId, {
      last_synced_at: payloadUpdatedAt,
      ...(data?.rev != null ? { rev: data.rev } : {}),
    })
  } else {
    const { error } = await supabase.from(table).delete().eq('id', item.targetId)
    if (error) throw error
  }
  return 'synced'
}

let isSyncing = false

export const syncOfflineData = async (onStatusChange?: (status: string) => void): Promise<boolean> => {
  if (isSyncing) return false
  const queue = getSyncQueue()
  if (queue.length === 0) return true

  isSyncing = true
  onStatusChange?.(`Синхронизация... Осталось: ${queue.length}`)
  let allOk = true

  try {
    // Снимок очереди: сбой одного элемента не должен прерывать остальные.
    for (const item of [...queue]) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          await pushItem(item)
          removeFromSyncQueue(item.id)
          break
        } catch (err) {
          const retriable = isTransientError(err) && attempt < MAX_RETRIES
          if (!retriable) {
            logger.error('sync', `Не удалось отправить ${item.entity}/${item.action} ${item.targetId}`, err)
            allOk = false // оставляем элемент в очереди на следующий цикл
            break
          }
          await sleep(BASE_DELAY_MS * Math.pow(3, attempt))
        }
      }
      onStatusChange?.(`Синхронизация... Осталось: ${getSyncQueue().length}`)
    }
    onStatusChange?.(allOk ? 'В сети · Синхронизировано' : `Ошибка синхронизации: ${getSyncQueue().length} в очереди`)
    return allOk
  } finally {
    isSyncing = false
  }
}

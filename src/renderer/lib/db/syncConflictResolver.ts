import { db, type SyncConflict } from './localDb'
import { supabase } from './supabase'

export const detectAndRegisterConflict = async (
  entity: 'transactions' | 'employees',
  targetId: string,
  localData: any,
  serverData: any
): Promise<SyncConflict> => {
  const existing = await db.conflicts.where('targetId').equals(targetId).first()
  if (existing) {
    return existing
  }

  const conflict: SyncConflict = {
    id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
    entity,
    targetId,
    localData,
    serverData,
    createdAt: new Date().toISOString()
  }

  await db.conflicts.put(conflict)
  return conflict
}

export const getConflicts = async (): Promise<SyncConflict[]> => {
  return db.conflicts.toArray()
}

export const resolveConflict = async (
  conflictId: string,
  resolution: 'local' | 'server' | 'merge',
  mergedData?: any
): Promise<boolean> => {
  const conflict = await db.conflicts.get(conflictId)
  if (!conflict) {
    return false
  }

  const table = conflict.entity === 'transactions' ? 'bx_transactions' : 'bx_employees'
  const localTable = conflict.entity === 'transactions' ? db.transactions : db.employees

  try {
    if (resolution === 'local') {
      // Записываем локальные данные на сервер, обновляя last_synced_at
      const updatedLocal = {
        ...conflict.localData,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from(table).upsert(updatedLocal)
      if (error) throw error

      // Обновляем локально с новым штампом синхронизации
      await (localTable as any).put({
        ...updatedLocal,
        last_synced_at: updatedLocal.updated_at
      })
    } else if (resolution === 'server') {
      // Перезаписываем локальные данные серверными
      await (localTable as any).put({
        ...conflict.serverData,
        last_synced_at: conflict.serverData.updated_at
      })
    } else if (resolution === 'merge' && mergedData) {
      // Записываем объединенные данные и локально, и на сервер
      const updatedMerged = {
        ...mergedData,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from(table).upsert(updatedMerged)
      if (error) throw error

      await (localTable as any).put({
        ...updatedMerged,
        last_synced_at: updatedMerged.updated_at
      })
    }

    // Удаляем запись о конфликте
    await db.conflicts.delete(conflictId)
    return true
  } catch (err) {
    console.error('[resolveConflict] Ошибка разрешения конфликта:', err)
    return false
  }
}

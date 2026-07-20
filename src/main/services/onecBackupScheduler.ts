import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { app, Notification } from 'electron'
import { backupDatabaseRotated, type AutomaticBackupSlot } from './onecBackup'

export interface BackupHistoryEntry {
  id: string
  createdAt: string
  status: 'success' | 'attention' | 'error'
  message: string
  destPath?: string
  sizeBytes?: number
}

export interface BackupDatabaseConfig {
  id: string
  name: string
  enabled: boolean
  sourceFile: string
  destDir: string
  scheduleTime: string
  onecExecutablePath?: string
  lastBackupTime?: string
  missedAt?: string
  reminderAt?: string
  reminderDate?: string
  reminderCount?: number
  history?: BackupHistoryEntry[]
}

export interface BackupScheduleConfig {
  version: 2
  databaseLimit: number
  databases: BackupDatabaseConfig[]
}

type LegacyBackupScheduleConfig = Partial<BackupDatabaseConfig> & {
  intervalHours?: number
}

export const EMPTY_BACKUP_CONFIG: BackupScheduleConfig = { version: 2, databaseLimit: 0, databases: [] }

function stableDatabaseId(sourceFile: string, destDir: string, index = 0): string {
  return `base-${createHash('sha256').update(`${sourceFile}\n${destDir}\n${index}`).digest('hex').slice(0, 16)}`
}

function defaultDatabaseName(sourceFile: string, index = 0): string {
  const normalized = sourceFile.replace(/\\/g, '/')
  const parts = normalized.split('/').filter(Boolean)
  return parts.at(-2) || `База 1С ${index + 1}`
}

export function normalizeBackupConfig(raw: unknown): BackupScheduleConfig {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_BACKUP_CONFIG, databases: [] }
  const record = raw as Record<string, unknown>
  if (record.version === 2 && Array.isArray(record.databases)) {
    const databases = record.databases
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item, index): BackupDatabaseConfig => {
        const sourceFile = typeof item.sourceFile === 'string' ? item.sourceFile : ''
        const destDir = typeof item.destDir === 'string' ? item.destDir : ''
        return {
          ...item,
          id: typeof item.id === 'string' && item.id ? item.id : stableDatabaseId(sourceFile, destDir, index),
          name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : defaultDatabaseName(sourceFile, index),
          enabled: item.enabled === true,
          sourceFile,
          destDir,
          scheduleTime: typeof item.scheduleTime === 'string' && /^\d{2}:\d{2}$/.test(item.scheduleTime) ? item.scheduleTime : '20:00',
          history: Array.isArray(item.history) ? item.history as BackupHistoryEntry[] : [],
        } as BackupDatabaseConfig
      })
    const rawLimit = Number(record.databaseLimit)
    const databaseLimit = Number.isFinite(rawLimit) ? Math.max(0, Math.min(5, Math.trunc(rawLimit))) : databases.length
    return { version: 2, databaseLimit, databases }
  }

  const legacy = raw as LegacyBackupScheduleConfig
  const sourceFile = typeof legacy.sourceFile === 'string' ? legacy.sourceFile : ''
  const destDir = typeof legacy.destDir === 'string' ? legacy.destDir : ''
  if (!sourceFile && !destDir && !legacy.history?.length) return { ...EMPTY_BACKUP_CONFIG, databases: [] }
  return {
    version: 2,
    databaseLimit: 1,
    databases: [{
      id: stableDatabaseId(sourceFile, destDir),
      name: defaultDatabaseName(sourceFile),
      enabled: legacy.enabled === true,
      sourceFile,
      destDir,
      scheduleTime: legacy.scheduleTime || '20:00',
      lastBackupTime: legacy.lastBackupTime,
      missedAt: legacy.missedAt,
      reminderAt: legacy.reminderAt,
      reminderDate: legacy.reminderDate,
      reminderCount: legacy.reminderCount,
      history: Array.isArray(legacy.history) ? legacy.history : [],
    }],
  }
}

export function appendBackupHistory(database: BackupDatabaseConfig, entry: BackupHistoryEntry): BackupDatabaseConfig {
  return { ...database, history: [entry, ...(database.history ?? [])].slice(0, 50) }
}

export function scheduledSlots(now: Date, scheduleTime = '20:00'): AutomaticBackupSlot[] {
  const [hours, minutes] = scheduleTime.split(':').map(Number)
  if (now.getHours() !== hours || now.getMinutes() < minutes || now.getMinutes() >= minutes + 10) return []
  const slots: AutomaticBackupSlot[] = ['daily']
  if (now.getDay() === 0) slots.push('weekly')
  if (now.getDate() === 1) slots.push('monthly')
  return slots
}

const CONFIG_FILE = 'backup-schedule.json'
const LEGACY_CONFIG_FILE = 'backup-schedule.legacy.json'

type SchedulerOwnedField = 'lastBackupTime' | 'missedAt' | 'reminderAt' | 'reminderDate' | 'reminderCount'

const SCHEDULER_OWNED_FIELDS: SchedulerOwnedField[] = [
  'lastBackupTime',
  'missedAt',
  'reminderAt',
  'reminderDate',
  'reminderCount',
]

const DATABASE_FIELDS: Array<Exclude<keyof BackupDatabaseConfig, 'id' | 'history'>> = [
  'name',
  'enabled',
  'sourceFile',
  'destDir',
  'scheduleTime',
  'onecExecutablePath',
  'lastBackupTime',
  'missedAt',
  'reminderAt',
  'reminderDate',
  'reminderCount',
]

let configMutationTail: Promise<void> = Promise.resolve()

function serializeConfigMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = configMutationTail.then(operation, operation)
  configMutationTail = result.then(() => undefined, () => undefined)
  return result
}

function getConfigPath(): string {
  return path.join(app.getPath('userData'), CONFIG_FILE)
}

export async function readBackupConfig(): Promise<BackupScheduleConfig> {
  const configPath = getConfigPath()
  try {
    const raw = await fs.promises.readFile(configPath, 'utf8')
    return normalizeBackupConfig(JSON.parse(raw))
  } catch {
    return { ...EMPTY_BACKUP_CONFIG, databases: [] }
  }
}

async function persistBackupConfig(config: BackupScheduleConfig): Promise<void> {
  const configPath = getConfigPath()
  const configDir = path.dirname(configPath)
  await fs.promises.mkdir(configDir, { recursive: true })
  const existing = await fs.promises.readFile(configPath, 'utf8').catch(() => null)
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as { version?: unknown }
      if (parsed.version !== 2) {
        await fs.promises.writeFile(path.join(configDir, LEGACY_CONFIG_FILE), existing, { encoding: 'utf8', flag: 'wx' }).catch(error => {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
        })
      }
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('Существующая конфигурация резервных копий повреждена и не будет перезаписана')
      throw error
    }
  }
  const normalized = normalizeBackupConfig(config)
  const tempPath = `${configPath}.partial-${randomUUID()}`
  try {
    await fs.promises.writeFile(tempPath, JSON.stringify(normalized, null, 2), { encoding: 'utf8', flag: 'wx' })
    await fs.promises.rename(tempPath, configPath)
  } catch (error) {
    await fs.promises.unlink(tempPath).catch(() => undefined)
    throw error
  }
}

export function mergeSchedulerDatabaseChanges(
  config: BackupScheduleConfig,
  before: BackupDatabaseConfig,
  after: BackupDatabaseConfig,
): BackupScheduleConfig {
  const index = config.databases.findIndex(database => database.id === before.id)
  if (index < 0) return config

  const current = config.databases[index]
  if (current.sourceFile !== before.sourceFile || current.destDir !== before.destDir) return config

  let merged = current
  for (const field of SCHEDULER_OWNED_FIELDS) {
    if (Object.is(before[field], after[field]) || !Object.is(current[field], before[field])) continue
    merged = { ...merged }
    if (after[field] === undefined) delete merged[field]
    else Object.assign(merged, { [field]: after[field] })
  }

  const previousHistoryIds = new Set((before.history ?? []).map(entry => entry.id))
  const newEntries = (after.history ?? []).filter(entry => !previousHistoryIds.has(entry.id))
  if (newEntries.length > 0) {
    const currentHistoryIds = new Set((merged.history ?? []).map(entry => entry.id))
    const uniqueNewEntries = newEntries.filter(entry => !currentHistoryIds.has(entry.id))
    if (uniqueNewEntries.length > 0) {
      merged = { ...merged, history: [...uniqueNewEntries, ...(merged.history ?? [])].slice(0, 50) }
    }
  }

  if (merged === current) return config
  const databases = [...config.databases]
  databases[index] = merged
  return { ...config, databases }
}

export function mergeUserBackupConfigChanges(
  currentConfig: BackupScheduleConfig,
  baseConfig: BackupScheduleConfig,
  requestedConfig: BackupScheduleConfig,
): BackupScheduleConfig {
  const current = normalizeBackupConfig(currentConfig)
  const base = normalizeBackupConfig(baseConfig)
  const requested = normalizeBackupConfig(requestedConfig)
  const baseById = new Map(base.databases.map(database => [database.id, database]))
  const currentById = new Map(current.databases.map(database => [database.id, database]))
  const requestedIds = new Set(requested.databases.map(database => database.id))
  const removedIds = new Set(base.databases.filter(database => !requestedIds.has(database.id)).map(database => database.id))
  const mergedById = new Map(current.databases.filter(database => !removedIds.has(database.id)).map(database => [database.id, database]))

  for (const requestedDatabase of requested.databases) {
    const baseDatabase = baseById.get(requestedDatabase.id)
    const currentDatabase = currentById.get(requestedDatabase.id)
    if (!baseDatabase || !currentDatabase) {
      mergedById.set(requestedDatabase.id, requestedDatabase)
      continue
    }

    let merged = currentDatabase
    for (const field of DATABASE_FIELDS) {
      if (Object.is(baseDatabase[field], requestedDatabase[field])) continue
      merged = { ...merged }
      if (requestedDatabase[field] === undefined) delete merged[field]
      else Object.assign(merged, { [field]: requestedDatabase[field] })
    }

    const baseHistoryIds = new Set((baseDatabase.history ?? []).map(entry => entry.id))
    const currentHistoryIds = new Set((merged.history ?? []).map(entry => entry.id))
    const userEntries = (requestedDatabase.history ?? [])
      .filter(entry => !baseHistoryIds.has(entry.id) && !currentHistoryIds.has(entry.id))
    if (userEntries.length > 0) {
      merged = { ...merged, history: [...userEntries, ...(merged.history ?? [])].slice(0, 50) }
    }
    mergedById.set(requestedDatabase.id, merged)
  }

  const requestedOrder = requested.databases.map(database => database.id)
  const remainingOrder = current.databases.map(database => database.id).filter(id => !requestedIds.has(id))
  const databases = [...requestedOrder, ...remainingOrder]
    .map(id => mergedById.get(id))
    .filter((database): database is BackupDatabaseConfig => Boolean(database))
  const databaseLimit = Object.is(base.databaseLimit, requested.databaseLimit)
    ? current.databaseLimit
    : requested.databaseLimit
  return { version: 2, databaseLimit, databases }
}

export function writeBackupConfig(config: BackupScheduleConfig, baseConfig: BackupScheduleConfig): Promise<void> {
  return serializeConfigMutation(async () => {
    const current = await readBackupConfig()
    await persistBackupConfig(mergeUserBackupConfigChanges(current, baseConfig, config))
  })
}

async function writeSchedulerChanges(changes: Array<{ before: BackupDatabaseConfig; after: BackupDatabaseConfig }>): Promise<void> {
  await serializeConfigMutation(async () => {
    const current = await readBackupConfig()
    const merged = changes.reduce(
      (config, change) => mergeSchedulerDatabaseChanges(config, change.before, change.after),
      current,
    )
    if (merged !== current) await persistBackupConfig(merged)
  })
}

export function initBackupScheduler() {
  const CHECK_INTERVAL_MS = 10 * 60 * 1000
  let tickRunning = false

  setInterval(async () => {
    if (tickRunning) return
    tickRunning = true
    try {
      const config = await readBackupConfig()
      const now = new Date()
      const today = now.toLocaleDateString('en-CA')
      const changes: Array<{ before: BackupDatabaseConfig; after: BackupDatabaseConfig }> = []

      for (let index = 0; index < config.databases.length; index += 1) {
        const before = config.databases[index]
        let database = { ...before }
        let databaseChanged = false
        if (index >= config.databaseLimit) continue
        if (!database.enabled || !database.sourceFile || !database.destDir) continue

        if (database.missedAt && database.reminderAt && new Date(database.reminderAt) <= now) {
          const count = database.reminderDate === today ? (database.reminderCount ?? 0) : 0
          if (count <= 2) {
            new Notification({
              title: `${database.name}: копия всё ещё ожидает решения`,
              body: 'Откройте BX: создать сейчас, напомнить позже или пропустить.',
            }).show()
          }
          delete database.reminderAt
          databaseChanged = true
        }

        const dueSlots = scheduledSlots(now, database.scheduleTime)
        let shouldBackup = !database.lastBackupTime && dueSlots.length > 0
        if (database.lastBackupTime) {
          const diffHours = (now.getTime() - new Date(database.lastBackupTime).getTime()) / (1000 * 60 * 60)
          if (dueSlots.length > 0 && diffHours >= 20) {
            shouldBackup = true
          } else if (diffHours >= 24 + (10 / 60) && !database.missedAt) {
            database.missedAt = now.toISOString()
            databaseChanged = true
            new Notification({
              title: `${database.name}: пропущена резервная копия`,
              body: 'Откройте BX и выберите: создать сейчас, напомнить позже или пропустить.',
            }).show()
          }
        }

        if (shouldBackup) {
          console.log(`[BackupScheduler] ${database.name}: ${database.sourceFile} -> ${database.destDir}`)
          const result = await backupDatabaseRotated(database.sourceFile, database.destDir, dueSlots)
          if (result.success) {
            database.lastBackupTime = now.toISOString()
            delete database.missedAt
            delete database.reminderAt
            database = appendBackupHistory(database, {
              id: randomUUID(), createdAt: now.toISOString(), status: 'success',
              message: `Автоматическая копия: ${dueSlots.join(', ')}`, destPath: result.destPath, sizeBytes: result.sizeBytes,
            })
            new Notification({ title: `${database.name}: копия создана`, body: 'Проверенная резервная копия базы 1С сохранена.' }).show()
          } else {
            database = appendBackupHistory(database, {
              id: randomUUID(), createdAt: now.toISOString(), status: 'error',
              message: result.error || 'Автоматическая копия не создана',
            })
            new Notification({ title: `${database.name}: ошибка копирования`, body: result.error || 'Резервная копия не создана.' }).show()
          }
          databaseChanged = true
        }
        if (databaseChanged) changes.push({ before, after: database })
      }

      if (changes.length > 0) await writeSchedulerChanges(changes)
    } catch (error) {
      console.error('[BackupScheduler] Ошибка планировщика:', error)
    } finally {
      tickRunning = false
    }
  }, CHECK_INTERVAL_MS)
}

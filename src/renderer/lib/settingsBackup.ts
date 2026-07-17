import type { FontScale } from './uiScale'
import type { BxTheme } from './theme'

export interface SettingsBackupPayload {
  version: string
  timestamp: string
  ecpKeys?: unknown[]
  localRequisites?: unknown[]
  theme?: BxTheme
  notifyDays?: '1' | '3' | '7' | 'off'
  idleLock?: 'off' | '5' | '10' | '30' | '60'
  pinEnabled?: boolean
  fontScale?: FontScale
  templates?: unknown[]
  counterparties?: unknown[]
}

export interface SettingsBackupSummary {
  version: string
  createdAt: string
  ecpKeys: number
  requisites: number
  templates: number
  counterparties: number
}

const VALID_THEME = new Set(['dark', 'light', 'lime'])
const VALID_NOTIFY = new Set(['1', '3', '7', 'off'])
const VALID_IDLE = new Set(['off', '5', '10', '30', '60'])
const VALID_SCALE = new Set(['100', '110', '120', '130'])

export function parseSettingsBackup(text: string): SettingsBackupPayload {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Файл не является корректным JSON')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('В файле отсутствует объект резервной копии BX')
  }
  const data = value as Record<string, unknown>
  if (typeof data.version !== 'string' || typeof data.timestamp !== 'string') {
    throw new Error('Не найдены версия или дата создания копии BX')
  }
  if (data.theme !== undefined && !VALID_THEME.has(String(data.theme))) throw new Error('Некорректная тема оформления')
  if (data.notifyDays !== undefined && !VALID_NOTIFY.has(String(data.notifyDays))) throw new Error('Некорректный период уведомлений')
  if (data.idleLock !== undefined && !VALID_IDLE.has(String(data.idleLock))) throw new Error('Некорректный период автоблокировки')
  if (data.fontScale !== undefined && !VALID_SCALE.has(String(data.fontScale))) throw new Error('Некорректный масштаб интерфейса')
  for (const key of ['ecpKeys', 'localRequisites', 'templates', 'counterparties']) {
    if (data[key] !== undefined && !Array.isArray(data[key])) throw new Error(`Поле ${key} должно быть списком`)
  }
  return data as unknown as SettingsBackupPayload
}

export function settingsBackupSummary(data: SettingsBackupPayload): SettingsBackupSummary {
  return {
    version: data.version,
    createdAt: data.timestamp,
    ecpKeys: data.ecpKeys?.length ?? 0,
    requisites: data.localRequisites?.length ?? 0,
    templates: data.templates?.length ?? 0,
    counterparties: data.counterparties?.length ?? 0,
  }
}

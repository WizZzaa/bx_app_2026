// Локальный PIN-замок. PIN хранится только на этой машине в виде хэша.
// crypto.subtle работает только в secure context (HTTPS / localhost).
// При доступе по HTTP в локальной сети используется fallback-хэш.

import { logger } from '../logger'

const PIN_KEY = 'bx_pin_hash'
const PIN_ENABLED_KEY = 'bx_pin_enabled'
const SALT = 'bx_pin_v1_2026'
const ATTEMPTS_KEY = 'bx_pin_attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 5 * 60 * 1000 // 5 минут
const MAX_LOCKOUTS = 3

// ── Типы ──

interface AttemptsData {
  count: number
  lockedUntil: number | null
  lockoutCount: number
}

interface LockStatus {
  locked: boolean
  remainingMs: number
  forceLogout: boolean
}

// ── Утилиты хэширования ──

async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + text))
    return 'sub_' + [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback for insecure HTTP (local network preview via IP address).
  // A 4-digit PIN has 10k combinations — hash strength is not the limiting factor.
  return pureDjb2(SALT + text)
}

function pureDjb2(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  }
  return 'djb_' + h.toString(16).padStart(8, '0')
}

// ── Safe Storage (Electron) ──

const safeEncrypt = async (value: string): Promise<string> => {
  const bx = window.bx
  if (bx?.safe) {
    try {
      const available = await bx.safe.isAvailable()
      if (available) return await bx.safe.encrypt(value)
    } catch (err) { logger.debug('pin', 'safeStorage encrypt недоступен, использую открытое значение', err) }
  }
  return value
}

const safeDecrypt = async (value: string): Promise<string> => {
  const bx = window.bx
  if (bx?.safe) {
    try {
      const available = await bx.safe.isAvailable()
      if (available) return await bx.safe.decrypt(value)
    } catch (err) { logger.debug('pin', 'safeStorage decrypt недоступен, использую открытое значение', err) }
  }
  return value
}

// ── Управление попытками (brute-force protection) ──

const getAttemptsData = (): AttemptsData => {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { count: 0, lockedUntil: null, lockoutCount: 0 }
}

const saveAttemptsData = (data: AttemptsData): void => {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data))
}

export const isLocked = (): LockStatus => {
  const data = getAttemptsData()
  if (data.lockedUntil) {
    const remaining = data.lockedUntil - Date.now()
    if (remaining > 0) {
      return {
        locked: true,
        remainingMs: remaining,
        forceLogout: false,
      }
    }
    // Блокировка истекла — сбросить счётчик попыток (но не lockoutCount)
    data.count = 0
    data.lockedUntil = null
    saveAttemptsData(data)
  }
  return {
    locked: false,
    remainingMs: 0,
    forceLogout: data.lockoutCount >= MAX_LOCKOUTS,
  }
}

export const recordFailedAttempt = (): LockStatus => {
  const data = getAttemptsData()
  data.count += 1

  if (data.count >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_MS
    data.lockoutCount += 1
    data.count = 0
    saveAttemptsData(data)

    if (data.lockoutCount >= MAX_LOCKOUTS) {
      return { locked: true, remainingMs: LOCKOUT_MS, forceLogout: true }
    }
    return { locked: true, remainingMs: LOCKOUT_MS, forceLogout: false }
  }

  saveAttemptsData(data)
  return { locked: false, remainingMs: 0, forceLogout: false }
}

export const getAttemptsLeft = (): number => {
  const data = getAttemptsData()
  return Math.max(0, MAX_ATTEMPTS - data.count)
}

export const resetAttempts = (): void => {
  localStorage.removeItem(ATTEMPTS_KEY)
}

// ── Публичный API PIN-кода ──

export function hasPin(): boolean {
  return Boolean(localStorage.getItem(PIN_KEY))
}

// Включена ли защита PIN-кодом. По умолчанию — включена (обратная совместимость),
// но пользователь может отключить (PIN «постоянно надоедает»).
export function isPinEnabled(): boolean {
  return localStorage.getItem(PIN_ENABLED_KEY) !== '0'
}

// Отключение PIN стирает сам код и сбрасывает счётчик попыток.
export function setPinEnabled(on: boolean): void {
  localStorage.setItem(PIN_ENABLED_KEY, on ? '1' : '0')
  if (!on) clearPin()
}

export async function setPin(pin: string): Promise<void> {
  const hash = await sha256(pin)
  const stored = await safeEncrypt(hash)
  localStorage.setItem(PIN_KEY, stored)
  resetAttempts()
}

export async function verifyPin(pin: string): Promise<boolean> {
  const status = isLocked()
  if (status.locked) return false

  const stored = localStorage.getItem(PIN_KEY)
  if (!stored) return false

  const decrypted = await safeDecrypt(stored)
  const hash = await sha256(pin)
  const ok = decrypted === hash

  if (ok) {
    resetAttempts()
  }
  // НЕ записываем failed attempt здесь — это делается в PinScreen,
  // чтобы получить LockStatus и обновить UI

  return ok
}

export function clearPin(): void {
  localStorage.removeItem(PIN_KEY)
  resetAttempts()
}

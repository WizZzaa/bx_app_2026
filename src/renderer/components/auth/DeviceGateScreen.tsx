import React, { useEffect, useState } from 'react'
import {
  listMyDevices,
  revokeDevice,
  type DeviceRegistrationStatus,
  type RegisteredDevice,
} from '../../lib/auth/device'

type BlockedDeviceStatus = Exclude<DeviceRegistrationStatus, 'trusted'>

const statusCopy: Record<BlockedDeviceStatus, { title: string; description: string }> = {
  revoked: {
    title: 'Доступ этого устройства завершён',
    description: 'Выйдите и снова подтвердите вход через Telegram. Отозванный сеанс не может доверить себя повторно.',
  },
  limit_exceeded: {
    title: 'Достигнут лимит устройств',
    description: 'Завершите одно из прежних устройств, затем повторите проверку.',
  },
  ephemeral_denied: {
    title: 'Приватный профиль не доверен',
    description: 'Откройте BX в обычном профиле браузера или Desktop-приложении.',
  },
  error: {
    title: 'Не удалось проверить устройство',
    description: 'Проверьте соединение и повторите проверку.',
  },
}

export default function DeviceGateScreen({
  status,
  onRetry,
  onSignOut,
}: {
  status: BlockedDeviceStatus
  onRetry: () => void
  onSignOut: () => void
}) {
  const [devices, setDevices] = useState<RegisteredDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void listMyDevices()
      .then(result => { if (active) setDevices(result) })
      .catch(() => { if (active) setError('Не удалось загрузить список устройств.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const remove = async (device: RegisteredDevice) => {
    if (device.current || !window.confirm(`Завершить сеанс «${device.label}»?`)) return
    setBusy(device.id)
    setError(null)
    try {
      await revokeDevice(device.id)
      setDevices(current => current.map(item => (
        item.id === device.id ? { ...item, revokedAt: new Date().toISOString() } : item
      )))
    } catch {
      setError('Не удалось завершить выбранный сеанс. Обновите список и попробуйте снова.')
    } finally {
      setBusy(null)
    }
  }

  const copy = statusCopy[status]
  const activeDevices = devices.filter(device => !device.revokedAt)

  return (
    <div className="min-h-screen bg-bx-bg p-6 text-bx-text">
      <main className="mx-auto mt-12 max-w-xl rounded-3xl border border-bx-border bg-bx-surface p-6 shadow-xl">
        <p className="text-xs font-black uppercase tracking-wider text-amber-600">Защита устройства</p>
        <h1 className="mt-2 text-2xl font-black">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-bx-muted">{copy.description}</p>
        <p className="mt-2 text-xs leading-relaxed text-bx-muted">
          После завершения удалённый сеанс не сможет обновить токен. Уже выданный короткий токен может действовать до своего истечения.
        </p>

        {loading && <p className="mt-6 text-xs text-bx-muted">Загружаем доверенные устройства…</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600">{error}</p>}
        {!loading && activeDevices.length > 0 && (
          <div className="mt-6 space-y-2">
            {activeDevices.map(device => (
              <div key={device.id} className="flex items-center justify-between gap-3 rounded-2xl border border-bx-border bg-bx-bg p-4">
                <div>
                  <p className="text-sm font-bold">{device.label}{device.current ? ' · текущее' : ''}</p>
                  <p className="mt-1 text-xs text-bx-muted">Последняя активность: {new Date(device.lastSeenAt).toLocaleString('ru-RU')}</p>
                </div>
                {!device.current && (
                  <button type="button" disabled={busy === device.id} onClick={() => void remove(device)} className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50">
                    {busy === device.id ? 'Завершаем…' : 'Завершить'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onRetry} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Проверить снова</button>
          <button type="button" onClick={onSignOut} className="rounded-xl border border-bx-border px-4 py-3 text-sm font-bold">Выйти</button>
        </div>
      </main>
    </div>
  )
}

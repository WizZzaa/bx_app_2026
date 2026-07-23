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
    <div className="bx-auth-screen">
      <div className="bx-auth-screen__aura bx-auth-screen__aura--start" aria-hidden="true" />
      <div className="bx-auth-screen__aura bx-auth-screen__aura--end" aria-hidden="true" />
      <main className="bx-auth-card bx-device-gate">
        <span className="bx-auth-card__icon is-warning" aria-hidden="true">!</span>
        <p className="bx-auth-card__eyebrow">Защита устройства</p>
        <h1>{copy.title}</h1>
        <p className="bx-auth-card__subtitle">{copy.description}</p>
        <p className="bx-auth-card__note">
          После завершения удалённый сеанс не сможет обновить токен. Уже выданный короткий токен может действовать до своего истечения.
        </p>

        {loading && <p role="status" className="bx-auth-message">Загружаем доверенные устройства…</p>}
        {error && <p role="alert" className="bx-auth-message is-error">{error}</p>}
        {!loading && activeDevices.length > 0 && (
          <div className="bx-device-list">
            {activeDevices.map(device => (
              <div key={device.id} className="bx-device-list__item">
                <div>
                  <strong>{device.label}{device.current ? ' · текущее' : ''}</strong>
                  <span>Последняя активность: {new Date(device.lastSeenAt).toLocaleString('ru-RU')}</span>
                </div>
                {!device.current && (
                  <button type="button" disabled={busy === device.id} onClick={() => void remove(device)} className="bx-auth-button is-danger">
                    {busy === device.id ? 'Завершаем…' : 'Завершить'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bx-auth-actions">
          <button type="button" onClick={onRetry} className="bx-auth-button is-primary">Проверить снова</button>
          <button type="button" onClick={onSignOut} className="bx-auth-button is-secondary">Выйти</button>
        </div>
      </main>
    </div>
  )
}

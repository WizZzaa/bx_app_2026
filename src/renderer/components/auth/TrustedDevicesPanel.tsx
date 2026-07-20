import React, { useCallback, useEffect, useState } from 'react'
import { listMyDevices, revokeDevice, type RegisteredDevice } from '../../lib/auth/device'

export default function TrustedDevicesPanel() {
  const [devices, setDevices] = useState<RegisteredDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDevices(await listMyDevices())
    } catch {
      setError('Не удалось загрузить доверенные устройства.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const revoke = async (device: RegisteredDevice) => {
    if (device.current || !window.confirm(`Завершить сеанс «${device.label}»?`)) return
    setBusy(device.id)
    setError(null)
    try {
      await revokeDevice(device.id)
      await load()
    } catch {
      setError('Не удалось завершить выбранный сеанс. Попробуйте снова.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-2xl border border-bx-border bg-bx-surface shadow-sm">
      <div className="border-b border-bx-border p-5">
        <h3 className="text-sm font-black">Доверенные устройства</h3>
        <p className="mt-1 text-xs text-bx-muted">Free и Trial — одно устройство, Standard и Premium — два.</p>
        <p className="mt-1 text-xs text-bx-muted">Завершённый сеанс больше не обновит токен; уже выданный короткий токен может действовать до истечения.</p>
      </div>
      {error && <p role="alert" className="m-5 rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600">{error}</p>}
      <div className="divide-y divide-bx-border">
        {loading ? (
          <p className="p-5 text-xs text-bx-muted">Загружаем устройства…</p>
        ) : devices.length === 0 ? (
          <p className="p-5 text-xs text-bx-muted">Устройства ещё не зарегистрированы.</p>
        ) : devices.map(device => (
          <div key={device.id} className="flex items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-bold">{device.label}{device.current ? ' · текущее' : ''}</p>
              <p className="mt-1 text-xs text-bx-muted">
                {device.revokedAt ? 'Доступ завершён' : `Активно: ${new Date(device.lastSeenAt).toLocaleString('ru-RU')}`}
              </p>
            </div>
            {!device.revokedAt && !device.current && (
              <button type="button" disabled={busy === device.id} onClick={() => void revoke(device)} className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50">
                {busy === device.id ? 'Завершаем…' : 'Завершить'}
              </button>
            )}
          </div>
        ))}
      </div>
      {!loading && error && (
        <div className="border-t border-bx-border p-5">
          <button type="button" onClick={() => void load()} className="rounded-xl border border-bx-border px-3 py-2 text-xs font-bold">Повторить загрузку</button>
        </div>
      )}
    </section>
  )
}

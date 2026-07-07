import React, { useState, useEffect } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { onecApi, formatBytes } from '../../lib/onecApi'
import type { BackupResult } from '../../../shared/types'

export default function DatabaseBackup() {
  const [source, setSource] = useState<string | null>(null)
  const [dest, setDest] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<BackupResult | null>(null)

  const [autoEnabled, setAutoEnabled] = useState(false)
  const [intervalHours, setIntervalHours] = useState(24)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      const config = await onecApi.getBackupConfig()
      if (config.sourceFile) setSource(config.sourceFile)
      if (config.destDir) setDest(config.destDir)
      setAutoEnabled(config.enabled)
      setIntervalHours(config.intervalHours || 24)
    }
    loadConfig()
  }, [])

  async function saveAutoConfig(enabled: boolean, hours: number) {
    setSaving(true)
    await onecApi.saveBackupConfig({
      enabled,
      sourceFile: source || '',
      destDir: dest || '',
      intervalHours: hours
    })
    setSaving(false)
  }

  async function pickSource() {
    const p = await onecApi.pickDatabaseFile()
    if (p) {
      setSource(p)
      setResult(null)
      if (autoEnabled) {
        await onecApi.saveBackupConfig({
          enabled: autoEnabled,
          sourceFile: p,
          destDir: dest || '',
          intervalHours: intervalHours
        })
      }
    }
  }

  async function pickDest() {
    const p = await onecApi.pickBackupDir()
    if (p) {
      setDest(p)
      setResult(null)
      if (autoEnabled) {
        await onecApi.saveBackupConfig({
          enabled: autoEnabled,
          sourceFile: source || '',
          destDir: p,
          intervalHours: intervalHours
        })
      }
    }
  }

  async function run() {
    if (!source || !dest) return
    setRunning(true)
    const res = await onecApi.backupDatabase(source, dest)
    setResult(res)
    setRunning(false)
  }

  return (
    <Card
      title="Резервное копирование базы 1С"
      icon="💾"
      description="Копирование файла 1Cv8.1CD в безопасное место перед рискованными операциями."
    >
      <div className="space-y-4">
        {/* Source */}
        <div>
          <label className="text-xs text-bx-muted block mb-1.5">Файл базы (1Cv8.1CD)</label>
          <div className="flex gap-2">
            <div className="flex-1 text-sm text-bx-text bg-bx-bg rounded-lg px-3 py-2 truncate border border-bx-border">
              {source || <span className="text-bx-muted">Файл не выбран</span>}
            </div>
            <Button variant="ghost" onClick={pickSource}>Выбрать…</Button>
          </div>
        </div>

        {/* Dest */}
        <div>
          <label className="text-xs text-bx-muted block mb-1.5">Папка для копии</label>
          <div className="flex gap-2">
            <div className="flex-1 text-sm text-bx-text bg-bx-bg rounded-lg px-3 py-2 truncate border border-bx-border">
              {dest || <span className="text-bx-muted">Папка не выбрана</span>}
            </div>
            <Button variant="ghost" onClick={pickDest}>Выбрать…</Button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-bx-border">
          <Button variant="success" onClick={run} loading={running} disabled={!source || !dest}>
            Сделать бэкап
          </Button>
        </div>

        {result && (
          result.success ? (
            <div className="text-sm text-green-400 bg-green-500/10 rounded-lg px-4 py-3">
              ✓ Бэкап создан: {result.destPath}
              {result.sizeBytes != null && <span className="text-bx-muted"> ({formatBytes(result.sizeBytes)})</span>}
            </div>
          ) : (
            <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
              ✗ Ошибка: {result.error}
            </div>
          )
        )}

        {/* Автобэкап */}
        <div className="pt-4 border-t border-bx-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-bx-text">⏰ Автоматическое резервное копирование</p>
              <p className="text-[10px] text-bx-muted">Автоматически делать бэкап выбранной базы в фоне</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoEnabled}
                disabled={!source || !dest}
                onChange={async (e) => {
                  const val = e.target.checked
                  setAutoEnabled(val)
                  await saveAutoConfig(val, intervalHours)
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-bx-bg peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
            </label>
          </div>

          {autoEnabled && (
            <div className="grid grid-cols-2 gap-3 bg-bx-bg p-3 rounded-lg border border-bx-border">
              <div>
                <label className="text-[10px] text-bx-muted block mb-1">Периодичность бэкапа</label>
                <select
                  value={intervalHours}
                  onChange={async (e) => {
                    const hours = Number(e.target.value)
                    setIntervalHours(hours)
                    await saveAutoConfig(autoEnabled, hours)
                  }}
                  className="bg-bx-surface text-bx-text text-xs px-2 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50 w-full"
                >
                  <option value={12}>Каждые 12 часов</option>
                  <option value={24}>Раз в сутки (24 ч)</option>
                  <option value={48}>Каждые 2 дня (48 ч)</option>
                  <option value={168}>Раз в неделю (168 ч)</option>
                </select>
              </div>
              <div className="flex items-end justify-end text-[10px] text-bx-muted">
                {saving ? 'Сохранение...' : 'Планировщик активен'}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

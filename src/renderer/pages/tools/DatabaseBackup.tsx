import React, { useEffect, useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PaywallModal from '../../components/PaywallModal'
import { onecApi, formatBytes } from '../../lib/onecApi'
import { usePlan } from '../../lib/plan'
import { TARIFF_MATRIX } from '../../../shared/tariffs'
import type { BackupResult, DeepCheckResult, RestoreResult } from '../../../shared/types'
import type { BackupDatabaseConfig, BackupHistoryEntry, BackupScheduleConfig } from '../../../main/services/onecBackupScheduler'

const EMPTY_CONFIG: BackupScheduleConfig = { version: 2, databaseLimit: 0, databases: [] }

function appendHistory(database: BackupDatabaseConfig, entry: BackupHistoryEntry): BackupDatabaseConfig {
  return { ...database, history: [entry, ...(database.history ?? [])].slice(0, 50) }
}

function databaseStatus(database: BackupDatabaseConfig, entitled = true): { label: string; tone: string } {
  if (database.missedAt) return { label: 'Требует решения', tone: 'text-amber-400' }
  const latest = database.history?.[0]
  if (latest?.status === 'error') return { label: 'Ошибка', tone: 'text-red-400' }
  if (!entitled) return { label: 'Приостановлено тарифом', tone: 'text-bx-muted' }
  if (!database.enabled) return { label: 'Расписание выключено', tone: 'text-bx-muted' }
  if (database.lastBackupTime) return { label: 'Успешно', tone: 'text-emerald-400' }
  return { label: 'Ещё не запускалось', tone: 'text-bx-muted' }
}

function nextExecution(database: BackupDatabaseConfig, entitled = true): string {
  if (!entitled || !database.enabled) return '—'
  const [hours, minutes] = database.scheduleTime.split(':').map(Number)
  const next = new Date()
  next.setHours(hours, minutes, 0, 0)
  if (next <= new Date()) next.setDate(next.getDate() + 1)
  return next.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function DatabaseBackup() {
  const { plan, loading: planLoading } = usePlan()
  const databaseLimit = TARIFF_MATRIX[plan].oneCBackupBases
  const [config, setConfig] = useState<BackupScheduleConfig>(EMPTY_CONFIG)
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<BackupResult | null>(null)
  const [paywall, setPaywall] = useState(false)
  const [restoreSource, setRestoreSource] = useState<string | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null)
  const [deepSource, setDeepSource] = useState<string | null>(null)
  const [deepRunning, setDeepRunning] = useState(false)
  const [deepResult, setDeepResult] = useState<DeepCheckResult | null>(null)

  useEffect(() => {
    if (planLoading) return
    let cancelled = false
    async function loadConfig() {
      try {
        const loaded = await onecApi.getBackupConfig() as BackupScheduleConfig
        const constrained: BackupScheduleConfig = {
          ...loaded,
          version: 2,
          databaseLimit,
        }
        if (cancelled) return
        setConfig(constrained)
        setSelectedId(current => current && constrained.databases.some(item => item.id === current) ? current : constrained.databases[0]?.id || '')
        if (JSON.stringify(constrained) !== JSON.stringify(loaded)) await onecApi.saveBackupConfig(constrained, loaded)
      } catch (error) {
        if (!cancelled) setSaveError((error as Error).message || 'Не удалось прочитать локальные настройки')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadConfig()
    return () => { cancelled = true }
  }, [databaseLimit, planLoading])

  const selectedIndex = config.databases.findIndex(item => item.id === selectedId)
  const selected = selectedIndex >= 0 ? config.databases[selectedIndex] : null
  const canOperate = selectedIndex >= 0 && selectedIndex < databaseLimit
  const status = selected ? databaseStatus(selected, canOperate) : null
  const limitLabel = databaseLimit === 0 ? 'Недоступно' : `${config.databases.length} из ${databaseLimit}`

  useEffect(() => {
    setNameDraft(selected?.name || '')
    setResult(null)
    setRestoreResult(null)
    setRestoreSource(null)
    setRestoreTarget(selected?.sourceFile || null)
    setDeepSource(null)
    setDeepResult(null)
  }, [selectedId, selected?.sourceFile])

  async function persist(next: BackupScheduleConfig): Promise<boolean> {
    const previous = config
    setSaving(true)
    setSaveError('')
    setConfig(next)
    try {
      await onecApi.saveBackupConfig(next, previous)
      return true
    } catch (error) {
      setConfig(previous)
      setSaveError((error as Error).message || 'Не удалось сохранить локальные настройки')
      return false
    } finally {
      setSaving(false)
    }
  }

  function patchedSelected(patch: Partial<BackupDatabaseConfig>): BackupScheduleConfig | null {
    if (!selected) return null
    return { ...config, databases: config.databases.map(item => item.id === selected.id ? { ...item, ...patch } : item) }
  }

  async function updateSelected(patch: Partial<BackupDatabaseConfig>) {
    const next = patchedSelected(patch)
    if (next) await persist(next)
  }

  async function addDatabase() {
    if (databaseLimit === 0 || config.databases.length >= databaseLimit) {
      setPaywall(true)
      return
    }
    const database: BackupDatabaseConfig = {
      id: crypto.randomUUID(),
      name: `База 1С ${config.databases.length + 1}`,
      enabled: false,
      sourceFile: '',
      destDir: '',
      scheduleTime: '20:00',
      history: [],
    }
    if (await persist({ ...config, databaseLimit, databases: [...config.databases, database] })) setSelectedId(database.id)
  }

  async function removeDatabase() {
    if (!selected) return
    if (!window.confirm(`Убрать «${selected.name}» из BX? Сама база и все созданные копии останутся на диске.`)) return
    const databases = config.databases.filter(item => item.id !== selected.id)
    if (await persist({ ...config, databases })) setSelectedId(databases[0]?.id || '')
  }

  async function pickSource() {
    const sourceFile = await onecApi.pickDatabaseFile()
    if (sourceFile) await updateSelected({ sourceFile })
  }

  async function pickDestination() {
    const destDir = await onecApi.pickBackupDir()
    if (destDir) await updateSelected({ destDir })
  }

  async function runBackup(recordHistory = true) {
    if (!selected?.sourceFile || !selected.destDir || !canOperate) return null
    setRunning(true)
    let backup: BackupResult
    try {
      backup = await onecApi.backupDatabase(selected.sourceFile, selected.destDir)
    } catch (error) {
      backup = { success: false, error: (error as Error).message }
    }
    setResult(backup)
    setRunning(false)
    if (recordHistory) {
      const updated = appendHistory(selected, {
        id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: backup.success ? 'success' : 'error',
        message: backup.success ? 'Ручная проверенная копия' : backup.error || 'Копия не создана', destPath: backup.destPath, sizeBytes: backup.sizeBytes,
      })
      const next = { ...config, databases: config.databases.map(item => item.id === selected.id ? updated : item) }
      await persist(next)
    }
    return backup
  }

  async function resolveMissed(action: 'run' | 'later' | 'skip') {
    if (!selected) return
    const now = new Date()
    let database = selected
    if (action === 'later') {
      const today = now.toLocaleDateString('en-CA')
      const reminderCount = database.reminderDate === today ? (database.reminderCount ?? 0) : 0
      if (reminderCount >= 2) return
      await updateSelected({ reminderAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), reminderDate: today, reminderCount: reminderCount + 1 })
      return
    }
    if (action === 'run') {
      const backup = await runBackup(false)
      if (!backup?.success) return
      database = appendHistory(database, {
        id: crypto.randomUUID(), createdAt: now.toISOString(), status: 'success', message: 'Пропущенная копия создана вручную', destPath: backup.destPath, sizeBytes: backup.sizeBytes,
      })
    }
    const updated = { ...database, lastBackupTime: now.toISOString(), missedAt: undefined, reminderAt: undefined }
    await persist({ ...config, databases: config.databases.map(item => item.id === selected.id ? updated : item) })
  }

  async function pickRestoreFile(kind: 'source' | 'target') {
    const file = await onecApi.pickDatabaseFile()
    if (!file) return
    if (kind === 'source') setRestoreSource(file)
    else setRestoreTarget(file)
    setRestoreResult(null)
  }

  async function runRestore() {
    if (!selected || !restoreSource || !restoreTarget || !canOperate) return
    if (!window.confirm(`Восстановить рабочую базу\n${restoreTarget}\n\nиз копии\n${restoreSource}?\n\nBX сначала создаст и проверит отдельную страховочную копию текущей базы. Закройте 1С перед продолжением.`)) return
    setRestoring(true)
    let restored: RestoreResult
    try {
      restored = await onecApi.restoreDatabase(restoreSource, restoreTarget)
    } catch (error) {
      restored = { success: false, checks: [], error: (error as Error).message }
    }
    setRestoreResult(restored)
    setRestoring(false)
    const updated = appendHistory(selected, {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(),
      status: restored.success ? 'success' : restored.rolledBack ? 'attention' : 'error',
      message: restored.success ? 'База восстановлена; страховочная копия сохранена' : restored.rolledBack ? 'Восстановление отменено проверкой; рабочая база возвращена' : restored.error || 'Восстановление не выполнено',
      destPath: restored.safetyCopyPath,
    })
    await persist({ ...config, databases: config.databases.map(item => item.id === selected.id ? updated : item) })
  }

  async function pickDeepCheckSource() {
    const file = await onecApi.pickDatabaseFile()
    if (!file) return
    setDeepSource(file)
    setDeepResult(null)
  }

  async function pickOnecExecutable() {
    const executable = await onecApi.pickOnecExecutable()
    if (executable) {
      setDeepResult(null)
      await updateSelected({ onecExecutablePath: executable })
    }
  }

  async function runDeepCheck() {
    if (!selected?.sourceFile || !selected.onecExecutablePath || !deepSource || !canOperate) return
    if (!window.confirm(`Глубоко проверить резервную копию\n${deepSource}\n\nBX создаст отдельную временную копию и запустит 1С Designer только с параметром -TestOnly. Рабочая база\n${selected.sourceFile}\nне будет передана процессу. Проверка может занять до 30 минут. Закройте все процессы 1С.`)) return
    setDeepRunning(true)
    let checked: DeepCheckResult
    try {
      checked = await onecApi.deepCheckBackup(deepSource, selected.onecExecutablePath, selected.sourceFile)
    } catch (error) {
      checked = { success: false, checks: [], durationMs: 0, error: (error as Error).message }
    }
    setDeepResult(checked)
    setDeepRunning(false)
    const updated = appendHistory(selected, {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: checked.success ? 'success' : 'error',
      message: checked.success ? 'Глубокая проверка копии 1С пройдена без изменений' : checked.error || 'Глубокая проверка копии не пройдена',
      destPath: deepSource,
    })
    await persist({ ...config, databases: config.databases.map(item => item.id === selected.id ? updated : item) })
  }

  const rows = useMemo(() => config.databases.map((database, index) => ({ database, index, status: databaseStatus(database, index < databaseLimit) })), [config.databases, databaseLimit])

  return (
    <Card title="Резервные копии баз 1С" icon="💾" description="Локальные копии остаются только в выбранных папках и никогда не загружаются на сервер BX.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bx-border bg-bx-bg p-4">
          <div><p className="text-sm font-black text-bx-text">Подключённые базы</p><p className="mt-1 text-xs text-bx-muted">{limitLabel} · тариф {plan === 'premium' ? 'Premium' : plan === 'standard' ? 'Standard' : plan === 'trial' ? 'Trial' : 'Free'}</p></div>
          <Button onClick={() => void addDatabase()} disabled={loading}>{databaseLimit === 0 ? 'Доступно в Standard' : 'Добавить базу'}</Button>
        </div>
        {saveError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">Настройки не изменены: {saveError}</div>}

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-bx-border p-6 text-center"><p className="text-sm font-black text-bx-text">Базы пока не подключены</p><p className="mt-2 text-xs text-bx-muted">Добавление записи не изменяет базу 1С и не запускает копирование.</p></div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-bx-border" role="list" aria-label="Базы 1С">
            {rows.map(({ database, index, status: rowStatus }) => (
              <button key={database.id} type="button" role="listitem" onClick={() => setSelectedId(database.id)} className={`grid w-full grid-cols-1 gap-2 border-b border-bx-border px-4 py-3 text-left last:border-b-0 sm:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr] ${database.id === selectedId ? 'bg-blue-500/10' : 'bg-bx-surface hover:bg-bx-bg'}`}>
                <span className="min-w-0"><span className="block truncate text-sm font-black text-bx-text">{database.name}</span><span className="block truncate text-[10px] text-bx-muted">{database.sourceFile || 'Файл не выбран'}</span></span>
                <span><span className="block text-[10px] font-bold text-bx-muted">Последняя успешная</span><span className="text-xs text-bx-text">{database.lastBackupTime ? new Date(database.lastBackupTime).toLocaleString('ru-RU') : '—'}</span></span>
                <span><span className="block text-[10px] font-bold text-bx-muted">Следующая</span><span className="text-xs text-bx-text">{nextExecution(database, index < databaseLimit)}</span></span>
                <span><span className="block text-[10px] font-bold text-bx-muted">Состояние</span><span className={`text-xs font-black ${rowStatus.tone}`}>{index >= databaseLimit ? 'Вне текущего тарифа' : rowStatus.label}</span></span>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <section className="space-y-4 rounded-2xl border border-bx-border bg-bx-surface p-4" aria-label={`Настройки ${selected.name}`}>
            {!canOperate && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-bx-text">Эта запись сохранена, но расписание приостановлено текущим тарифом. База и существующие копии не удалены.</div>}
            {selected.missedAt && canOperate && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"><p className="text-sm font-black text-bx-text">Пропущена запланированная копия</p><p className="mt-1 text-xs text-bx-muted">Автозапуск запрещён — выберите действие.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="success" onClick={() => void resolveMissed('run')} disabled={!selected.sourceFile || !selected.destDir}>Создать сейчас</Button><Button variant="ghost" onClick={() => void resolveMissed('later')}>Напомнить позже</Button><Button variant="ghost" onClick={() => void resolveMissed('skip')}>Пропустить</Button></div></div>}

            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-bx-muted">Общий статус</p><p className={`mt-1 text-sm font-black ${status?.tone}`}>{status?.label}</p></div><Button variant="ghost" onClick={() => void removeDatabase()}>Убрать из списка</Button></div>
            <div><label className="mb-1.5 block text-xs text-bx-muted">Название базы</label><input value={nameDraft} disabled={!canOperate} onChange={event => setNameDraft(event.target.value)} onBlur={() => { const name = nameDraft.trim() || selected.name; setNameDraft(name); void updateSelected({ name }) }} className="w-full rounded-xl border border-bx-border bg-bx-bg px-3 py-2 text-sm text-bx-text" /></div>
            <div><label className="mb-1.5 block text-xs text-bx-muted">Рабочий файл 1Cv8.1CD</label><div className="flex gap-2"><div className="min-w-0 flex-1 truncate rounded-xl border border-bx-border bg-bx-bg px-3 py-2 text-sm text-bx-text">{selected.sourceFile || 'Файл не выбран'}</div><Button variant="ghost" disabled={!canOperate} onClick={() => void pickSource()}>Выбрать…</Button></div></div>
            <div><label className="mb-1.5 block text-xs text-bx-muted">Папка для копий</label><div className="flex gap-2"><div className="min-w-0 flex-1 truncate rounded-xl border border-bx-border bg-bx-bg px-3 py-2 text-sm text-bx-text">{selected.destDir || 'Папка не выбрана'}</div><Button variant="ghost" disabled={!canOperate} onClick={() => void pickDestination()}>Выбрать…</Button></div></div>

            <div className="grid gap-3 rounded-xl border border-bx-border bg-bx-bg p-3 sm:grid-cols-2"><label className="flex min-h-11 items-center justify-between gap-3 text-xs font-bold text-bx-text"><span>Автоматическое расписание</span><input type="checkbox" checked={canOperate && selected.enabled} disabled={!canOperate || !selected.sourceFile || !selected.destDir} onChange={event => void updateSelected({ enabled: event.target.checked })} /></label><label className="text-xs text-bx-muted">Время выполнения<input type="time" value={selected.scheduleTime} disabled={!canOperate} onChange={event => void updateSelected({ scheduleTime: event.target.value })} className="mt-1 block w-full rounded-lg border border-bx-border bg-bx-surface px-2 py-2 text-xs text-bx-text" /></label><p className="sm:col-span-2 text-[10px] text-bx-muted">Ежедневная копия; воскресная также становится недельной, копия первого числа — месячной. План действует только на этом устройстве.</p></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bx-border pt-4"><span className="text-xs text-bx-muted">{saving ? 'Сохранение настроек…' : 'Содержимое базы не передаётся BX'}</span><Button variant="success" loading={running} disabled={!canOperate || !selected.sourceFile || !selected.destDir} onClick={() => void runBackup()}>Создать копию сейчас</Button></div>
            {result && <div className={`rounded-xl p-3 text-sm ${result.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{result.success ? `Копия создана: ${result.destPath}${result.sizeBytes ? ` (${formatBytes(result.sizeBytes)})` : ''}` : `Ошибка: ${result.error}`}</div>}

            {(selected.history?.length ?? 0) > 0 && <details className="rounded-xl border border-bx-border bg-bx-bg p-3"><summary className="cursor-pointer text-xs font-black text-bx-text">История · {selected.history?.length}</summary><div className="mt-3 space-y-2">{selected.history?.slice(0, 10).map(entry => <div key={entry.id} className="rounded-lg border border-bx-border bg-bx-surface p-3"><p className="text-xs font-bold text-bx-text">{entry.status === 'success' ? 'Успешно' : entry.status === 'attention' ? 'Требует внимания' : 'Ошибка'} · {entry.message}</p><p className="mt-1 break-all text-[10px] text-bx-muted">{new Date(entry.createdAt).toLocaleString('ru-RU')}{entry.sizeBytes ? ` · ${formatBytes(entry.sizeBytes)}` : ''}{entry.destPath ? ` · ${entry.destPath}` : ''}</p></div>)}</div></details>}

            <details className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] p-3"><summary className="cursor-pointer text-sm font-black text-bx-text">Глубокая проверка копии</summary><div className="mt-4 space-y-3"><p className="text-xs text-bx-muted">Только Windows. BX копирует выбранный backup во временный каталог, запускает логическую и ссылочную проверку 1С Designer с <b>-TestOnly</b>, повторно сверяет SHA-256 и удаляет временные файлы. Исправление базы и передача паролей запрещены.</p><div><label className="mb-1 block text-xs text-bx-muted">Резервная копия для теста</label><div className="flex gap-2"><div className="min-w-0 flex-1 truncate rounded-lg border border-bx-border bg-bx-bg px-3 py-2 text-xs text-bx-text">{deepSource || 'Не выбрана'}</div><Button variant="ghost" disabled={!canOperate} onClick={() => void pickDeepCheckSource()}>Выбрать…</Button></div></div><div><label className="mb-1 block text-xs text-bx-muted">1cv8.exe</label><div className="flex gap-2"><div className="min-w-0 flex-1 truncate rounded-lg border border-bx-border bg-bx-bg px-3 py-2 text-xs text-bx-text">{selected.onecExecutablePath || 'Не выбран'}</div><Button variant="ghost" disabled={!canOperate} onClick={() => void pickOnecExecutable()}>Выбрать…</Button></div></div><p className="text-[10px] text-bx-muted">Если база требует имя пользователя или пароль 1С, проверка безопасно остановится: BX не запрашивает, не сохраняет и не передаёт такие данные.</p><div className="flex justify-end"><Button variant="success" loading={deepRunning} disabled={!canOperate || !deepSource || !selected.onecExecutablePath || !selected.sourceFile || deepSource === selected.sourceFile} onClick={() => void runDeepCheck()}>Запустить безопасный тест</Button></div>{deepSource === selected.sourceFile && <p role="alert" className="text-xs text-red-400">Рабочий файл нельзя проверять напрямую. Выберите отдельную резервную копию.</p>}{deepResult && <div role="status" className={`rounded-lg p-3 ${deepResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}><p className={`text-sm font-black ${deepResult.success ? 'text-emerald-400' : 'text-red-400'}`}>{deepResult.success ? 'Копия прошла глубокую проверку' : 'Глубокая проверка не пройдена'}</p><p className="mt-1 text-xs text-bx-muted">Длительность: {Math.max(1, Math.round(deepResult.durationMs / 1000))} сек.{deepResult.error ? ` · ${deepResult.error}` : ''}</p><ul className="mt-2 space-y-1">{deepResult.checks.map(check => <li key={check.id} className="break-all text-xs text-bx-text">{check.ok ? '✓' : '✗'} <b>{check.label}:</b> {check.message}</li>)}</ul>{deepResult.logExcerpt && <details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-bx-muted">Технический журнал 1С</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-bx-bg p-2 text-[10px] text-bx-muted">{deepResult.logExcerpt}</pre></details>}</div>}</div></details>

            <details className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-3"><summary className="cursor-pointer text-sm font-black text-bx-text">Восстановить из копии</summary><div className="mt-4 space-y-3"><p className="text-xs text-bx-muted">Перед заменой BX выполнит preflight, создаст страховочную копию и проверит SHA-256.</p><div><label className="mb-1 block text-xs text-bx-muted">Копия для восстановления</label><div className="flex gap-2"><div className="min-w-0 flex-1 truncate rounded-lg border border-bx-border bg-bx-bg px-3 py-2 text-xs text-bx-text">{restoreSource || 'Не выбрана'}</div><Button variant="ghost" disabled={!canOperate} onClick={() => void pickRestoreFile('source')}>Выбрать…</Button></div></div><div><label className="mb-1 block text-xs text-bx-muted">Рабочая база</label><div className="flex gap-2"><div className="min-w-0 flex-1 truncate rounded-lg border border-bx-border bg-bx-bg px-3 py-2 text-xs text-bx-text">{restoreTarget || 'Не выбрана'}</div><Button variant="ghost" disabled={!canOperate} onClick={() => void pickRestoreFile('target')}>Изменить…</Button></div></div><div className="flex justify-end"><Button variant="danger" loading={restoring} disabled={!canOperate || !restoreSource || !restoreTarget || restoreSource === restoreTarget} onClick={() => void runRestore()}>Проверить и восстановить</Button></div>{restoreResult && <div role="status" className={`rounded-lg p-3 ${restoreResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}><p className={`text-sm font-black ${restoreResult.success ? 'text-emerald-400' : 'text-red-400'}`}>{restoreResult.success ? 'База восстановлена и проверена' : restoreResult.rolledBack ? 'Выполнен откат' : 'Восстановление не выполнено'}</p>{restoreResult.error && <p className="mt-1 text-xs text-bx-muted">{restoreResult.error}</p>}<ul className="mt-2 space-y-1">{restoreResult.checks.map(check => <li key={check.id} className="break-all text-xs text-bx-text">{check.ok ? '✓' : '✗'} <b>{check.label}:</b> {check.message}</li>)}</ul>{restoreResult.safetyCopyPath && <p className="mt-2 break-all text-xs text-bx-muted">Страховочная копия: {restoreResult.safetyCopyPath}</p>}</div>}</div></details>
          </section>
        )}
      </div>
      {paywall && <PaywallModal feature={databaseLimit === 0 ? 'Резервные копии баз 1С — Standard или Premium' : 'Дополнительные базы 1С — до пяти в Premium'} onClose={() => setPaywall(false)} />}
    </Card>
  )
}

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/db/supabase'
import { clearPin, isPinEnabled, setPinEnabled } from '../lib/auth/pin'
import { APP_VERSION } from '../../shared/version'
import { db } from '../lib/db/localDb'
import { usePlan } from '../lib/plan'
import { useToast } from '../lib/ui/ToastContext'
import { loadEcpKeys, saveEcpKeys } from '../lib/ecpStorage'
import { applyTheme } from '../lib/theme'
import { CompanyTeamPanel } from '../components/CompanyTeamPanel'
import { currentFontScale, FONT_SCALE_OPTIONS, saveFontScale, type FontScale } from '../lib/uiScale'
import Icon from '../lib/ui/Icon'
import { requestNotificationPermission } from '../lib/notifications'
import { todayISO } from '../lib/dates'
import { parseSettingsBackup, settingsBackupSummary, type SettingsBackupPayload } from '../lib/settingsBackup'
import { useCompany } from '../lib/CompanyContext'
import { useNavigate } from 'react-router-dom'

const THEME_KEY = 'bx_theme'
const NOTIFY_KEY = 'bx_notify_days'
const IDLE_LOCK_KEY = 'bx_idle_lock'

type NotifyDays = '1' | '3' | '7' | 'off'
type IdleLock = 'off' | '5' | '10' | '30' | '60'
type TabType = 'overview' | 'workspace' | 'notifications' | 'security' | 'ai' | 'team' | 'data' | 'integrations' | 'billing' | 'about'
type DashboardWidgets = { weather: boolean; currency: boolean; notifications: boolean; horoscope: boolean }
type DataStats = { templates: number; counterparties: number; transactions: number; employees: number }
const DEFAULT_WIDGETS: DashboardWidgets = { weather: true, currency: true, notifications: true, horoscope: false }

export default function Settings() {
  const { plan, isPro, isTrial, trialDaysLeft, planExpiresAt, referralCode, refresh: refreshPlan } = usePlan()
  const toast = useToast()
  const navigate = useNavigate()
  const { active: activeCompany, companies, startCompanyEdit, startCompanyCreation } = useCompany()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month')
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [notifyDays, setNotifyDays] = useState<NotifyDays>('3')
  const [signingOut, setSigningOut] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showHoroscope, setShowHoroscope] = useState(false)
  const [payMethod, setPayMethod] = useState<'card' | 'invoice'>('card')
  const [autostartEnabled, setAutostartEnabled] = useState(false)
  const [idleLock, setIdleLock] = useState<IdleLock>('off')
  const [pinEnabled, setPinEnabledState] = useState(true)
  const [fontScale, setFontScale] = useState<FontScale>(() => currentFontScale())
  const [aiProvider, setAiProvider] = useState<'gemini' | 'ollama'>(() => localStorage.getItem('bx_ai_provider') === 'ollama' ? 'ollama' : 'gemini')
  const [ollamaHost, setOllamaHost] = useState(() => localStorage.getItem('bx_ollama_host') || 'http://localhost:11434')
  const [ollamaModel, setOllamaModel] = useState(() => localStorage.getItem('bx_ollama_model') || 'deepseek-r1:1.5b')
  const [widgets, setWidgets] = useState<DashboardWidgets>(DEFAULT_WIDGETS)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => 'Notification' in window ? Notification.permission : 'unsupported')
  const [lastBackupAt, setLastBackupAt] = useState(() => localStorage.getItem('bx_last_backup_at') || '')
  const [dataStats, setDataStats] = useState<DataStats>({ templates: 0, counterparties: 0, transactions: 0, employees: 0 })
  const [pendingImport, setPendingImport] = useState<SettingsBackupPayload | null>(null)
  const [confirmAction, setConfirmAction] = useState<'reset-pin' | 'clear-cache' | 'sign-out' | null>(null)

  function openExternalUrl(url: string) {
    const bridge = window as Window & { bx?: { openExternal?: (target: string) => void } }
    bridge.bx?.openExternal ? bridge.bx.openExternal(url) : window.open(url, '_blank')
  }

  const handleToggleAutostart = async (val: boolean) => {
    setAutostartEnabled(val)
    if (window.bx?.autostart?.set) await window.bx.autostart.set(val)
  }

  const handleRedeemPromo = async () => {
    const code = promoCode.trim().toUpperCase()
    if (!code || promoLoading) return
    setPromoLoading(true)
    try {
      const { data, error } = await supabase.rpc('bx_redeem_promo', { p_code: code })
      if (error) throw error
      const res = data as { ok?: boolean; message?: string } | null
      if (res?.ok) {
        toast.success(res.message || 'Промокод активирован')
        setPromoCode('')
        await refreshPlan()
      } else {
        toast.error(res?.message || 'Не удалось активировать промокод')
      }
    } catch {
      toast.error('Ошибка активации. Проверьте подключение и попробуйте снова.')
    } finally {
      setPromoLoading(false)
    }
  }

  const handleGenerateInvoice = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const html = `
      <html>
      <head>
        <title>Счет на оплату № BX-${Date.now().toString().slice(-6)}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #333; line-height: 1.4; font-size: 14px; }
          .title { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .footer-section { margin-top: 40px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="title">СЧЕТ НА ОПЛАТУ № BX-${Date.now().toString().slice(-6)} от ${new Date().toLocaleDateString('ru-RU')} г.</div>
        <p><strong>Поставщик:</strong> ООО «BX SOFTWARE», ИНН 309876543, р/с 20208000900123456001 в АКБ «Капиталбанк», МФО 00440, Адрес: г. Ташкент, ул. А. Темура, 45</p>
        <p><strong>Покупатель:</strong> ${userEmail ? `Пользователь (${userEmail})` : 'Плательщик подписки BX'}</p>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Наименование товара (услуги)</th>
              <th>Кол-во</th>
              <th>Ед. изм.</th>
              <th>Цена, сум</th>
              <th>Сумма, сум</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Лицензия на использование ПО "BX Помощник Бухгалтера" (подписка Pro на 12 месяцев)</td>
              <td>1</td>
              <td>шт</td>
              <td>1 500 000</td>
              <td>1 500 000</td>
            </tr>
            <tr class="bold">
              <td colspan="5" class="right">Итого к оплате:</td>
              <td>1 500 000</td>
            </tr>
          </tbody>
        </table>
        <p>Всего к оплате один миллион пятьсот тысяч сум 00 тийин, без НДС.</p>
        <div class="footer-section">
          <div>
            <p>Руководитель: ___________________ / Черников А. /</p>
            <p class="bold">М.П.</p>
          </div>
          <div>
            <p>Бухгалтер: ___________________ / Черников А. /</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `
    w.document.write(html)
    w.document.close()
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email)
      }
      if (data.user?.id) {
        setUserId(data.user.id)
      }
    })
    const saved = localStorage.getItem(NOTIFY_KEY) as NotifyDays
    if (saved) setNotifyDays(saved)

    const savedIdle = localStorage.getItem(IDLE_LOCK_KEY) as IdleLock
    if (savedIdle) setIdleLock(savedIdle)
    setPinEnabledState(isPinEnabled())

    const savedTheme = localStorage.getItem(THEME_KEY) as 'dark' | 'light'
    if (savedTheme) setTheme(savedTheme)
    setFontScale(currentFontScale())

    if (window.bx?.autostart?.get) window.bx.autostart.get().then(setAutostartEnabled)

    try {
      const stored = localStorage.getItem('bx_dashboard_widgets')
      if (stored) {
        const savedWidgets = { ...DEFAULT_WIDGETS, ...JSON.parse(stored) }
        setWidgets(savedWidgets)
        setShowHoroscope(!!savedWidgets.horoscope)
      }
    } catch { /* битый кэш виджетов — игнорируем */ }
    Promise.all([db.templates.count(), db.counterparties.count(), db.transactions.count(), db.employees.count()])
      .then(([templates, counterparties, transactions, employees]) => setDataStats({ templates, counterparties, transactions, employees }))
      .catch(() => undefined)
  }, [])

  function saveNotify(v: NotifyDays) {
    setNotifyDays(v)
    localStorage.setItem(NOTIFY_KEY, v)
  }

  function saveIdleLock(v: IdleLock) {
    setIdleLock(v)
    localStorage.setItem(IDLE_LOCK_KEY, v)
  }

  function saveTheme(t: 'dark' | 'light') {
    setTheme(t)
    localStorage.setItem(THEME_KEY, t)
    applyTheme(t)
  }

  function changeFontScale(value: FontScale) {
    setFontScale(value)
    saveFontScale(value)
  }

  function toggleHoroscope(visible: boolean) {
    setShowHoroscope(visible)
    try {
      const stored = localStorage.getItem('bx_dashboard_widgets')
      const parsed = stored ? JSON.parse(stored) : { weather: true, currency: true, notifications: true, horoscope: false }
      parsed.horoscope = visible
      localStorage.setItem('bx_dashboard_widgets', JSON.stringify(parsed))
    } catch { /* localStorage недоступен — не критично */ }
  }

  function toggleWidget(key: keyof DashboardWidgets) {
    setWidgets(current => {
      const next = { ...current, [key]: !current[key] }
      localStorage.setItem('bx_dashboard_widgets', JSON.stringify(next))
      if (key === 'horoscope') setShowHoroscope(next.horoscope)
      return next
    })
  }

  const handleBackupExport = async () => {
    try {
      const ecpKeys = await loadEcpKeys()
      const localRequisites = localStorage.getItem('bx_company_requisites') || '[]'
      const theme = localStorage.getItem('bx_theme') || 'dark'
      const notifyDays = localStorage.getItem('bx_notify_days') || '3'
      const idleLock = localStorage.getItem('bx_idle_lock') || 'off'
      const pinEnabled = isPinEnabled()
      const fontScale = currentFontScale()
      
      const templates = await db.templates.toArray()
      const counterparties = await db.counterparties.toArray()
      
      const backupData = {
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
        ecpKeys,
        localRequisites: JSON.parse(localRequisites),
        theme,
        notifyDays,
        idleLock,
        pinEnabled,
        fontScale,
        templates,
        counterparties,
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BX_Backup_${todayISO()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      const backupAt = new Date().toISOString()
      localStorage.setItem('bx_last_backup_at', backupAt)
      setLastBackupAt(backupAt)
      toast.success('Резервная копия создана')
    } catch (e: unknown) {
      console.error(e)
      toast.error('Ошибка экспорта данных: ' + (e instanceof Error ? e.message : 'неизвестная ошибка'))
    }
  }

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target?.result as string
      if (!text) return
      try {
        setPendingImport(parseSettingsBackup(text))
      } catch (err: unknown) {
        console.error(err)
        toast.error('Не удалось прочитать копию: ' + (err instanceof Error ? err.message : 'неизвестная ошибка'))
      }
    }
    reader.readAsText(file)
  }

  async function confirmBackupImport() {
    const data = pendingImport
    if (!data) return
    try {
      if (Array.isArray(data.ecpKeys)) await saveEcpKeys(data.ecpKeys as Parameters<typeof saveEcpKeys>[0])
      if (data.localRequisites) localStorage.setItem('bx_company_requisites', JSON.stringify(data.localRequisites))
      if (data.theme) { localStorage.setItem(THEME_KEY, data.theme); setTheme(data.theme); applyTheme(data.theme) }
      if (data.notifyDays) { localStorage.setItem(NOTIFY_KEY, data.notifyDays); setNotifyDays(data.notifyDays) }
      if (data.idleLock) { localStorage.setItem(IDLE_LOCK_KEY, data.idleLock); setIdleLock(data.idleLock) }
      if (data.pinEnabled !== undefined) { setPinEnabled(data.pinEnabled); setPinEnabledState(data.pinEnabled) }
      if (data.fontScale) { saveFontScale(data.fontScale); setFontScale(data.fontScale) }
      if (Array.isArray(data.templates)) { await db.templates.clear(); await db.templates.bulkPut(data.templates as Parameters<typeof db.templates.bulkPut>[0]) }
      if (Array.isArray(data.counterparties)) { await db.counterparties.clear(); await db.counterparties.bulkPut(data.counterparties as Parameters<typeof db.counterparties.bulkPut>[0]) }
      setPendingImport(null)
      toast.success('Данные восстановлены. Приложение обновляется…')
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (error) {
      toast.error('Не удалось восстановить данные: ' + (error instanceof Error ? error.message : 'неизвестная ошибка'))
    }
  }

  async function enableNotifications() {
    const allowed = await requestNotificationPermission()
    setNotificationPermission('Notification' in window ? Notification.permission : 'unsupported')
    allowed ? toast.success('Системные уведомления включены') : toast.error('Разрешение не выдано. Проверьте настройки системы или браузера.')
  }

  function saveAiSettings() {
    localStorage.setItem('bx_ai_provider', aiProvider)
    localStorage.setItem('bx_ollama_host', ollamaHost.trim())
    localStorage.setItem('bx_ollama_model', ollamaModel.trim())
    window.dispatchEvent(new Event('storage'))
    toast.success('Настройки ИИ сохранены')
  }

  async function runConfirmedAction() {
    if (confirmAction === 'reset-pin') await resetPin()
    if (confirmAction === 'sign-out') await signOut()
    if (confirmAction === 'clear-cache') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('bx_cache_') || k.startsWith('bx_transactions_') || k.startsWith('bx_employees_'))
      keys.forEach(k => localStorage.removeItem(k))
      await Promise.all([db.transactions.clear(), db.employees.clear()])
      setDataStats(current => ({ ...current, transactions: 0, employees: 0 }))
      toast.success('Локальный операционный кэш очищен')
    }
    setConfirmAction(null)
  }

  async function signOut() {
    setSigningOut(true)
    clearPin()
    await supabase.auth.signOut()
    window.location.reload()
  }

  async function resetPin() {
    clearPin()
    window.location.reload()
  }

  function togglePinEnabled(on: boolean) {
    setPinEnabledState(on)
    setPinEnabled(on)
  }

  const navItems: Array<{ id: TabType; label: string; desc: string; icon: string }> = [
    { id: 'overview', label: 'Обзор', desc: 'Состояние BX', icon: 'dashboard' },
    { id: 'workspace', label: 'Интерфейс', desc: 'Тема, масштаб, виджеты', icon: 'monitor' },
    { id: 'notifications', label: 'Уведомления', desc: 'Сроки и системные оповещения', icon: 'bell' },
    { id: 'security', label: 'Безопасность', desc: 'PIN, блокировка и сессия', icon: 'shield' },
    { id: 'ai', label: 'ИИ и приватность', desc: 'Облако или свой сервер', icon: 'ai' },
    { id: 'team', label: 'Команда', desc: 'Роли и приглашения', icon: 'users' },
    { id: 'data', label: 'Данные и копии', desc: 'Экспорт, импорт, кэш', icon: 'save' },
    { id: 'integrations', label: 'Интеграции', desc: 'Telegram, 1С и ЭЦП', icon: 'services' },
    { id: 'billing', label: 'Тариф', desc: 'План, оплата, промокод', icon: 'finance' },
    { id: 'about', label: 'О программе', desc: `Версия ${APP_VERSION}`, icon: 'info' },
  ]

  const sectionTitle: Record<TabType, { eyebrow: string; title: string; description: string }> = {
    overview: { eyebrow: 'Центр управления', title: 'Всё под контролем', description: 'Главные параметры, защита, данные и подключённые возможности BX в одном месте.' },
    workspace: { eyebrow: 'Рабочая среда', title: 'Интерфейс под вас', description: 'Настройте читаемость и состав дашборда — изменения применяются сразу.' },
    notifications: { eyebrow: 'Контроль сроков', title: 'Уведомления без шума', description: 'Выберите горизонт предупреждений и разрешите системные оповещения.' },
    security: { eyebrow: 'Защита доступа', title: 'Безопасность устройства', description: 'PIN и автоблокировка защищают рабочие данные, когда вы отходите от компьютера.' },
    ai: { eyebrow: 'BX Intelligence', title: 'ИИ и приватность', description: 'Выберите облачный режим или собственную Ollama для локальной обработки.' },
    team: { eyebrow: 'Компания', title: 'Команда и права', description: 'Управляйте приглашениями и доступом сотрудников выбранной компании.' },
    data: { eyebrow: 'Хранилище', title: 'Данные и резервные копии', description: 'Проверьте объём локальных данных, создайте копию или безопасно восстановите её.' },
    integrations: { eyebrow: 'Связи', title: 'Интеграции BX', description: 'Подключите рабочие каналы и перейдите к диагностике системных сервисов.' },
    billing: { eyebrow: 'Подписка', title: 'Тариф и оплата', description: 'Текущий план, способы оплаты, промокод и реферальная ссылка.' },
    about: { eyebrow: 'BX', title: 'О программе', description: 'Версия, поддержка и принципы продукта.' },
  }

  function SettingRow({ icon, label, desc, children }: { icon: string; label: string; desc?: string; children: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-3 border-b border-bx-border/70 px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-bx-border bg-bx-surface-2 text-bx-muted"><Icon name={icon} className="h-4 w-4" /></span>
          <div><p className="text-sm font-bold text-bx-text">{label}</p>{desc && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-bx-muted">{desc}</p>}</div>
        </div>
        <div className="flex-shrink-0 pl-12 sm:pl-0">{children}</div>
      </div>
    )
  }

  function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
    return (
      <button type="button" onClick={onChange} role="switch" aria-checked={checked} aria-label={label}
        className={`relative h-7 w-12 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${checked ? 'border-blue-600 bg-blue-600' : 'border-bx-border-2 bg-bx-bg'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    )
  }

  const card = 'rounded-3xl border border-bx-border bg-bx-surface shadow-sm'
  const button = 'min-h-11 rounded-xl px-4 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
  const input = 'min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm text-bx-text focus:outline-none focus:ring-2 focus:ring-blue-500/30'
  const currentHeader = sectionTitle[activeTab]
  const securityScore = pinEnabled ? (idleLock === 'off' ? 75 : 100) : 35
  const backupSummary = pendingImport ? settingsBackupSummary(pendingImport) : null

  return (
    <div className="flex flex-1 overflow-hidden bg-bx-bg text-bx-text">
      <aside className="flex w-[292px] flex-shrink-0 flex-col border-r border-bx-border bg-bx-surface-2/55">
        <div className="border-b border-bx-border px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name="settings" className="h-5 w-5" /></span>
            <div><h1 className="text-sm font-black">Настройки BX</h1><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-bx-muted">Control center · v{APP_VERSION}</p></div>
          </div>
        </div>
        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3" aria-label="Разделы настроек">
          {navItems.map(item => (
            <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? 'page' : undefined}
              className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${activeTab === item.id ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'border-transparent text-bx-muted hover:border-bx-border hover:bg-bx-surface hover:text-bx-text'}`}>
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${activeTab === item.id ? 'bg-white/15' : 'border border-bx-border bg-bx-surface'}`}><Icon name={item.icon} className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block text-xs font-black">{item.label}</span><span className={`mt-0.5 block truncate text-[10px] ${activeTab === item.id ? 'text-white/75' : 'text-bx-muted'}`}>{item.desc}</span></span>
            </button>
          ))}
        </nav>
        <div className="border-t border-bx-border p-4">
          <div className="rounded-2xl border border-bx-border bg-bx-surface px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Активная компания</p>
            <p className="mt-1 truncate text-xs font-bold text-bx-text">{activeCompany?.name || 'Не выбрана'}</p>
          </div>
        </div>
      </aside>

      <main className="custom-scrollbar flex-1 overflow-y-auto">
        <div className="bx-page-container py-6 lg:py-8">
          <header className="relative mb-6 overflow-hidden rounded-[28px] border border-bx-border bg-bx-surface px-6 py-6 shadow-sm">
            <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-blue-600/[0.08] to-transparent" />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">{currentHeader.eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-tight">{currentHeader.title}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-bx-muted">{currentHeader.description}</p></div>
              <div className="flex items-center gap-2 rounded-2xl border border-bx-border bg-bx-bg/70 px-3 py-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs font-bold">BX работает</span></div>
            </div>
          </header>

          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Защита устройства', value: `${securityScore}%`, detail: pinEnabled ? (idleLock === 'off' ? 'Включите автоблокировку' : 'PIN и автоблокировка включены') : 'PIN отключён', icon: 'shield', tab: 'security' as TabType, tone: securityScore === 100 ? 'text-emerald-600' : 'text-amber-600' },
                  { label: 'Резервная копия', value: lastBackupAt ? 'Создана' : 'Не создана', detail: lastBackupAt ? new Date(lastBackupAt).toLocaleString('ru-RU') : 'Сохраните локальные данные', icon: 'save', tab: 'data' as TabType, tone: lastBackupAt ? 'text-emerald-600' : 'text-amber-600' },
                  { label: 'Рабочие компании', value: String(companies.length), detail: activeCompany?.name || 'Выберите или добавьте компанию', icon: 'building', tab: 'team' as TabType, tone: 'text-blue-600' },
                  { label: 'Режим ИИ', value: aiProvider === 'ollama' ? 'Локальный' : 'Облачный', detail: aiProvider === 'ollama' ? ollamaModel : 'Gemini через защищённую функцию', icon: 'ai', tab: 'ai' as TabType, tone: 'text-violet-600' },
                ].map(item => (
                  <button key={item.label} type="button" onClick={() => setActiveTab(item.tab)} className={`${card} min-h-36 p-4 text-left transition-colors hover:border-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
                    <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bx-surface-2"><Icon name={item.icon} className={`h-5 w-5 ${item.tone}`} /></span><Icon name="arrowR" className="h-4 w-4 text-bx-muted" /></div>
                    <p className={`mt-4 text-xl font-black ${item.tone}`}>{item.value}</p><p className="mt-1 text-xs font-bold">{item.label}</p><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">{item.detail}</p>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
                <section className={`${card} p-5`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-bx-muted">Быстрый старт</p><h3 className="mt-1 text-lg font-black">Настройте рабочий контур</h3></div><span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400">4 шага</span></div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { title: activeCompany ? 'Профиль компании' : 'Добавить компанию', desc: activeCompany ? 'Уточнить реквизиты и профиль' : 'Настроить налоги и календарь', icon: 'building', action: () => activeCompany ? startCompanyEdit(activeCompany) : startCompanyCreation() },
                      { title: 'Проверить уведомления', desc: notificationPermission === 'granted' ? 'Системные уведомления разрешены' : 'Разрешить оповещения о сроках', icon: 'bell', action: () => setActiveTab('notifications') },
                      { title: 'Создать резервную копию', desc: 'Сохранить настройки и справочники', icon: 'save', action: handleBackupExport },
                      { title: 'Настроить приватный ИИ', desc: 'Подключить Ollama на своём сервере', icon: 'shield', action: () => setActiveTab('ai') },
                    ].map(step => <button key={step.title} type="button" onClick={step.action} className="flex min-h-20 items-center gap-3 rounded-2xl border border-bx-border bg-bx-bg p-3 text-left transition-colors hover:border-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><Icon name={step.icon} className="h-5 w-5" /></span><span><span className="block text-xs font-black">{step.title}</span><span className="mt-1 block text-[10px] leading-relaxed text-bx-muted">{step.desc}</span></span></button>)}
                  </div>
                </section>
                <section className={`${card} p-5`}><p className="text-xs font-black uppercase tracking-wider text-bx-muted">Локальные данные</p><div className="mt-4 space-y-3">{Object.entries({ 'Шаблоны': dataStats.templates, 'Контрагенты': dataStats.counterparties, 'Операции': dataStats.transactions, 'Сотрудники': dataStats.employees }).map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl bg-bx-bg px-3 py-2.5"><span className="text-xs text-bx-muted">{label}</span><span className="font-mono text-sm font-black">{value}</span></div>)}</div><button type="button" onClick={() => setActiveTab('data')} className={`${button} mt-4 w-full border border-bx-border bg-bx-surface-2 hover:bg-bx-bg`}>Управлять данными</button></section>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <section className={card}>
                <SettingRow icon="sun" label="Тема оформления" desc="Светлая для дневной работы или тёмная для кабинета и слабого освещения."><div className="flex rounded-xl border border-bx-border bg-bx-bg p-1">{(['light', 'dark'] as const).map(value => <button key={value} type="button" onClick={() => saveTheme(value)} className={`${button} min-w-24 ${theme === value ? 'bg-blue-600 text-white' : 'text-bx-muted hover:bg-bx-surface-2'}`}>{value === 'light' ? 'Светлая' : 'Тёмная'}</button>)}</div></SettingRow>
                <SettingRow icon="monitor" label="Масштаб интерфейса" desc="Увеличивает текст, кнопки и интервалы во всём приложении без перезапуска."><div className="grid grid-cols-4 gap-1 rounded-xl border border-bx-border bg-bx-bg p-1" role="group" aria-label="Масштаб интерфейса">{FONT_SCALE_OPTIONS.map(option => <button key={option.value} type="button" onClick={() => changeFontScale(option.value)} aria-pressed={fontScale === option.value} className={`${button} min-w-14 px-2 ${fontScale === option.value ? 'bg-blue-600 text-white' : 'text-bx-muted hover:bg-bx-surface-2'}`}>{option.hint}</button>)}</div></SettingRow>
                <SettingRow icon="dashboard" label="Погода на дашборде" desc="Показывать краткий прогноз рядом с рабочей сводкой."><Toggle checked={widgets.weather} onChange={() => toggleWidget('weather')} label="Показывать погоду" /></SettingRow>
                <SettingRow icon="exchange" label="Курсы валют" desc="Показывать основные курсы ЦБ РУз на рабочем столе."><Toggle checked={widgets.currency} onChange={() => toggleWidget('currency')} label="Показывать курсы валют" /></SettingRow>
                <SettingRow icon="bell" label="Центр уведомлений" desc="Показывать сводку событий и оповещений на дашборде."><Toggle checked={widgets.notifications} onChange={() => toggleWidget('notifications')} label="Показывать уведомления" /></SettingRow>
                <SettingRow icon="ai" label="Бухо-гороскоп" desc="Оставить шуточный прогноз в составе рабочего стола."><Toggle checked={showHoroscope} onChange={() => toggleHoroscope(!showHoroscope)} label="Показывать Бухо-гороскоп" /></SettingRow>
              </section>
              <section className={`${card} h-fit p-5`}><p className="text-[10px] font-black uppercase tracking-[0.16em] text-bx-muted">Предпросмотр</p><div className="mt-4 rounded-2xl border border-bx-border bg-bx-bg p-4"><div className="flex items-center justify-between"><span className="text-xs font-black">Отчётность за июль</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-400">ГОТОВО</span></div><p className="mt-3 text-sm leading-relaxed text-bx-muted">BX сохраняет читаемость карточек при масштабе {fontScale}%. Содержимое переносится, а действия остаются доступными.</p><div className="mt-4 flex gap-2"><span className="h-8 flex-1 rounded-lg bg-blue-600" /><span className="h-8 w-20 rounded-lg border border-bx-border bg-bx-surface" /></div></div></section>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <section className={card}>
                <SettingRow icon="bell" label="Системные уведомления" desc={notificationPermission === 'granted' ? 'Разрешение выдано — BX может показывать оповещения вне активного окна.' : notificationPermission === 'denied' ? 'Разрешение заблокировано в настройках системы или браузера.' : 'Разрешите BX показывать напоминания о задачах и сроках.'}>{notificationPermission === 'granted' ? <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-700 dark:text-emerald-400">Разрешены</span> : <button type="button" onClick={enableNotifications} disabled={notificationPermission === 'unsupported'} className={`${button} bg-blue-600 text-white disabled:opacity-40`}>Разрешить</button>}</SettingRow>
                <SettingRow icon="clock" label="Горизонт напоминаний" desc="За сколько дней предупреждать о налоговой отчётности и других дедлайнах."><div className="flex flex-wrap gap-1 rounded-xl border border-bx-border bg-bx-bg p-1">{(['off', '1', '3', '7'] as NotifyDays[]).map(value => <button key={value} type="button" onClick={() => saveNotify(value)} className={`${button} min-w-16 ${notifyDays === value ? 'bg-blue-600 text-white' : 'text-bx-muted hover:bg-bx-surface-2'}`}>{value === 'off' ? 'Выкл.' : `${value} дн.`}</button>)}</div></SettingRow>
                <SettingRow icon="planner" label="Задачи других сотрудников" desc="Назначение задачи зарегистрированному сотруднику создаёт уведомление в BX. Управление каналами команды будет расширено отдельно."><span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-700 dark:text-blue-400">Включено</span></SettingRow>
              </section>
              <section className={`${card} h-fit p-5`}><p className="text-xs font-black uppercase tracking-wider text-bx-muted">Как это работает</p><ol className="mt-4 space-y-3">{['BX отслеживает напоминания активных задач.', 'Системное уведомление появляется в назначенное время.', 'Центр уведомлений хранит рабочий контекст внутри приложения.'].map((text, index) => <li key={text} className="flex gap-3 text-xs leading-relaxed text-bx-muted"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 font-black text-blue-600">{index + 1}</span>{text}</li>)}</ol></section>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className={`${card} p-4`}><p className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Защита</p><p className={`mt-2 text-2xl font-black ${securityScore === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{securityScore}%</p><p className="mt-1 text-xs text-bx-muted">{pinEnabled ? 'PIN включён' : 'PIN отключён'}</p></div><div className={`${card} p-4`}><p className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Аккаунт</p><p className="mt-2 truncate text-sm font-black">{userEmail || 'Загрузка…'}</p><p className="mt-1 text-xs text-bx-muted">Синхронизация по пользователю</p></div><div className={`${card} p-4`}><p className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Автоблокировка</p><p className="mt-2 text-sm font-black">{idleLock === 'off' ? 'Выключена' : idleLock === '60' ? 'Через 1 час' : `Через ${idleLock} мин.`}</p><p className="mt-1 text-xs text-bx-muted">При бездействии</p></div></div>
              <section className={card}><SettingRow icon="shield" label="Защита PIN-кодом" desc="Запрашивать локальный код при запуске и после блокировки."><Toggle checked={pinEnabled} onChange={() => togglePinEnabled(!pinEnabled)} label="Защита PIN-кодом" /></SettingRow>{pinEnabled && <><SettingRow icon="clock" label="Автоблокировка" desc="Чем короче интервал, тем меньше риск доступа к данным на оставленном компьютере."><div className="flex flex-wrap gap-1 rounded-xl border border-bx-border bg-bx-bg p-1">{(['off', '5', '10', '30', '60'] as IdleLock[]).map(value => <button key={value} type="button" onClick={() => saveIdleLock(value)} className={`${button} min-w-14 ${idleLock === value ? 'bg-blue-600 text-white' : 'text-bx-muted hover:bg-bx-surface-2'}`}>{value === 'off' ? 'Выкл.' : value === '60' ? '1 ч' : `${value} м`}</button>)}</div></SettingRow><SettingRow icon="key" label="Сменить PIN" desc="Текущий локальный PIN будет удалён, новый задаётся при следующем входе."><button type="button" onClick={() => setConfirmAction('reset-pin')} className={`${button} border border-bx-border bg-bx-surface-2 hover:bg-bx-bg`}>Сбросить PIN</button></SettingRow></>}
                <SettingRow icon="external" label="Завершить сессию" desc="Удалить авторизацию и локальный PIN на этом устройстве."><button type="button" onClick={() => setConfirmAction('sign-out')} disabled={signingOut} className={`${button} bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400 disabled:opacity-40`}>{signingOut ? 'Выход…' : 'Выйти из аккаунта'}</button></SettingRow></section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <section className={`${card} p-5`}><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{([{ id: 'gemini', title: 'Облачный ИИ', desc: 'Gemini через серверную функцию BX. Быстрый старт и управляемые лимиты.', icon: 'globe' }, { id: 'ollama', title: 'Свой сервер', desc: 'Ollama в вашей сети. Данные обрабатываются выбранной локальной моделью.', icon: 'shield' }] as const).map(option => <button key={option.id} type="button" onClick={() => setAiProvider(option.id)} aria-pressed={aiProvider === option.id} className={`min-h-36 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${aiProvider === option.id ? 'border-blue-600 bg-blue-500/[0.08]' : 'border-bx-border bg-bx-bg hover:border-blue-500/30'}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><Icon name={option.icon} className="h-5 w-5" /></span><span className="mt-3 block text-sm font-black">{option.title}</span><span className="mt-1 block text-xs leading-relaxed text-bx-muted">{option.desc}</span></button>)}</div>{aiProvider === 'ollama' && <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-bx-text">Адрес Ollama<input value={ollamaHost} onChange={event => setOllamaHost(event.target.value)} placeholder="http://localhost:11434" className={`${input} mt-2 font-mono`} /></label><label className="text-xs font-bold text-bx-text">Модель<input value={ollamaModel} onChange={event => setOllamaModel(event.target.value)} placeholder="deepseek-r1:1.5b" className={`${input} mt-2 font-mono`} /></label></div>}<button type="button" onClick={saveAiSettings} className={`${button} mt-5 bg-blue-600 text-white hover:bg-blue-700`}><span className="inline-flex items-center gap-2"><Icon name="save" className="h-4 w-4" />Сохранить режим ИИ</span></button></section>
              <section className={`${card} h-fit p-5`}><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><Icon name="shield" className="h-5 w-5" /></span><h3 className="mt-4 text-base font-black">Приватность по умолчанию</h3><p className="mt-2 text-xs leading-relaxed text-bx-muted">BX не должен отправлять содержимое документов администраторам. В локальном режиме адрес и модель хранятся только на устройстве.</p><div className="mt-4 rounded-2xl border border-bx-border bg-bx-bg p-3 text-xs text-bx-muted"><strong className="text-bx-text">Важно:</strong> доступность Ollama зависит от вашего сервера и сети. Настройки соединения сохраняются без автоматической отправки данных.</div></section>
            </div>
          )}

          {activeTab === 'team' && <CompanyTeamPanel title="Моя команда и корпоративный доступ" />}

          {activeTab === 'data' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Object.entries({ 'Шаблоны': dataStats.templates, 'Контрагенты': dataStats.counterparties, 'Операции': dataStats.transactions, 'Сотрудники': dataStats.employees }).map(([label, value]) => <div key={label} className={`${card} p-4`}><p className="text-[10px] font-black uppercase tracking-wider text-bx-muted">{label}</p><p className="mt-2 font-mono text-2xl font-black">{value}</p></div>)}</div>
              <section className={card}><SettingRow icon="download" label="Создать резервную копию" desc={`Настройки, ЭЦП, локальные реквизиты, шаблоны и контрагенты. ${lastBackupAt ? `Последняя: ${new Date(lastBackupAt).toLocaleString('ru-RU')}` : 'Копия ещё не создавалась.'}`}><button type="button" onClick={handleBackupExport} className={`${button} bg-blue-600 text-white hover:bg-blue-700`}><span className="inline-flex items-center gap-2"><Icon name="download" className="h-4 w-4" />Экспорт JSON</span></button></SettingRow><SettingRow icon="folder" label="Восстановить из копии" desc="Файл сначала проверяется. Перед заменой справочников BX покажет состав копии и запросит подтверждение."><label className={`${button} inline-flex cursor-pointer items-center gap-2 border border-bx-border bg-bx-surface-2 hover:bg-bx-bg`}><Icon name="folder" className="h-4 w-4" />Выбрать файл<input type="file" accept="application/json,.json" onChange={handleBackupImport} className="sr-only" /></label></SettingRow><SettingRow icon="trash" label="Очистить операционный кэш" desc="Удаляет локальные операции и сотрудников с этого устройства. Справочники, настройки и облачные данные не затрагиваются."><button type="button" onClick={() => setConfirmAction('clear-cache')} className={`${button} bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400`}>Очистить кэш</button></SettingRow>{!!window.bx && <SettingRow icon="monitor" label="Автозапуск BX" desc="Запускать настольное приложение вместе с системой."><Toggle checked={autostartEnabled} onChange={() => handleToggleAutostart(!autostartEnabled)} label="Автозапуск BX" /></SettingRow>}</section>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <section className={`${card} p-5 xl:col-span-2`}><div className="flex items-start gap-4"><span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600"><Icon name="send" className="h-6 w-6" /></span><div><h3 className="text-base font-black">Telegram-помощник</h3><p className="mt-1 text-xs leading-relaxed text-bx-muted">Получайте напоминания и рабочие уведомления вне приложения.</p></div></div><div className="mt-5 rounded-2xl border border-bx-border bg-bx-bg p-4"><p className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Команда привязки</p><code className="mt-2 block break-all rounded-xl bg-bx-surface-2 px-3 py-3 text-xs text-bx-text">/start {userId || 'идентификатор появится после синхронизации'}</code></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!userId} onClick={() => openExternalUrl(`https://t.me/BX_Helper_Bot?start=${userId}`)} className={`${button} bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40`}><span className="inline-flex items-center gap-2"><Icon name="external" className="h-4 w-4" />Открыть бота</span></button><button type="button" disabled={!userId} onClick={() => { navigator.clipboard.writeText(`/start ${userId}`); toast.success('Команда скопирована') }} className={`${button} border border-bx-border bg-bx-surface-2 disabled:opacity-40`}><span className="inline-flex items-center gap-2"><Icon name="copy" className="h-4 w-4" />Копировать команду</span></button></div></section>
              <div className="space-y-4"><button type="button" onClick={() => { localStorage.setItem('bx_tools_last', 'eimzo'); navigate('/tools') }} className={`${card} w-full p-4 text-left transition-colors hover:border-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700"><Icon name="ecp" className="h-5 w-5" /></span><p className="mt-3 text-sm font-black">E-Imzo и ЭЦП</p><p className="mt-1 text-xs leading-relaxed text-bx-muted">Открыть диагностику плагина и локального сервиса.</p></button><button type="button" onClick={() => { localStorage.setItem('bx_tools_last', 'cache'); navigate('/tools') }} className={`${card} w-full p-4 text-left transition-colors hover:border-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><Icon name="tools" className="h-5 w-5" /></span><p className="mt-3 text-sm font-black">Инструменты 1С</p><p className="mt-1 text-xs leading-relaxed text-bx-muted">Кэш, резервные копии и зависшие процессы.</p></button></div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-5">
              <section className={`${card} overflow-hidden`}><div className="border-b border-bx-border bg-gradient-to-r from-blue-600/[0.12] to-transparent p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Текущий план</p><h3 className="mt-1 text-2xl font-black">{plan === 'premium' ? 'Premium' : plan === 'standard' ? 'Standard' : 'Free'}</h3><p className="mt-1 text-xs text-bx-muted">{isTrial && trialDaysLeft > 0 ? `Пробный период: осталось ${trialDaysLeft} дн.${planExpiresAt ? ` · до ${new Date(planExpiresAt).toLocaleDateString('ru-RU')}` : ''}` : isPro ? 'Профессиональный доступ активен' : 'Базовый доступ с ограничениями'}</p></div><div className="flex rounded-xl border border-bx-border bg-bx-bg p-1">{(['month', 'year'] as const).map(value => <button key={value} type="button" onClick={() => setBillingPeriod(value)} className={`${button} ${billingPeriod === value ? 'bg-blue-600 text-white' : 'text-bx-muted hover:bg-bx-surface-2'}`}>{value === 'month' ? 'Месяц' : 'Год −17%'}</button>)}</div></div></div><div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">{[{ name: 'Free', price: '0 сум', desc: 'Базовые инструменты' }, { name: 'Standard', price: billingPeriod === 'year' ? '990 000 / год' : '99 000 / мес', desc: 'Для ежедневной работы' }, { name: 'Premium', price: billingPeriod === 'year' ? '1 990 000 / год' : '199 000 / мес', desc: 'Команда и максимум возможностей' }].map(item => <div key={item.name} className={`rounded-2xl border p-4 ${item.name.toLowerCase() === plan ? 'border-blue-600 bg-blue-500/[0.06]' : 'border-bx-border bg-bx-bg'}`}><p className="text-sm font-black">{item.name}</p><p className="mt-2 text-lg font-black text-blue-600 dark:text-blue-400">{item.price}</p><p className="mt-1 text-xs text-bx-muted">{item.desc}</p></div>)}</div></section>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><section className={`${card} p-5`}><h3 className="text-sm font-black">Оплата</h3><div className="mt-4 flex rounded-xl border border-bx-border bg-bx-bg p-1"><button type="button" onClick={() => setPayMethod('card')} className={`${button} flex-1 ${payMethod === 'card' ? 'bg-blue-600 text-white' : 'text-bx-muted'}`}>Payme / Click</button><button type="button" onClick={() => setPayMethod('invoice')} className={`${button} flex-1 ${payMethod === 'invoice' ? 'bg-blue-600 text-white' : 'text-bx-muted'}`}>Счёт юрлицу</button></div>{payMethod === 'card' ? <p className="mt-4 rounded-2xl border border-dashed border-bx-border bg-bx-bg p-5 text-center text-xs leading-relaxed text-bx-muted">Онлайн-оплата будет активирована после подключения платёжного провайдера. Сейчас используйте счёт для юридического лица.</p> : <button type="button" onClick={handleGenerateInvoice} className={`${button} mt-4 w-full bg-blue-600 text-white hover:bg-blue-700`}><span className="inline-flex items-center gap-2"><Icon name="receipt" className="h-4 w-4" />Открыть счёт на оплату</span></button>}</section><section className={`${card} p-5`}><h3 className="text-sm font-black">Промокод</h3><p className="mt-1 text-xs text-bx-muted">Срок активации добавится к текущему тарифу.</p><div className="mt-4 flex gap-2"><input value={promoCode} onChange={event => setPromoCode(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === 'Enter') handleRedeemPromo() }} placeholder="WELCOME30" aria-label="Промокод" className={input} /><button type="button" onClick={handleRedeemPromo} disabled={promoLoading || !promoCode.trim()} className={`${button} bg-blue-600 text-white disabled:opacity-40`}>{promoLoading ? 'Проверяю…' : 'Активировать'}</button></div>{referralCode && <div className="mt-5 border-t border-bx-border pt-4"><p className="text-xs font-black">Пригласить коллегу</p><div className="mt-2 flex gap-2"><input readOnly value={`https://bx.uz/?ref=${referralCode}`} onFocus={event => event.currentTarget.select()} aria-label="Реферальная ссылка" className={input} /><button type="button" onClick={() => { navigator.clipboard.writeText(`https://bx.uz/?ref=${referralCode}`); toast.success('Ссылка скопирована') }} className={`${button} border border-bx-border bg-bx-surface-2`}><Icon name="copy" className="h-4 w-4" /></button></div></div>}</section></div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]"><section className={`${card} p-6`}><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">BX</span><h3 className="mt-5 text-xl font-black">Помощник бухгалтера Республики Узбекистан</h3><p className="mt-3 max-w-2xl text-sm leading-relaxed text-bx-muted">BX объединяет планирование, документы, расчёты, знания и ИИ в одном спокойном рабочем контуре. Цель — убирать рутину, не прятать важные действия и оставлять контроль за специалистом.</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-bx-bg p-4"><p className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Версия</p><p className="mt-1 font-mono text-sm font-black">{APP_VERSION}</p></div><div className="rounded-2xl bg-bx-bg p-4"><p className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Год</p><p className="mt-1 text-sm font-black">2026</p></div></div></section><section className={`${card} h-fit p-5`}><h3 className="text-sm font-black">Нужна помощь?</h3><p className="mt-2 text-xs leading-relaxed text-bx-muted">Опишите проблему в разделе поддержки или напишите технической команде.</p><button type="button" onClick={() => navigate('/support')} className={`${button} mt-4 w-full bg-blue-600 text-white`}><span className="inline-flex items-center gap-2"><Icon name="headset" className="h-4 w-4" />Открыть поддержку</span></button><button type="button" onClick={() => openExternalUrl('https://t.me/tech_support_bx')} className={`${button} mt-2 w-full border border-bx-border bg-bx-surface-2`}><span className="inline-flex items-center gap-2"><Icon name="send" className="h-4 w-4" />Telegram поддержки</span></button><p className="mt-4 text-center font-mono text-xs font-bold text-bx-muted">+998 90 916 04 44</p></section></div>
          )}
        </div>
      </main>

      {backupSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="backup-title">
          <div className="w-full max-w-lg rounded-3xl border border-bx-border bg-bx-surface p-6 shadow-2xl"><div className="flex items-start gap-3"><span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600"><Icon name="save" className="h-5 w-5" /></span><div><h3 id="backup-title" className="text-lg font-black">Проверка резервной копии</h3><p className="mt-1 text-xs leading-relaxed text-bx-muted">BX заменит локальные шаблоны и контрагентов данными из выбранного файла.</p></div></div><div className="mt-5 grid grid-cols-2 gap-3">{Object.entries({ 'Версия BX': backupSummary.version, 'Ключи ЭЦП': backupSummary.ecpKeys, 'Реквизиты': backupSummary.requisites, 'Шаблоны': backupSummary.templates, 'Контрагенты': backupSummary.counterparties }).map(([label, value]) => <div key={label} className="rounded-xl bg-bx-bg p-3"><p className="text-[10px] font-bold text-bx-muted">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>)}</div><p className="mt-4 text-[11px] text-bx-muted">Создана: {new Date(backupSummary.createdAt).toLocaleString('ru-RU')}</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setPendingImport(null)} className={`${button} border border-bx-border bg-bx-surface-2`}>Отмена</button><button type="button" onClick={confirmBackupImport} className={`${button} bg-blue-600 text-white`}>Восстановить данные</button></div></div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="w-full max-w-md rounded-3xl border border-bx-border bg-bx-surface p-6 shadow-2xl"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600"><Icon name="alert" className="h-5 w-5" /></span><h3 id="confirm-title" className="mt-4 text-lg font-black">{confirmAction === 'reset-pin' ? 'Сбросить PIN?' : confirmAction === 'clear-cache' ? 'Очистить локальный кэш?' : 'Выйти из аккаунта?'}</h3><p className="mt-2 text-xs leading-relaxed text-bx-muted">{confirmAction === 'reset-pin' ? 'Текущий PIN будет удалён. Новый код потребуется создать при следующем запуске.' : confirmAction === 'clear-cache' ? 'Локальные операции и сотрудники будут удалены с этого устройства. Перед действием рекомендуется создать резервную копию.' : 'Локальная сессия и PIN будут удалены с этого компьютера.'}</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmAction(null)} className={`${button} border border-bx-border bg-bx-surface-2`}>Отмена</button><button type="button" onClick={runConfirmedAction} className={`${button} bg-red-600 text-white hover:bg-red-700`}>Подтвердить</button></div></div></div>
      )}
    </div>
  )
}

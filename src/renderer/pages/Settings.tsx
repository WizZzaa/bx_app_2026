import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/db/supabase'
import { clearPin, isPinEnabled, setPinEnabled } from '../lib/auth/pin'
import { APP_VERSION } from '../../shared/version'
import { db } from '../lib/db/localDb'
import { usePlan } from '../lib/plan'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'

const THEME_KEY = 'bx_theme'
const NOTIFY_KEY = 'bx_notify_days'
const IDLE_LOCK_KEY = 'bx_idle_lock'

type NotifyDays = '1' | '3' | '7' | 'off'
type IdleLock = 'off' | '5' | '10' | '30' | '60'
type TabType = 'billing' | 'security' | 'appearance' | 'ai' | 'team' | 'data'

export default function Settings() {
  const { plan, isPro } = usePlan()
  const { active: activeCompany } = useCompany()
  const toast = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabType>('billing')
  const [userEmail, setUserEmail] = useState('')
  const [notifyDays, setNotifyDays] = useState<NotifyDays>('3')
  const [signingOut, setSigningOut] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showHoroscope, setShowHoroscope] = useState(false)
  const [payMethod, setPayMethod] = useState<'card' | 'invoice'>('card')
  const [autostartEnabled, setAutostartEnabled] = useState(false)
  const [idleLock, setIdleLock] = useState<IdleLock>('off')
  const [pinEnabled, setPinEnabledState] = useState(true)

  // Состояния для вкладки Команда
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [incomingInvites, setIncomingInvites] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor')
  const [inviting, setInviting] = useState(false)
  const [loadingTeam, setLoadingTeam] = useState(false)

  // Загрузка участников команды и входящих приглашений
  const loadTeamData = async () => {
    if (!userEmail) return
    setLoadingTeam(true)
    try {
      // 1. Входящие приглашения
      const { data: inc, error: incErr } = await supabase
        .from('bx_organization_members')
        .select('id, invited_email, role, status, organization_id, bx_companies(name)')
        .eq('invited_email', userEmail.trim().toLowerCase())
        .eq('status', 'pending')
      if (!incErr && inc) {
        setIncomingInvites(inc)
      }

      // 2. Участники команды для активной компании
      if (activeCompany?.id) {
        const { data: mems, error: memsErr } = await supabase
          .from('bx_organization_members')
          .select('id, invited_email, role, status, user_id')
          .eq('organization_id', activeCompany.id)
        if (!memsErr && mems) {
          setTeamMembers(mems)
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки данных команды:', e)
    } finally {
      setLoadingTeam(false)
    }
  }

  // Приглашение нового сотрудника
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCompany?.id) {
      toast.error('Сначала создайте или выберите компанию')
      return
    }
    const emailToInvite = inviteEmail.trim().toLowerCase()
    if (!emailToInvite) return

    setInviting(true)
    try {
      const { error } = await supabase.from('bx_organization_members').insert({
        organization_id: activeCompany.id,
        invited_email: emailToInvite,
        role: inviteRole,
        status: 'pending',
      })

      if (error) {
        toast.error(`Ошибка приглашения: ${error.message}`)
      } else {
        toast.success('Приглашение успешно отправлено!')
        setInviteEmail('')
        loadTeamData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка сети')
    } finally {
      setInviting(false)
    }
  }

  // Удаление участника или отмена приглашения
  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from('bx_organization_members').delete().eq('id', memberId)
      if (error) {
        toast.error(`Не удалось удалить: ${error.message}`)
      } else {
        toast.info('Участник удален из команды')
        loadTeamData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка удаления')
    }
  }

  // Принятие входящего приглашения
  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('bx_organization_members')
        .update({
          status: 'active',
          user_id: user.id
        })
        .eq('id', inviteId)

      if (error) {
        toast.error(`Не удалось принять: ${error.message}`)
      } else {
        toast.success('Приглашение принято!')
        // Перезапускаем страницу для обновления списка компаний
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка выполнения запроса')
    }
  }

  // Отклонение входящего приглашения
  const handleRejectInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase.from('bx_organization_members').delete().eq('id', inviteId)
      if (error) {
        toast.error(`Не удалось отклонить: ${error.message}`)
      } else {
        toast.info('Приглашение отклонено')
        loadTeamData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка')
    }
  }

  const handleToggleAutostart = async (val: boolean) => {
    setAutostartEnabled(val)
    if ((window as any).bx?.autostart?.set) {
      await (window as any).bx.autostart.set(val)
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
    })
    const saved = localStorage.getItem(NOTIFY_KEY) as NotifyDays
    if (saved) setNotifyDays(saved)

    const savedIdle = localStorage.getItem(IDLE_LOCK_KEY) as IdleLock
    if (savedIdle) setIdleLock(savedIdle)
    setPinEnabledState(isPinEnabled())

    const savedTheme = localStorage.getItem(THEME_KEY) as 'dark' | 'light'
    if (savedTheme) setTheme(savedTheme)

    if ((window as any).bx?.autostart?.get) {
      (window as any).bx.autostart.get().then(setAutostartEnabled)
    }

    try {
      const stored = localStorage.getItem('bx_dashboard_widgets')
      if (stored) {
        setShowHoroscope(!!JSON.parse(stored).horoscope)
      }
    } catch { /* битый кэш виджетов — игнорируем */ }
  }, [])

  // Перезагрузка команды при получении email и переключении вкладок
  useEffect(() => {
    if (activeTab === 'team' && userEmail) {
      loadTeamData()
    }
  }, [activeTab, userEmail, activeCompany?.id])

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
    if (t === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
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

  function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between px-4 py-3 gap-4 border-b border-bx-border/60 last:border-0">
        <div>
          <p className="text-sm text-bx-text">{label}</p>
          {desc && <p className="text-xs text-bx-muted mt-0.5">{desc}</p>}
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-bx-bg">
      {/* Боковая панель вкладок */}
      <aside className="w-60 border-r border-bx-border/40 bg-bx-surface/30 flex flex-col p-4 space-y-1.5 flex-shrink-0">
        <div className="px-3.5 py-3 mb-2 flex-shrink-0">
          <h1 className="text-sm font-bold text-bx-text">Настройки</h1>
          <p className="text-[10px] text-bx-muted mt-0.5">BX Assistant v{APP_VERSION}</p>
        </div>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'billing'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
              : 'text-bx-muted hover:text-bx-text hover:bg-bx-surface-2'
          }`}
        >
          <span>💳</span> Тариф и Оплата
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
              : 'text-bx-muted hover:text-bx-text hover:bg-bx-surface-2'
          }`}
        >
          <span>👤</span> Безопасность и Вход
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'appearance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
              : 'text-bx-muted hover:text-bx-text hover:bg-bx-surface-2'
          }`}
        >
          <span>🎨</span> Оформление и Срок
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ai'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
              : 'text-bx-muted hover:text-bx-text hover:bg-bx-surface-2'
          }`}
        >
          <span>🤖</span> Настройки ИИ
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'team'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
              : 'text-bx-muted hover:text-bx-text hover:bg-bx-surface-2'
          }`}
        >
          <span>👥</span> Моя команда
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'data'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
              : 'text-bx-muted hover:text-bx-text hover:bg-bx-surface-2'
          }`}
        >
          <span>⚙️</span> Система и Данные
        </button>
      </aside>

      {/* Основная контентная область */}
      <main className="flex-1 overflow-y-auto p-8 bg-bx-bg/40">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Вкладка: Тариф и Оплата */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-bx-text">Тариф и Оплата</h2>
              
              <div className={`rounded-xl border p-4 ${
                plan === 'premium'
                  ? 'bg-gradient-to-br from-purple-600/15 to-transparent border-purple-500/30'
                  : plan === 'standard'
                    ? 'bg-gradient-to-br from-emerald-600/15 to-transparent border-emerald-500/30'
                    : 'bg-gradient-to-br from-blue-600/15 to-transparent border-blue-500/30'
              }`}>
                <p className="text-sm font-semibold text-bx-text">
                  Ваш текущий тариф: <span className="capitalize">{plan === 'premium' ? 'Premium' : plan === 'standard' ? 'Standard' : 'Free'}</span>
                </p>
                <p className="text-xs text-bx-muted mt-1 leading-relaxed">
                  {plan === 'premium' 
                    ? 'Максимальные возможности, корпоративный доступ без лимитов и поддержка 24/7' 
                    : plan === 'standard' 
                      ? 'Оптимальный пакет для полноценной бухгалтерской работы' 
                      : 'Тариф Free имеет ограничения. Активируйте PRO-пакет для комфортной работы.'}
                </p>
              </div>

              {/* Лимиты */}
              <div className="bg-bx-surface rounded-xl border border-bx-border/60 overflow-hidden text-[11px]">
                <div className="grid grid-cols-4 bg-bx-surface-2 px-4 py-2.5 font-bold text-bx-text border-b border-bx-border/40">
                  <span>Функционал</span>
                  <span className="text-center text-bx-muted">Free</span>
                  <span className="text-center text-emerald-400">Standard</span>
                  <span className="text-center text-purple-400">Premium</span>
                </div>
                {[
                  ['Стоимость', '0 сум', '99k / мес', '199k / мес'],
                  ['Компании / Доски', '1 / 1', 'до 3 / до 5', 'Безлимит'],
                  ['AI-запросы (в мес)', '10', '150', 'Безлимит'],
                  ['Очеловечивание (в мес)', '—', '50', 'Безлимит'],
                  ['Управление долгами', 'просмотр', 'до 20 зап.', 'Безлимит'],
                  ['Подпись ЭЦП (в мес)', '—', 'до 5', 'Безлимит'],
                  ['Чистка & Бэкап 1С', '✓', 'ручной', 'автомат'],
                  ['Техподдержка', '—', 'чат', 'AnyDesk'],
                ].map(([f, a, b, c], i) => (
                  <div key={f} className={`grid grid-cols-4 px-4 py-2 border-t border-bx-border/20 text-bx-muted ${i % 2 === 0 ? 'bg-bx-surface/20' : ''}`}>
                    <span className="font-medium text-bx-text/80">{f}</span>
                    <span className="text-center">{a}</span>
                    <span className="text-center text-emerald-500/90">{b}</span>
                    <span className="text-center text-purple-500/90 font-medium">{c}</span>
                  </div>
                ))}
              </div>

              {/* Способы оплаты */}
              {!isPro && (
                <div className="bg-bx-surface border border-bx-border rounded-2xl p-4 space-y-4">
                  <h3 className="text-xs font-bold text-bx-text uppercase tracking-wider">💳 Способы оплаты подписки</h3>
                  
                  <div className="flex gap-2 p-0.5 bg-bx-bg border border-bx-border rounded-xl">
                    <button onClick={() => setPayMethod('card')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${payMethod === 'card' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
                      Карты (Payme / Click)
                    </button>
                    <button onClick={() => setPayMethod('invoice')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${payMethod === 'invoice' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
                      Счёт (для юрлиц)
                    </button>
                  </div>

                  {payMethod === 'card' ? (
                    <div className="text-center space-y-3">
                      <p className="text-xs text-bx-muted leading-relaxed">
                        Отсканируйте QR-код в приложении Click или Payme для активации PRO-тарифа.
                      </p>
                      <div className="flex justify-center gap-6 py-2">
                        <div className="bg-bx-bg/40 p-4 rounded-xl border border-bx-border flex flex-col items-center shadow-lg transition-all hover:border-bx-border-2">
                          <div className="w-24 h-24 bg-bx-surface-2 flex flex-col items-center justify-center border border-dashed border-bx-border rounded-lg text-bx-muted text-xs gap-1">
                            <span>QR Code</span>
                          </div>
                          <span className="text-xs font-bold mt-2 text-blue-400">Payme</span>
                        </div>
                        <div className="bg-bx-bg/40 p-4 rounded-xl border border-bx-border flex flex-col items-center shadow-lg transition-all hover:border-bx-border-2">
                          <div className="w-24 h-24 bg-bx-surface-2 flex flex-col items-center justify-center border border-dashed border-bx-border rounded-lg text-bx-muted text-xs gap-1">
                            <span>QR Code</span>
                          </div>
                          <span className="text-xs font-bold mt-2 text-sky-400">Click</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-bx-muted leading-relaxed">
                        Для оплаты безналичным расчетом скачайте счет-договор на оплату Standard/Premium:
                      </p>
                      <button onClick={handleGenerateInvoice}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md">
                        📄 Скачать счёт на оплату (PDF)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Вкладка: Безопасность и Вход */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-bx-text">Безопасность и Вход</h2>
              
              <div className="bg-bx-surface rounded-xl border border-bx-border overflow-hidden">
                <SettingRow label="Email аккаунта" desc="Используется для синхронизации в облаке">
                  <span className="text-sm font-medium text-bx-muted">{userEmail || '—'}</span>
                </SettingRow>

                <SettingRow label="Защита PIN-кодом" desc="Спрашивать PIN при запуске и выходе из спящего режима">
                  <button
                    onClick={() => togglePinEnabled(!pinEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors font-semibold ${
                      pinEnabled ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'
                    }`}
                  >
                    {pinEnabled ? 'Включена' : 'Выключена'}
                  </button>
                </SettingRow>

                {pinEnabled && (
                  <>
                    <SettingRow label="Сбросить PIN-код" desc="Сбросить текущий код. Попросит ввести новый при запуске">
                      <button onClick={resetPin}
                        className="text-xs px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-border-2 text-bx-text rounded-lg transition-colors">
                        Сбросить PIN
                      </button>
                    </SettingRow>

                    <SettingRow label="Автоблокировка экрана" desc="Блокировать интерфейс при бездействии">
                      <div className="flex gap-1">
                        {(['off', '5', '10', '30', '60'] as IdleLock[]).map(v => (
                          <button
                            key={v}
                            onClick={() => saveIdleLock(v)}
                            className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                              idleLock === v ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'
                            }`}
                          >
                            {v === 'off' ? 'Выкл.' : v === '60' ? '1ч' : `${v}м`}
                          </button>
                        ))}
                      </div>
                    </SettingRow>
                  </>
                )}

                <SettingRow label="Выход из системы" desc="Удалить сессию авторизации на этом ПК">
                  <button
                    onClick={signOut}
                    disabled={signingOut}
                    className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors font-semibold disabled:opacity-50"
                  >
                    {signingOut ? 'Выход...' : 'Выйти'}
                  </button>
                </SettingRow>
              </div>
            </div>
          )}

          {/* Вкладка: Оформление и Срок */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-bx-text">Оформление и Срок</h2>
              
              <div className="bg-bx-surface rounded-xl border border-bx-border overflow-hidden">
                <SettingRow label="Тема оформления" desc="Внешний вид рабочих окон приложения">
                  <div className="flex gap-1.5">
                    {(['dark', 'light'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => saveTheme(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          theme === t ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'
                        }`}
                      >
                        {t === 'dark' ? 'Темная' : 'Светлая'}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Бухо-гороскоп" desc="Шуточный прогноз на Bento Grid рабочего стола">
                  <button
                    onClick={() => toggleHoroscope(!showHoroscope)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      showHoroscope ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'
                    }`}
                  >
                    {showHoroscope ? 'Показывать' : 'Скрывать'}
                  </button>
                </SettingRow>

                <SettingRow label="Напоминания о дедлайнах" desc="За сколько дней напоминать об отчетах и налогах">
                  <div className="flex gap-1">
                    {(['off', '1', '3', '7'] as NotifyDays[]).map(v => (
                      <button
                        key={v}
                        onClick={() => saveNotify(v)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                          notifyDays === v ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'
                        }`}
                      >
                        {v === 'off' ? 'Выкл.' : `${v} дн.`}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </div>
            </div>
          )}

          {/* Вкладка: Настройки ИИ */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-bx-text">Настройки ИИ-консультанта</h2>
              
              <div className="bg-bx-surface rounded-xl border border-bx-border overflow-hidden">
                <SettingRow label="Режим ИИ" desc="Выбор между облачным API и локальным решением">
                  <div className="flex gap-1.5">
                    {(['gemini', 'ollama'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => {
                          localStorage.setItem('bx_ai_provider', v)
                          window.dispatchEvent(new Event('storage'))
                          window.location.reload()
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          (localStorage.getItem('bx_ai_provider') || 'gemini') === v 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'
                        }`}
                      >
                        {v === 'gemini' ? 'Облако (Gemini)' : 'Локально (Ollama)'}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                {(localStorage.getItem('bx_ai_provider') || 'gemini') === 'ollama' && (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 gap-4 border-b border-bx-border/60">
                      <div>
                        <p className="text-sm text-bx-text">Адрес хоста Ollama</p>
                        <p className="text-xs text-bx-muted mt-0.5">Локальный сетевой адрес API Ollama</p>
                      </div>
                      <input 
                        type="text" 
                        defaultValue={localStorage.getItem('bx_ollama_host') || 'http://localhost:11434'}
                        onBlur={e => localStorage.setItem('bx_ollama_host', e.target.value)}
                        placeholder="http://localhost:11434"
                        className="bg-bx-bg text-bx-text text-xs px-2.5 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none w-48 text-right font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 gap-4 border-b border-bx-border/60">
                      <div>
                        <p className="text-sm text-bx-text">Локальная модель</p>
                        <p className="text-xs text-bx-muted mt-0.5">Название скачанной модели Ollama</p>
                      </div>
                      <input 
                        type="text" 
                        defaultValue={localStorage.getItem('bx_ollama_model') || 'deepseek-r1:1.5b'}
                        onBlur={e => localStorage.setItem('bx_ollama_model', e.target.value)}
                        placeholder="deepseek-r1:1.5b"
                        className="bg-bx-bg text-bx-text text-xs px-2.5 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none w-48 text-right font-mono"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Вкладка: Моя команда */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-bx-text">Моя команда и корпоративный доступ</h2>

              {/* Входящие приглашения */}
              {incomingInvites.length > 0 && (
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📨</span> Входящие приглашения
                  </h3>
                  <div className="space-y-2">
                    {incomingInvites.map((invite) => {
                      const compName = invite.bx_companies?.name ?? 'Неизвестная компания'
                      const roleName = invite.role === 'admin' ? 'Администратор' : invite.role === 'editor' ? 'Помощник' : 'Наблюдатель'
                      return (
                        <div key={invite.id} className="flex items-center justify-between bg-bx-surface/60 border border-bx-border/30 rounded-xl p-3">
                          <div>
                            <p className="text-xs text-bx-text font-bold">{compName}</p>
                            <p className="text-[10px] text-bx-muted mt-0.5">Ваша будущая роль: {roleName}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptInvite(invite.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Принять
                            </button>
                            <button
                              onClick={() => handleRejectInvite(invite.id)}
                              className="px-3 py-1 bg-bx-surface-2 hover:bg-bx-border-2 text-bx-text rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Отклонить
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Состав команды выбранной организации */}
              {!activeCompany ? (
                <div className="bg-bx-surface border border-bx-border rounded-xl p-6 text-center text-bx-muted text-xs">
                  Пожалуйста, выберите или создайте компанию в шапке приложения, чтобы управлять её командой.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Отправка приглашения */}
                  <form onSubmit={handleSendInvite} className="bg-bx-surface border border-bx-border rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-bx-text uppercase tracking-wider">➕ Пригласить сотрудника</h3>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="Email нового участника"
                        className="flex-1 bg-bx-bg text-bx-text text-xs px-3 py-2 rounded-xl border border-bx-border focus:outline-none placeholder:text-bx-muted focus:border-blue-500/50"
                      />
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as any)}
                        className="bg-bx-bg text-bx-text text-xs px-3 py-2 rounded-xl border border-bx-border focus:outline-none"
                      >
                        <option value="editor">Помощник (Editor)</option>
                        <option value="admin">Администратор (Admin)</option>
                        <option value="viewer">Директор (Viewer)</option>
                      </select>
                      <button
                        type="submit"
                        disabled={inviting || !inviteEmail.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        {inviting ? 'Отправка...' : 'Пригласить'}
                      </button>
                    </div>
                  </form>

                  {/* Список текущих членов организации */}
                  <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-bx-border flex justify-between items-center">
                      <h3 className="text-xs font-bold text-bx-text uppercase tracking-wider">
                        Сотрудники компании: <span className="text-blue-400 font-semibold">{activeCompany.name}</span>
                      </h3>
                      {loadingTeam && <span className="text-[10px] text-bx-muted">Загрузка...</span>}
                    </div>

                    <div className="divide-y divide-bx-border">
                      {teamMembers.map((m) => (
                        <div key={m.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-bx-bg/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-bx-surface-2 flex items-center justify-center font-bold text-xs text-blue-400">
                              {m.invited_email.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs text-bx-text font-bold">{m.invited_email}</p>
                              <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                m.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {m.status === 'active' ? 'активен' : 'ожидает принятия'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-bx-bg border border-bx-border text-bx-muted capitalize">
                              {m.role === 'admin' ? 'Администратор' : m.role === 'editor' ? 'Помощник' : m.role === 'owner' ? 'Владелец' : 'Наблюдатель'}
                            </span>
                            
                            {m.role !== 'owner' && (
                              <button
                                onClick={() => handleDeleteMember(m.id)}
                                className="text-xs text-bx-muted hover:text-red-400 px-2 py-1 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Удалить из команды"
                              >
                                Удалить
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {teamMembers.length === 0 && !loadingTeam && (
                        <p className="text-center py-8 text-bx-muted text-xs">В команде пока нет сотрудников</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Вкладка: Система и Данные */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-bx-text">Система и Данные</h2>
              
              <div className="bg-bx-surface rounded-xl border border-bx-border overflow-hidden">
                <SettingRow label="Локальный кэш приложения" desc="Очистить закэшированные транзакции и данные о сотрудниках">
                  <button
                    onClick={() => {
                      const keys = Object.keys(localStorage).filter(k => k.startsWith('bx_cache_') || k.startsWith('bx_transactions_') || k.startsWith('bx_employees_'))
                      keys.forEach(k => localStorage.removeItem(k))
                      db.transactions.clear()
                      db.employees.clear()
                      toast.success('Локальный кэш IndexedDB успешно очищен!')
                    }}
                    className="text-xs px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-border-2 text-bx-text rounded-lg transition-colors"
                  >
                    Очистить кэш
                  </button>
                </SettingRow>

                {!!(window as any).bx && (
                  <SettingRow label="Автозапуск BX" desc="Запускать приложение при включении компьютера">
                    <button
                      onClick={() => handleToggleAutostart(!autostartEnabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        autostartEnabled ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'
                      }`}
                    >
                      {autostartEnabled ? 'Включено' : 'Выключено'}
                    </button>
                  </SettingRow>
                )}

                <SettingRow label="Связь с облаком" desc="Статус синхронизации базы данных">
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-bold">Подключено</span>
                </SettingRow>
              </div>

              {/* О программе */}
              <div className="bg-bx-surface rounded-xl border border-bx-border p-5 space-y-3.5">
                <h3 className="text-xs font-bold text-bx-text uppercase tracking-wider">О программе</h3>
                <div className="text-xs text-bx-muted space-y-1">
                  <p>Продукт: <span className="text-bx-text font-semibold">BX — Помощник Бухгалтера Республики Узбекистан</span></p>
                  <p>Версия сборки: <span className="text-bx-text font-semibold">v{APP_VERSION}</span></p>
                  <p>Разработка: <span className="text-bx-text font-semibold">2026 г.</span></p>
                  <p className="pt-1">Поддержка по телефону: <span className="text-bx-text font-mono font-bold">+998 90 916 04 44</span></p>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      const url = 'https://t.me/tech_support_bx';
                      if ((window as any).bx?.openExternal) {
                        (window as any).bx.openExternal(url);
                      } else {
                        window.open(url, '_blank');
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
                  >
                    Сообщить о технической проблеме в Telegram (@tech_support_bx) ↗
                  </button>
                </div>
                <div className="bg-bx-surface-2/40 border border-bx-border/40 rounded-xl p-3.5 text-[11px] text-bx-muted leading-relaxed">
                  🚀 <strong className="text-bx-text">Манифест BX:</strong> Мы чертовски устали смотреть на то, как мучают бухгалтеров бесконечной рутиной и сложными порталами! Наша команда разработчиков решила взять всё в свои руки и создать инструмент, который выводит ежедневную поддержку бухов на абсолютно новый, нативный уровень. Чтобы вы работали без боли и мучений, а мы с кайфом развивали продукт и зарабатывали на этом! 😉
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

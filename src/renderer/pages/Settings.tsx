import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/db/supabase'
import { clearPin } from '../lib/auth/pin'
import { APP_VERSION } from '../../shared/version'
import { db } from '../lib/db/localDb'
import { usePlan, PLAN_LIMITS } from '../lib/plan'

const THEME_KEY = 'bx_theme'
const NOTIFY_KEY = 'bx_notify_days'
const IDLE_LOCK_KEY = 'bx_idle_lock'

type NotifyDays = '1' | '3' | '7' | 'off'
type IdleLock = 'off' | '5' | '10' | '30' | '60'

export default function Settings() {
  const { plan, isPro } = usePlan()
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState('')
  const [notifyDays, setNotifyDays] = useState<NotifyDays>('3')
  const [signingOut, setSigningOut] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showHoroscope, setShowHoroscope] = useState(false)
  const [payMethod, setPayMethod] = useState<'card' | 'invoice'>('card')
  const [autostartEnabled, setAutostartEnabled] = useState(false)
  const [idleLock, setIdleLock] = useState<IdleLock>('off')

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
      if (data.user?.email) setUserEmail(data.user.email)
    })
    const saved = localStorage.getItem(NOTIFY_KEY) as NotifyDays
    if (saved) setNotifyDays(saved)

    const savedIdle = localStorage.getItem(IDLE_LOCK_KEY) as IdleLock
    if (savedIdle) setIdleLock(savedIdle)

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
    } catch {}
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
    setTheme(t);
    localStorage.setItem(THEME_KEY, t);
    if (t === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }

  function toggleHoroscope(visible: boolean) {
    setShowHoroscope(visible);
    try {
      const stored = localStorage.getItem('bx_dashboard_widgets');
      const parsed = stored ? JSON.parse(stored) : { weather: true, currency: true, notifications: true, horoscope: false };
      parsed.horoscope = visible;
      localStorage.setItem('bx_dashboard_widgets', JSON.stringify(parsed));
    } catch {}
  }

  async function signOut() {
    setSigningOut(true);
    clearPin();
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function resetPin() {
    clearPin();
    window.location.reload();
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</h2>
        <div className="bg-bx-surface rounded-xl border border-bx-border overflow-hidden divide-y divide-bx-border">
          {children}
        </div>
      </div>
    );
  }

  function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        <div>
          <p className="text-sm text-slate-200">{label}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Настройки</h1>
          <p className="text-sm text-slate-500 mt-0.5">BX Помощник Бухгалтера v{APP_VERSION}</p>
        </div>

        {/* Тариф */}
        <Section title="Тариф и оплата">
          <div className={`rounded-xl border px-4 py-3 mb-3 ${isPro
            ? 'bg-gradient-to-br from-emerald-600/15 to-transparent border-emerald-500/30'
            : 'bg-gradient-to-br from-blue-600/15 to-transparent border-blue-500/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Ваш план: {isPro ? 'Pro' : 'Free'}
                  <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${isPro ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {isPro ? 'активен' : 'бесплатный'}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPro ? 'Спасибо, что поддерживаете BX!' : 'Pro открывает мультикомпанию, безлимитный AI и контроль оплат'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-bx-border overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-bx-surface px-4 py-2 font-semibold text-slate-300">
              <span>Возможность</span><span className="text-center">Free</span><span className="text-center text-blue-400">Pro</span>
            </div>
            {[
              ['Справочники, БЗ, калькуляторы, шаблоны', '✓', '✓ + свои шаблоны'],
              ['Компании', String(PLAN_LIMITS.free.companies), 'безлимит'],
              ['Доски Планировщика', String(PLAN_LIMITS.free.boards), 'безлимит'],
              ['AI-Консультант, вопросов/мес', String(PLAN_LIMITS.free.aiPerMonth), 'безлимит'],
              ['Контроль оплат', '—', '✓'],
              ['Живой специалист', '—', '✓'],
            ].map(([f, a, b]) => (
              <div key={f} className="grid grid-cols-3 px-4 py-2 border-t border-bx-border/60 text-slate-400">
                <span>{f}</span><span className="text-center text-slate-500">{a}</span><span className="text-center text-slate-200">{b}</span>
              </div>
            ))}
          </div>
          {!isPro && (
            <div className="mt-4 p-4 bg-bx-surface border border-bx-border-2 rounded-xl space-y-4">
              <h3 className="text-xs font-semibold text-bx-text">💳 Активация тарифа PRO</h3>
              
              {/* Вкладки выбора метода */}
              <div className="flex gap-2 p-0.5 bg-bx-bg border border-bx-border rounded-lg">
                <button onClick={() => setPayMethod('card')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${payMethod === 'card' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  Payme / Click
                </button>
                <button onClick={() => setPayMethod('invoice')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${payMethod === 'invoice' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  Счёт (юрлица)
                </button>
              </div>

              {payMethod === 'card' ? (
                <div className="space-y-3 text-center">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Отсканируйте QR-код в приложении Payme или Click для мгновенной оплаты подписки.
                  </p>
                  <div className="flex justify-center gap-4 py-2">
                    <div className="bg-bx-surface-2 p-3 rounded-xl border border-bx-border flex flex-col items-center shadow-lg transition-all hover:border-bx-border-2">
                      <div className="w-24 h-24 bg-bx-bg/50 flex flex-col items-center justify-center border border-dashed border-bx-border rounded-lg text-bx-muted text-xs gap-1">
                        <svg className="w-8 h-8 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-2.25zM3.75 14.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-2.25zM14.625 3.75a1.125 1.125 0 0 0-1.125 1.125v2.25c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125v-2.25a1.125 1.125 0 0 0-1.125-1.125h-2.25z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.625 14.625h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-1.5a1.5 1.5 0 0 1-1.5-1.5v-1.5a1.5 1.5 0 0 1 1.5-1.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h.008v.008H9.75V9.75zM9.75 14.25h.008v.008H9.75V14.25zM14.25 9.75h.008v.008H14.25V9.75z" />
                        </svg>
                        <span className="text-[9px] opacity-75">QR-код</span>
                      </div>
                      <span className="text-[10px] font-bold mt-2 text-blue-400">Payme</span>
                    </div>
                    <div className="bg-bx-surface-2 p-3 rounded-xl border border-bx-border flex flex-col items-center shadow-lg transition-all hover:border-bx-border-2">
                      <div className="w-24 h-24 bg-bx-bg/50 flex flex-col items-center justify-center border border-dashed border-bx-border rounded-lg text-bx-muted text-xs gap-1">
                        <svg className="w-8 h-8 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-2.25zM3.75 14.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-2.25zM14.625 3.75a1.125 1.125 0 0 0-1.125 1.125v2.25c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125v-2.25a1.125 1.125 0 0 0-1.125-1.125h-2.25z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.625 14.625h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-1.5a1.5 1.5 0 0 1-1.5-1.5v-1.5a1.5 1.5 0 0 1 1.5-1.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h.008v.008H9.75V9.75zM9.75 14.25h.008v.008H9.75V14.25zM14.25 9.75h.008v.008H14.25V9.75z" />
                        </svg>
                        <span className="text-[9px] opacity-75">QR-код</span>
                      </div>
                      <span className="text-[10px] font-bold mt-2 text-sky-400">Click</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    После оплаты тариф активируется автоматически. Если возникли вопросы, напишите в <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/support')}>поддержку</span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Для оплаты безналичным расчетом (перечислением) скачайте счет на оплату или используйте наши реквизиты.
                  </p>
                  <div className="bg-bx-bg rounded-lg border border-bx-border p-3 text-[10px] space-y-1.5 font-mono text-slate-400">
                    <p><strong className="text-slate-300">Получатель:</strong> ООО «BX SOFTWARE»</p>
                    <p><strong className="text-slate-300">ИНН:</strong> 309876543</p>
                    <p><strong className="text-slate-300">Р/с:</strong> 20208000900123456001</p>
                    <p><strong className="text-slate-300">Банк:</strong> АКБ «Капиталбанк», г. Ташкент</p>
                    <p><strong className="text-slate-300">МФО:</strong> 00440</p>
                  </div>
                  <button onClick={handleGenerateInvoice}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    📄 Скачать счёт на оплату (PDF)
                  </button>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Аккаунт */}
        <Section title="Аккаунт">
          <SettingRow label="Email" desc="Supabase аккаунт">
            <span className="text-sm text-slate-400">{userEmail || '—'}</span>
          </SettingRow>
          <SettingRow label="PIN-код" desc="Используется для быстрой разблокировки на этом ПК">
            <button
              onClick={resetPin}
              className="text-xs px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-border-2 text-slate-300 rounded-lg transition-colors"
            >
              Сбросить PIN
            </button>
          </SettingRow>
          <SettingRow label="Автоблокировка экрана" desc="Блокировка PIN-кодом при бездействии (опционально)">
            <div className="flex gap-1.5">
              {(['off', '5', '10', '30', '60'] as IdleLock[]).map(v => (
                <button
                  key={v}
                  onClick={() => saveIdleLock(v)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${idleLock === v ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-slate-400 hover:text-slate-200'}`}
                >
                  {v === 'off' ? 'Выкл.' : v === '60' ? '1 час' : `${v} мин`}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Выход из аккаунта" desc="Потребуется повторный вход по email">
            <button
              onClick={signOut}
              disabled={signingOut}
              className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
            >
              {signingOut ? 'Выход...' : 'Выйти'}
            </button>
          </SettingRow>
        </Section>

        {/* Внешний вид */}
        <Section title="Внешний вид и оформление">
          <SettingRow label="Тема интерфейса" desc="Светлая или темная тема оформления">
            <div className="flex gap-1.5">
              {(['dark', 'light'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => saveTheme(t)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors font-medium ${theme === t ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-slate-400 hover:text-slate-200'}`}
                >
                  {t === 'dark' ? 'Темная' : 'Светлая'}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Бухо-гороскоп" desc="Показывать шуточный гороскоп на рабочем столе">
            <button
              onClick={() => toggleHoroscope(!showHoroscope)}
              className={`px-3 py-1.5 rounded text-xs transition-colors font-medium ${showHoroscope ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-slate-400 hover:text-slate-200'}`}
            >
              {showHoroscope ? 'Показывать' : 'Скрывать'}
            </button>
          </SettingRow>
        </Section>

        {/* Уведомления */}
        <Section title="Уведомления о дедлайнах">
          <SettingRow label="Напоминать заранее" desc="За сколько дней до срока показывать предупреждение">
            <div className="flex gap-1.5">
              {(['off', '1', '3', '7'] as NotifyDays[]).map(v => (
                <button
                  key={v}
                  onClick={() => saveNotify(v)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${notifyDays === v ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-slate-400 hover:text-slate-200'}`}
                >
                  {v === 'off' ? 'Выкл.' : `${v} дн.`}
                </button>
              ))}
            </div>
          </SettingRow>
        </Section>

        {/* Настройки ИИ */}
        <Section title="Настройки ИИ-консультанта">
          <SettingRow label="Провайдер ИИ" desc="Использовать облачный Gemini или локальный Ollama">
            <div className="flex gap-1.5">
              {(['gemini', 'ollama'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => {
                    localStorage.setItem('bx_ai_provider', v)
                    window.dispatchEvent(new Event('storage')) // Триггерим обновление в других вкладках
                    window.location.reload() // Перезагрузка для применения
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    (localStorage.getItem('bx_ai_provider') || 'gemini') === v 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-bx-surface-2 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v === 'gemini' ? 'Облако (Gemini)' : 'Локально (Ollama)'}
                </button>
              ))}
            </div>
          </SettingRow>
          {(localStorage.getItem('bx_ai_provider') || 'gemini') === 'ollama' && (
            <>
              <SettingRow label="Хост Ollama" desc="Адрес запущенного локального API Ollama">
                <input 
                  type="text" 
                  defaultValue={localStorage.getItem('bx_ollama_host') || 'http://localhost:11434'}
                  onBlur={e => localStorage.setItem('bx_ollama_host', e.target.value)}
                  placeholder="http://localhost:11434"
                  className="bg-bx-bg text-slate-200 text-xs px-2 py-1 rounded border border-bx-border-2 focus:outline-none w-44"
                />
              </SettingRow>
              <SettingRow label="Модель Ollama" desc="Название локально скачанной LLM">
                <input 
                  type="text" 
                  defaultValue={localStorage.getItem('bx_ollama_model') || 'deepseek-r1:1.5b'}
                  onBlur={e => localStorage.setItem('bx_ollama_model', e.target.value)}
                  placeholder="deepseek-r1:1.5b"
                  className="bg-bx-bg text-slate-200 text-xs px-2 py-1 rounded border border-bx-border-2 focus:outline-none w-44"
                />
              </SettingRow>
            </>
          )}
        </Section>

        {/* Данные */}
        <Section title="Данные и конфиденциальность">
          <SettingRow label="Облачное хранилище" desc="Задачи и компании хранятся в Supabase (EU)">
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Активно</span>
          </SettingRow>
          <SettingRow label="Локальный кэш" desc="Справочники кешируются для офлайн-работы">
            <button
              onClick={() => {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('bx_cache_') || k.startsWith('bx_transactions_') || k.startsWith('bx_employees_'))
                keys.forEach(k => localStorage.removeItem(k))
                db.transactions.clear()
                db.employees.clear()
                alert(`Очищен локальный кэш и база данных в браузере`)
              }}
              className="text-xs px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-border-2 text-slate-300 rounded-lg transition-colors"
            >
              Очистить кэш
            </button>
          </SettingRow>
        </Section>

        {/* Системные настройки (только в Electron) */}
        {!!(window as any).bx && (
          <Section title="Системные настройки">
            <SettingRow label="Запускать при старте системы" desc="Автоматический запуск приложения при включении компьютера">
              <button
                onClick={() => handleToggleAutostart(!autostartEnabled)}
                className={`px-3 py-1.5 rounded text-xs transition-colors font-medium ${autostartEnabled ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-slate-400 hover:text-slate-200'}`}
              >
                {autostartEnabled ? 'Включено' : 'Выключено'}
              </button>
            </SettingRow>
            <SettingRow label="Сворачивать при закрытии" desc="При нажатии на крестик приложение сворачивается в трей и продолжает работать">
              <span className="text-xs text-slate-500 font-medium bg-bx-surface-2 px-2.5 py-1 rounded">Активно</span>
            </SettingRow>
          </Section>
        )}

        {/* О программе */}
        <Section title="О программе">
          <SettingRow label="Версия" desc="BX — Помощник Бухгалтера">
            <span className="text-sm text-slate-400">v{APP_VERSION}</span>
          </SettingRow>
          <SettingRow label="Разработка" desc="Для бухгалтеров Узбекистана">
            <span className="text-sm text-slate-500">2026</span>
          </SettingRow>
          <div className="px-4 py-3">
            <button
              onClick={() => window.open('https://soliq.uz', '_blank')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Сообщить о проблеме ↗
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

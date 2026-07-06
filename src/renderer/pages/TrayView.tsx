import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/db/supabase'
import { usePlan } from '../lib/plan'
import { useToast } from '../lib/ui/ToastContext'

interface CurrencyRate {
  code: string
  title: string
  cb_price: string
  nbu_buy_price?: string
  nbu_cell_price?: string
  date: string
}

interface Deadline {
  id: string
  title: string
  date: string
  type: string
}

export default function TrayView() {
  const { isPro } = usePlan()
  const [activeTab, setActiveTab] = useState<'widgets' | 'vat' | 'support'>('widgets')
  const [rates, setRates] = useState<CurrencyRate[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [deadlinesLoading, setDeadlinesLoading] = useState(false)

  // VAT States
  const [vatSum, setVatSum] = useState('')
  const [vatType, setVatType] = useState<'extra' | 'extract'>('extra') // начислить / выделить
  const [vatResult, setVatResult] = useState({ vat: 0, total: 0, net: 0 })

  // Support States
  const [supportText, setSupportText] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)

  // Закрепление окна на экране (не прятать по потере фокуса)
  const [pinned, setPinned] = useState(false)
  const togglePin = () => {
    const next = !pinned
    setPinned(next)
    ;(window as any).bx?.tray?.setPinned(next)
  }

  // Load Exchange Rates & Deadlines
  useEffect(() => {
    const loadRates = async () => {
      setRatesLoading(true)
      try {
        const bridge = (window as any).bx?.widgets?.getRates
        if (bridge) {
          const list = await bridge(['USD', 'EUR', 'RUB'])
          setRates(list)
        } else {
          // Fallback для веба (CORS-безопасный запрос к открытым API или мок)
          const res = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/')
          if (res.ok) {
            const data = await res.json()
            const filtered = data.filter((r: any) => ['USD', 'EUR', 'RUB'].includes(r.code))
            setRates(filtered.map((r: any) => ({
              code: r.code,
              title: r.CcyNm_RU,
              cb_price: r.Rate,
              date: r.Date
            })))
          }
        }
      } catch (err) {
        console.error('Failed to load rates in tray:', err)
      } finally {
        setRatesLoading(false)
      }
    }

    const loadDeadlines = async () => {
      setDeadlinesLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const today = new Date().toISOString().split('T')[0]
        const { data } = await supabase
          .from('bx_events')
          .select('id, title, date, type')
          .eq('user_id', user.id)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(4)

        if (data) setDeadlines(data)
      } catch (err) {
        console.error('Failed to load deadlines in tray:', err)
      } finally {
        setDeadlinesLoading(false)
      }
    }

    loadRates()
    loadDeadlines()
  }, [])

  // Calculate VAT on input change
  useEffect(() => {
    const num = parseFloat(vatSum.replace(/\s/g, '')) || 0
    if (vatType === 'extra') {
      const vat = Math.round(num * 0.12 * 100) / 100
      setVatResult({
        vat,
        total: num + vat,
        net: num
      })
    } else {
      const net = Math.round((num / 1.12) * 100) / 100
      setVatResult({
        vat: num - net,
        total: num,
        net
      })
    }
  }, [vatSum, vatType])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} скопировано в буфер!`)
  }

  const handleCreateSupportTicket = async () => {
    if (!supportText.trim() || supportSending) return
    setSupportSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Пожалуйста, авторизуйтесь в приложении')
        return
      }

      // Создаем тикет
      const { data: ticket, error: tErr } = await supabase
        .from('bx_tickets')
        .insert({
          user_id: user.id,
          subject: 'Срочный вызов из Трей-агента',
          status: 'open',
          category: 'emergency'
        })
        .select()
        .single()

      if (tErr || !ticket) throw tErr

      // Отправляем первое сообщение
      const { error: mErr } = await supabase
        .from('bx_ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          message: supportText.trim()
        })

      if (mErr) throw mErr

      setTicketCreated(true)
      setSupportText('')
    } catch (err) {
      console.error('Support emergency failed:', err)
      alert('Не удалось отправить тикет. Проверьте соединение.')
    } finally {
      setSupportSending(false)
    }
  }

  return (
    <div className="w-screen h-screen bg-bx-surface border border-bx-border-2 flex flex-col overflow-hidden text-bx-text select-none">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600/10 via-bx-surface-2 to-transparent border-b border-bx-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-bx-text">BX Агент</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePin}
            title={pinned ? 'Открепить (прятать при клике вне окна)' : 'Закрепить на экране'}
            aria-label={pinned ? 'Открепить окно' : 'Закрепить окно'}
            className={`w-6 h-6 flex items-center justify-center rounded-md border transition-colors ${pinned ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-bx-bg border-bx-border text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-3.5 h-3.5" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 4l-1 6 4 3v2H7v-2l4-3-1-6M12 15v5" />
            </svg>
          </button>
          <span className="text-[10px] text-slate-500 bg-bx-bg px-2 py-0.5 rounded border border-bx-border">
            {isPro ? 'Тариф Pro' : 'Тариф Free'}
          </span>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'widgets' && (
          <>
            {/* Rates widget */}
            <div className="bg-bx-bg border border-bx-border rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Курсы валют ЦБ РУз</span>
                {ratesLoading && <span className="text-[9px] text-slate-600 animate-pulse">обновление...</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {rates.map(r => (
                  <div key={r.code} className="bg-bx-surface border border-bx-border-2 rounded-lg p-2 text-center relative group hover:border-blue-500/50 transition-colors">
                    <p className="text-[10px] text-slate-400 font-medium">{r.code}</p>
                    <p className="text-sm font-bold text-bx-text mt-0.5">{parseFloat(r.cb_price).toLocaleString('ru-RU')} сум</p>
                  </div>
                ))}
                {rates.length === 0 && !ratesLoading && (
                  <p className="col-span-3 text-[10px] text-slate-500 text-center py-2">Курсы временно недоступны</p>
                )}
              </div>
            </div>

            {/* Deadlines widget */}
            <div className="bg-bx-bg border border-bx-border rounded-xl p-3.5 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Ближайшие дедлайны</span>
              <div className="space-y-2">
                {deadlines.map(d => {
                  const days = Math.ceil((new Date(d.date).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
                  return (
                    <div key={d.id} className="flex items-center justify-between text-xs bg-bx-surface border border-bx-border-2 rounded-lg p-2 hover:border-slate-700/50 transition-colors">
                      <div className="truncate pr-2">
                        <p className="font-medium text-slate-200 truncate">{d.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(d.date).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${days <= 3 ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {days === 0 ? 'Сегодня' : days < 0 ? 'Просрочено' : `${days} дн.`}
                      </span>
                    </div>
                  )
                })}
                {deadlines.length === 0 && (
                  <p className="text-[10px] text-slate-500 text-center py-2">Нет ближайших дедлайнов</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'vat' && (
          <div className="bg-bx-bg border border-bx-border rounded-xl p-4 space-y-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Калькулятор НДС 12%</span>
            
            <div className="space-y-3">
              {/* Type Switcher */}
              <div className="flex gap-2 p-0.5 bg-bx-surface border border-bx-border rounded-lg">
                <button onClick={() => setVatType('extra')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${vatType === 'extra' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-400'}`}>
                  Начислить (+12%)
                </button>
                <button onClick={() => setVatType('extract')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${vatType === 'extract' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-400'}`}>
                  Выделить (12% в т.ч.)
                </button>
              </div>

              {/* Input */}
              <div>
                <label className="text-[10px] text-slate-400">Сумма в сумах</label>
                <input
                  type="text"
                  value={vatSum}
                  onChange={e => setVatSum(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Введите сумму"
                  className="w-full bg-bx-surface text-bx-text text-sm px-3 py-2 rounded-lg border border-bx-border focus:outline-none focus:border-blue-500/50 mt-1"
                />
              </div>

              {/* Results */}
              <div className="border-t border-bx-border pt-3 space-y-2 text-xs">
                <div className="flex justify-between items-center bg-bx-surface/40 p-2 rounded border border-bx-border-2">
                  <span className="text-slate-400">Без НДС:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-200">{vatResult.net.toLocaleString('ru-RU')}</span>
                    <button onClick={() => copyToClipboard(vatResult.net.toString(), 'Сумма без НДС')} className="text-[10px] text-blue-400 hover:text-blue-300">📋</button>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-bx-surface/40 p-2 rounded border border-bx-border-2">
                  <span className="text-slate-400">НДС (12%):</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-blue-400">{vatResult.vat.toLocaleString('ru-RU')}</span>
                    <button onClick={() => copyToClipboard(vatResult.vat.toString(), 'Сумма НДС')} className="text-[10px] text-blue-400 hover:text-blue-300">📋</button>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-bx-surface/40 p-2 rounded border border-bx-border-2">
                  <span className="text-slate-400">Всего с НДС:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-emerald-400">{vatResult.total.toLocaleString('ru-RU')}</span>
                    <button onClick={() => copyToClipboard(vatResult.total.toString(), 'Итоговая сумма')} className="text-[10px] text-blue-400 hover:text-blue-300">📋</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-bx-bg border border-bx-border rounded-xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">🚨 Экстренный вызов инженера</span>
            
            {ticketCreated ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-2xl">⚡</p>
                <p className="text-xs font-semibold text-emerald-400">Запрос отправлен!</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Инженер техподдержки уже уведомлен и свяжется с вами. Откройте чат в главном приложении для диалога.
                </p>
                <button onClick={() => setTicketCreated(false)}
                  className="text-xs text-blue-400 hover:underline mt-2">
                  Создать еще один запрос
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Опишите техническую проблему (сбой 1С, E-Imzo, Windows, принтер, сеть) для срочного создания тикета поддержки.
                </p>
                <textarea
                  value={supportText}
                  onChange={e => setSupportText(e.target.value)}
                  placeholder="Например: Не открывается база 1С после обновления, пишет ошибку блокировки данных..."
                  rows={4}
                  className="w-full bg-bx-surface text-bx-text text-xs px-3 py-2 rounded-lg border border-bx-border focus:outline-none focus:border-blue-500/50 resize-none"
                />
                <button
                  onClick={handleCreateSupportTicket}
                  disabled={!supportText.trim() || supportSending}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {supportSending ? 'Отправка...' : 'Отправить запрос поддержки'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs / Footer */}
      <div className="flex-shrink-0 bg-bx-surface-2 border-t border-bx-border flex divide-x divide-bx-border">
        {(['widgets', 'vat', 'support'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${activeTab === t ? 'text-blue-400 bg-bx-surface' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t === 'widgets' ? 'Виджеты' : t === 'vat' ? 'НДС 12%' : 'Техпомощь'}
          </button>
        ))}
      </div>
    </div>
  )
}

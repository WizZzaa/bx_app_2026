import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/db/supabase'
import { usePlan } from '../lib/plan'
import type { CurrencyRate } from '../../shared/types'

interface Deadline {
  id: string
  title: string
  date: string
  type: string
}

type Tab = 'overview' | 'tools' | 'support'

const openApp = (route: string) => {
  ;(window as any).bx?.tray?.openApp?.(route)
}

// Быстрые действия — открывают раздел в главном окне
const QUICK: { label: string; icon: string; route: string; hue: string }[] = [
  { label: 'Планировщик', icon: '📅', route: '/planner', hue: 'from-blue-500/25 to-blue-600/10 text-blue-300 border-blue-500/30' },
  { label: 'Калькуляторы', icon: '🧮', route: '/calc', hue: 'from-emerald-500/25 to-emerald-600/10 text-emerald-300 border-emerald-500/30' },
  { label: 'ИИ-консультант', icon: '🤖', route: '/ai', hue: 'from-violet-500/25 to-violet-600/10 text-violet-300 border-violet-500/30' },
  { label: 'Проверка ИНН', icon: '🔎', route: '/tools', hue: 'from-amber-500/25 to-amber-600/10 text-amber-300 border-amber-500/30' },
]

export default function TrayView() {
  const { isPro } = usePlan()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [rates, setRates] = useState<CurrencyRate[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // VAT
  const [vatSum, setVatSum] = useState('')
  const [vatType, setVatType] = useState<'extra' | 'extract'>('extra')
  const [vatResult, setVatResult] = useState({ vat: 0, total: 0, net: 0 })

  // Конвертер валют
  const [convAmount, setConvAmount] = useState('')
  const [convCode, setConvCode] = useState('USD')
  const [convDir, setConvDir] = useState<'toUZS' | 'fromUZS'>('toUZS')

  // Пин
  const [pinned, setPinned] = useState(false)
  const togglePin = () => {
    const next = !pinned
    setPinned(next)
    ;(window as any).bx?.tray?.setPinned(next)
  }

  // Support
  const [supportText, setSupportText] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)

  useEffect(() => {
    const loadRates = async () => {
      setRatesLoading(true)
      try {
        const bridge = (window as any).bx?.widgets?.getRates
        if (bridge) {
          const list = await bridge(['USD', 'EUR', 'RUB'])
          setRates(list || [])
        }
      } catch (err) {
        console.error('Failed to load rates in tray:', err)
      } finally {
        setRatesLoading(false)
      }
    }

    const loadDeadlines = async () => {
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
          .limit(5)
        if (data) setDeadlines(data)
      } catch (err) {
        console.error('Failed to load deadlines in tray:', err)
      }
    }

    loadRates()
    loadDeadlines()
  }, [])

  useEffect(() => {
    const num = parseFloat(vatSum.replace(/\s/g, '')) || 0
    if (vatType === 'extra') {
      const vat = Math.round(num * 0.12 * 100) / 100
      setVatResult({ vat, total: num + vat, net: num })
    } else {
      const net = Math.round((num / 1.12) * 100) / 100
      setVatResult({ vat: Math.round((num - net) * 100) / 100, total: num, net })
    }
  }, [vatSum, vatType])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 1400)
  }

  const handleCreateSupportTicket = async () => {
    if (!supportText.trim() || supportSending) return
    setSupportSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSupportSending(false); return }
      const { data: ticket, error: tErr } = await supabase
        .from('bx_tickets')
        .insert({ user_id: user.id, subject: 'Срочный вызов из Трей-агента', status: 'open', category: 'emergency' })
        .select().single()
      if (tErr || !ticket) throw tErr
      await supabase.from('bx_ticket_messages').insert({ ticket_id: ticket.id, sender_id: user.id, message: supportText.trim() })
      setTicketCreated(true)
      setSupportText('')
    } catch (err) {
      console.error('Support emergency failed:', err)
    } finally {
      setSupportSending(false)
    }
  }

  // Конвертер
  const convRate = rates.find(r => r.code === convCode)?.value || 0
  const convNum = parseFloat(convAmount.replace(/[^0-9.]/g, '')) || 0
  const convResult = convDir === 'toUZS' ? convNum * convRate : (convRate ? convNum / convRate : 0)

  const fmt = (n: number, max = 2) => n.toLocaleString('ru-RU', { maximumFractionDigits: max })

  return (
    <div className="w-screen h-screen bg-bx-surface flex flex-col overflow-hidden text-bx-text select-none relative">
      {/* Фоновое свечение — оживляет тёмный фон */}
      <div className="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -left-16 w-48 h-48 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-40 h-40 rounded-full bg-emerald-600/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-white/5"
        style={{ background: 'linear-gradient(120deg, rgba(59,130,246,0.18), rgba(99,102,241,0.10) 45%, transparent)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-blue-600/30">BX</div>
          <div className="leading-tight">
            <h2 className="text-xs font-black tracking-wide text-white">BX Агент</h2>
            <p className="text-[9px] text-slate-400">Всегда под рукой</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={togglePin} title={pinned ? 'Открепить' : 'Закрепить на экране'}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${pinned ? 'bg-blue-600/25 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}>
            <svg className="w-3.5 h-3.5" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 4l-1 6 4 3v2H7v-2l4-3-1-6M12 15v5" />
            </svg>
          </button>
          <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${isPro ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
            {isPro ? '⭐ Pro' : 'Free'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {activeTab === 'overview' && (
          <>
            {/* Быстрые действия */}
            <div className="grid grid-cols-4 gap-2">
              {QUICK.map(q => (
                <button key={q.route} onClick={() => openApp(q.route)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl bg-gradient-to-b ${q.hue} border transition-transform active:scale-95 hover:brightness-125`}>
                  <span className="text-lg leading-none">{q.icon}</span>
                  <span className="text-[8.5px] font-semibold leading-tight text-center px-0.5">{q.label}</span>
                </button>
              ))}
            </div>

            {/* Курсы валют */}
            <div className="rounded-2xl p-3 border border-white/10 bg-white/[0.03]">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">💱 Курсы ЦБ РУз</span>
                {rates[0]?.date && <span className="text-[9px] text-slate-600">{rates[0].date}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {rates.map(r => (
                  <button key={r.code} onClick={() => copyToClipboard(String(r.value), r.code)}
                    className="rounded-xl p-2.5 text-center bg-gradient-to-b from-white/[0.06] to-transparent border border-white/10 hover:border-blue-500/40 transition-colors group">
                    <div className="text-base leading-none mb-1">{r.flag || '💱'}</div>
                    <p className="text-[10px] text-slate-400 font-semibold">{r.code}</p>
                    <p className="text-[13px] font-black text-white mt-0.5 leading-tight">{fmt(r.value, 1)}</p>
                    {typeof r.diff === 'number' && r.diff !== 0 && (
                      <p className={`text-[8.5px] font-bold mt-0.5 ${r.diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.diff > 0 ? '▲' : '▼'} {fmt(Math.abs(r.diff), 1)}
                      </p>
                    )}
                    <span className="block text-[7.5px] text-slate-600 group-hover:text-blue-400 transition-colors mt-0.5">копировать</span>
                  </button>
                ))}
                {rates.length === 0 && (
                  <p className="col-span-3 text-[10px] text-slate-500 text-center py-3">
                    {ratesLoading ? 'Загрузка курсов…' : 'Курсы недоступны'}
                  </p>
                )}
              </div>
            </div>

            {/* Дедлайны */}
            <div className="rounded-2xl p-3 border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">⏰ Ближайшие дедлайны</span>
                <button onClick={() => openApp('/planner')} className="text-[9px] text-blue-400 hover:text-blue-300 font-semibold">все →</button>
              </div>
              <div className="space-y-1.5">
                {deadlines.map(d => {
                  const days = Math.ceil((new Date(d.date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 bg-white/[0.04] border border-white/5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-100 truncate">{d.title}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{new Date(d.date).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-1 rounded-lg flex-shrink-0 font-bold ${days <= 3 ? 'bg-red-500/15 text-red-300' : days <= 7 ? 'bg-amber-500/15 text-amber-300' : 'bg-blue-500/15 text-blue-300'}`}>
                        {days === 0 ? 'Сегодня' : days < 0 ? 'Просрочено' : `${days} дн.`}
                      </span>
                    </div>
                  )
                })}
                {deadlines.length === 0 && <p className="text-[10px] text-slate-500 text-center py-2">Нет ближайших дедлайнов 🎉</p>}
              </div>
            </div>
          </>
        )}

        {activeTab === 'tools' && (
          <>
            {/* Конвертер валют */}
            <div className="rounded-2xl p-3.5 border border-white/10 bg-white/[0.03] space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">🔁 Конвертер валют</span>
              <div className="flex gap-1 p-0.5 bg-white/5 border border-white/10 rounded-lg">
                <button onClick={() => setConvDir('toUZS')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${convDir === 'toUZS' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Валюта → Сум</button>
                <button onClick={() => setConvDir('fromUZS')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${convDir === 'fromUZS' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Сум → Валюта</button>
              </div>
              <div className="flex gap-2">
                <input value={convAmount} onChange={e => setConvAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder={convDir === 'toUZS' ? 'Сумма в валюте' : 'Сумма в сумах'}
                  className="flex-1 min-w-0 bg-white/5 text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50" />
                <select value={convCode} onChange={e => setConvCode(e.target.value)}
                  className="bg-white/5 text-white text-xs px-2 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50">
                  {['USD', 'EUR', 'RUB'].map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-gradient-to-r from-emerald-600/15 to-transparent border border-emerald-500/25">
                <span className="text-[10px] text-slate-400">Результат</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-emerald-300">
                    {fmt(convResult, convDir === 'toUZS' ? 0 : 2)} {convDir === 'toUZS' ? 'сум' : convCode}
                  </span>
                  <button onClick={() => copyToClipboard(String(Math.round(convResult * 100) / 100), 'Результат')} className="text-[11px] text-slate-500 hover:text-emerald-300">📋</button>
                </div>
              </div>
              <p className="text-[9px] text-slate-600 text-center">1 {convCode} = {fmt(convRate, 1)} сум</p>
            </div>

            {/* НДС */}
            <div className="rounded-2xl p-3.5 border border-white/10 bg-white/[0.03] space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">🧾 Калькулятор НДС 12%</span>
              <div className="flex gap-1 p-0.5 bg-white/5 border border-white/10 rounded-lg">
                <button onClick={() => setVatType('extra')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${vatType === 'extra' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Начислить +12%</button>
                <button onClick={() => setVatType('extract')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${vatType === 'extract' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Выделить в т.ч.</button>
              </div>
              <input value={vatSum} onChange={e => setVatSum(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Сумма в сумах"
                className="w-full bg-white/5 text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50" />
              <div className="space-y-1.5 text-xs">
                {[
                  ['Без НДС', vatResult.net, 'text-slate-200'],
                  ['НДС 12%', vatResult.vat, 'text-blue-300'],
                  ['Всего с НДС', vatResult.total, 'text-emerald-300'],
                ].map(([label, val, cls]) => (
                  <div key={label as string} className="flex justify-between items-center rounded-lg px-2.5 py-1.5 bg-white/[0.04] border border-white/5">
                    <span className="text-slate-400 text-[11px]">{label as string}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black font-mono ${cls as string}`}>{fmt(val as number)}</span>
                      <button onClick={() => copyToClipboard(String(val), label as string)} className="text-[10px] text-slate-600 hover:text-blue-300">📋</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'support' && (
          <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.03] space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">🚨 Экстренный вызов инженера</span>
            {ticketCreated ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-3xl">⚡</p>
                <p className="text-xs font-bold text-emerald-300">Запрос отправлен!</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">Инженер уведомлён и свяжется с вами. Диалог — в разделе «Поддержка» приложения.</p>
                <button onClick={() => openApp('/support')} className="text-[11px] text-blue-400 hover:underline">Открыть чат поддержки →</button>
                <button onClick={() => setTicketCreated(false)} className="block mx-auto text-[10px] text-slate-500 hover:text-slate-300 mt-1">Создать ещё запрос</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 leading-relaxed">Опишите проблему (1С, E-Imzo, Windows, принтер, сеть) — создадим срочный тикет поддержки.</p>
                <textarea value={supportText} onChange={e => setSupportText(e.target.value)} rows={5}
                  placeholder="Например: не открывается база 1С после обновления…"
                  className="w-full bg-white/5 text-white text-xs px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50 resize-none" />
                <button onClick={handleCreateSupportTicket} disabled={!supportText.trim() || supportSending}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all active:scale-95">
                  {supportSending ? 'Отправка…' : 'Отправить запрос'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Copied toast */}
      {copied && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 text-[10px] font-semibold text-white bg-emerald-600/90 px-3 py-1.5 rounded-full shadow-lg bx-animate-fade">
          {copied} скопировано ✓
        </div>
      )}

      {/* Tabs */}
      <div className="relative flex-shrink-0 border-t border-white/10 bg-black/20 backdrop-blur flex p-1.5 gap-1">
        {([['overview', 'Обзор', '📊'], ['tools', 'Инструменты', '🧮'], ['support', 'Помощь', '🎧']] as const).map(([t, label, icon]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all ${activeTab === t ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <span className="text-sm leading-none">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

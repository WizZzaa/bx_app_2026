import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { supabase } from '../lib/db/supabase'
import { usePlan } from '../lib/plan'
import type { CurrencyRate } from '../../shared/types'
import { getHoroscope } from '../lib/horoscope'
import { buildNotices, type Notice, type NoticeLevel, type EcpKeyLite } from '../lib/notices'
import { loadEcpKeys } from '../lib/ecpStorage'
import { toWordsRu } from '../lib/numToWords'
import { todayISO } from '../lib/dates'

interface Deadline { id: string; title: string; date: string; type: string }
type Tab = 'overview' | 'alerts' | 'ai' | 'tools' | 'support'
interface ChatMsg { role: 'user' | 'assistant'; content: string }

const openApp = (route: string) => { (window as any).bx?.tray?.openApp?.(route) }
const DRAG = { WebkitAppRegion: 'drag' } as any
const NODRAG = { WebkitAppRegion: 'no-drag' } as any

const QUICK: { label: string; icon: string; route: string; hue: string }[] = [
  { label: 'Планировщик', icon: '📅', route: '/planner', hue: 'from-blue-500/25 to-blue-600/10 text-blue-300 border-blue-500/30' },
  { label: 'Калькуляторы', icon: '🧮', route: '/calc', hue: 'from-emerald-500/25 to-emerald-600/10 text-emerald-300 border-emerald-500/30' },
  { label: 'Утилиты', icon: '🛠', route: '/tools', hue: 'from-amber-500/25 to-amber-600/10 text-amber-300 border-amber-500/30' },
  { label: 'ЭЦП', icon: '🔏', route: '/ecp', hue: 'from-violet-500/25 to-violet-600/10 text-violet-300 border-violet-500/30' },
]

const noticeStyle: Record<NoticeLevel, { dot: string; chip: string; label: string }> = {
  critical: { dot: 'bg-red-400', chip: 'bg-red-500/15 text-red-300', label: 'Важно' },
  warning: { dot: 'bg-amber-400', chip: 'bg-amber-500/15 text-amber-300', label: 'Срок' },
  info: { dot: 'bg-blue-400', chip: 'bg-blue-500/15 text-blue-300', label: 'Инфо' },
}

const typeIcon: Record<string, string> = { task: '📝', reminder: '⏰', tax_deadline: '🏛', event: '📌' }
const fmtDay = (iso: string) => {
  if (iso === todayISO()) return 'сегодня'
  try { return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) } catch { return iso }
}

export default function TrayView() {
  const { isPro } = usePlan()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [rates, setRates] = useState<CurrencyRate[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)

  // Быстрое создание дела прямо из виджета
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [taskAdded, setTaskAdded] = useState(false)

  // Гороскоп
  const horo = useMemo(() => getHoroscope(), [])

  // Уведомления
  const [ecpKeys, setEcpKeys] = useState<EcpKeyLite[]>([])
  const notices: Notice[] = useMemo(() => buildNotices(ecpKeys), [ecpKeys])

  // ИИ
  const [aiInput, setAiInput] = useState('')
  const [aiMsgs, setAiMsgs] = useState<ChatMsg[]>([])
  const [aiSending, setAiSending] = useState(false)
  const aiEndRef = useRef<HTMLDivElement>(null)

  // Утилиты
  const [vatSum, setVatSum] = useState('')
  const [vatType, setVatType] = useState<'extra' | 'extract'>('extra')
  const [vatResult, setVatResult] = useState({ vat: 0, total: 0, net: 0 })
  const [convAmount, setConvAmount] = useState('')
  const [convCode, setConvCode] = useState('USD')
  const [convDir, setConvDir] = useState<'toUZS' | 'fromUZS'>('toUZS')
  const [wordsSum, setWordsSum] = useState('')

  // Помощь
  const [supportText, setSupportText] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)
  const [supportError, setSupportError] = useState('')

  const togglePin = () => { const n = !pinned; setPinned(n); (window as any).bx?.tray?.setPinned(n) }

  const reloadDeadlines = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('bx_events').select('id, title, date, type')
        .eq('user_id', user.id).gte('date', todayISO()).order('date', { ascending: true }).limit(8)
      if (data) setDeadlines(data)
    } catch (err) { console.error('deadlines:', err) }
  }, [])

  const addTask = async () => {
    const title = newTask.trim()
    if (!title || addingTask) return
    setAddingTask(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setAddingTask(false); return }
      const { error } = await supabase.from('bx_events').insert({
        user_id: user.id, company_id: null, type: 'task', title,
        date: todayISO(), due_date: null, status: 'todo', priority: 'normal',
        tags: null, tax_type: null, kind: null, regime: null, note: null,
        source: 'manual', reminder_at: null,
      })
      if (error) throw error
      setNewTask(''); setTaskAdded(true); setTimeout(() => setTaskAdded(false), 1600)
      await reloadDeadlines()
    } catch (err) { console.error('addTask:', err) } finally { setAddingTask(false) }
  }

  useEffect(() => {
    const loadRates = async () => {
      setRatesLoading(true)
      try {
        const bridge = (window as any).bx?.widgets?.getRates
        if (bridge) setRates((await bridge(['USD', 'EUR', 'RUB'])) || [])
      } catch (err) { console.error('rates:', err) } finally { setRatesLoading(false) }
    }
    loadRates(); reloadDeadlines()
    loadEcpKeys().then(setEcpKeys).catch(() => {})
  }, [reloadDeadlines])

  useEffect(() => {
    const num = parseFloat(vatSum.replace(/\s/g, '')) || 0
    if (vatType === 'extra') { const vat = Math.round(num * 0.12 * 100) / 100; setVatResult({ vat, total: num + vat, net: num }) }
    else { const net = Math.round((num / 1.12) * 100) / 100; setVatResult({ vat: Math.round((num - net) * 100) / 100, total: num, net }) }
  }, [vatSum, vatType])

  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMsgs, aiSending])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(null), 1400)
  }

  const sendAi = async () => {
    const q = aiInput.trim()
    if (!q || aiSending) return
    const next = [...aiMsgs, { role: 'user' as const, content: q }]
    setAiMsgs(next); setAiInput(''); setAiSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-consultant', {
        body: { messages: next.map(m => ({ role: m.role, content: m.content })), context: [] },
      })
      let answer = ''
      if (error) answer = 'Ошибка вызова ИИ: ' + error.message
      else if (data?.error) answer = data.error === 'LIMIT'
        ? (data.message || 'Лимит бесплатного плана исчерпан — перейдите на Pro.')
        : data.error === 'NO_API_KEY' ? 'ИИ не настроен администратором.' : ('Ошибка: ' + (data.message || data.error))
      else answer = (data?.text || '').trim() || 'Пустой ответ.'
      setAiMsgs(prev => [...prev, { role: 'assistant', content: answer }])
    } catch (e: any) {
      setAiMsgs(prev => [...prev, { role: 'assistant', content: 'Не удалось связаться с ИИ.' }])
    } finally { setAiSending(false) }
  }

  const handleCreateSupportTicket = async () => {
    if (!supportText.trim() || supportSending) return
    setSupportSending(true)
    setSupportError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSupportError('Сессия не найдена. Войдите в аккаунт заново.'); setSupportSending(false); return }
      const { data: ticket, error: tErr } = await supabase.from('bx_tickets')
        .insert({ user_id: user.id, subject: '🚨 Экстренный вызов инженера (из виджета)' })
        .select().single()
      if (tErr || !ticket) throw tErr || new Error('Тикет не создан')
      const { error: mErr } = await supabase.from('bx_ticket_messages')
        .insert({ ticket_id: ticket.id, user_id: user.id, author: 'user', body: supportText.trim() })
      if (mErr) throw mErr
      setTicketCreated(true); setSupportText('')
    } catch (err) {
      console.error('support:', err)
      setSupportError('Не удалось отправить запрос. Попробуйте ещё раз или из раздела «Поддержка».')
    } finally { setSupportSending(false) }
  }

  const convRate = rates.find(r => r.code === convCode)?.value || 0
  const convNum = parseFloat(convAmount.replace(/[^0-9.]/g, '')) || 0
  const convResult = convDir === 'toUZS' ? convNum * convRate : (convRate ? convNum / convRate : 0)
  const wordsNum = parseFloat(wordsSum.replace(/[^0-9.]/g, '')) || 0
  const fmt = (n: number, max = 2) => n.toLocaleString('ru-RU', { maximumFractionDigits: max })

  return (
    <div className="bx-tray-dark w-screen h-screen flex flex-col overflow-hidden text-slate-100 select-none relative"
      style={{ background: 'linear-gradient(165deg, #0f1629 0%, #131b31 55%, #0b1120 100%)' }}>
      <div className="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -left-16 w-48 h-48 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-40 h-40 rounded-full bg-emerald-600/10 blur-3xl" />

      {/* Header (drag handle слева) */}
      <div className="relative flex-shrink-0 px-2.5 py-2.5 flex items-center justify-between border-b border-white/5"
        style={{ background: 'linear-gradient(120deg, rgba(59,130,246,0.18), rgba(99,102,241,0.10) 45%, transparent)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Ручка перетаскивания */}
          <div title="Перетащите, чтобы переместить виджет" style={DRAG}
            className="flex items-center justify-center w-6 h-8 rounded-lg text-slate-500 hover:text-slate-300 cursor-move flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
          </div>
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-blue-600/30 flex-shrink-0">BX</div>
          <div className="leading-tight min-w-0">
            <h2 className="text-xs font-black tracking-wide text-white truncate">BX Агент</h2>
            <p className="text-[9px] text-slate-400 truncate">Всегда под рукой</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0" style={NODRAG}>
          <button onClick={togglePin} title={pinned ? 'Открепить' : 'Закрепить на экране'}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${pinned ? 'bg-blue-600/25 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}>
            <svg className="w-3.5 h-3.5" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 4l-1 6 4 3v2H7v-2l4-3-1-6M12 15v5" /></svg>
          </button>
          <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${isPro ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
            {isPro ? '⭐ Pro' : 'Free'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto p-3.5 space-y-3.5" style={NODRAG}>
        {activeTab === 'overview' && (
          <>
            {/* Бухо-гороскоп */}
            <button onClick={() => copyToClipboard(horo.mood, 'Гороскоп')}
              className="w-full text-left rounded-2xl p-3 border overflow-hidden relative"
              style={{ borderColor: horo.variant.border, background: horo.variant.bg }}>
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: horo.variant.accent }} />
                  <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: horo.variant.accentSoft }}>Бухо-гороскоп · {horo.variant.emoji} {horo.variant.label}</span>
                </div>
                <p className="text-[12px] font-semibold leading-snug" style={{ color: horo.variant.textMain }}>{horo.mood}</p>
                <p className="text-[10px] mt-1 leading-snug" style={{ color: horo.variant.textSub }}>{horo.advice}</p>
              </div>
            </button>

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

            {/* Курсы */}
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
                      <p className={`text-[8.5px] font-bold mt-0.5 ${r.diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{r.diff > 0 ? '▲' : '▼'} {fmt(Math.abs(r.diff), 1)}</p>
                    )}
                  </button>
                ))}
                {rates.length === 0 && <p className="col-span-3 text-[10px] text-slate-500 text-center py-3">{ratesLoading ? 'Загрузка…' : 'Курсы недоступны'}</p>}
              </div>
            </div>
          </>
        )}

        {activeTab === 'alerts' && (
          <>
            {/* Быстро добавить дело */}
            <div className="rounded-2xl p-3 border border-white/10 bg-white/[0.03] space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">➕ Новое дело</span>
              <div className="flex gap-2">
                <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTask() }}
                  placeholder="Что нужно сделать…" className="flex-1 min-w-0 bg-white/5 text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500/50" />
                <button onClick={addTask} disabled={!newTask.trim() || addingTask}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-40 text-white text-base font-bold rounded-xl transition-all active:scale-95 leading-none">+</button>
              </div>
              <p className="text-[9px] leading-snug">
                {taskAdded
                  ? <span className="text-emerald-400 font-semibold">✓ Дело добавлено на сегодня</span>
                  : <span className="text-slate-500">Добавится в Планировщик задачей на сегодня</span>}
              </p>
            </div>

            {/* Ближайшие дела */}
            <div className="rounded-2xl p-3 border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">🗓 Ближайшие дела</span>
                <span className="text-[9px] text-slate-500">{deadlines.length || '—'}</span>
              </div>
              {deadlines.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">Пока нет запланированных дел</p>
              ) : (
                <div className="space-y-1.5">
                  {deadlines.map(d => (
                    <button key={d.id} onClick={() => openApp('/planner')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-blue-500/30 text-left transition-colors">
                      <span className="text-sm flex-shrink-0">{typeIcon[d.type] || '📌'}</span>
                      <span className="flex-1 min-w-0 text-[12px] text-slate-100 leading-snug truncate">{d.title}</span>
                      <span className="text-[9px] text-slate-400 flex-shrink-0">{fmtDay(d.date)}</span>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => openApp('/planner')} className="w-full mt-2 text-[10px] text-blue-400 hover:text-blue-300 font-semibold">Открыть Планировщик →</button>
            </div>

            {/* Оповещения */}
            <div className="rounded-2xl p-3 border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">🔔 Оповещения</span>
                <span className="text-[9px] text-slate-500">{notices.length || 'нет новых'}</span>
              </div>
              {notices.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-1">✓</p>
                  <p className="text-xs text-slate-400 font-semibold">Всё спокойно</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Ни просрочек, ни горящих сроков</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {notices.map(n => {
                    const s = noticeStyle[n.level]
                    return (
                      <button key={n.id} onClick={() => openApp(n.to)}
                        className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-blue-500/30 text-left transition-colors">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] text-slate-100 leading-snug">{n.text}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${s.chip}`}>{s.label}</span>
                            <span className="text-[9px] text-slate-500">{n.time}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col h-full min-h-[280px]">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {aiMsgs.length === 0 && (
                <div className="text-center py-6 px-3">
                  <p className="text-3xl mb-1">🤖</p>
                  <p className="text-xs text-slate-300 font-semibold">ИИ-консультант</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Спросите про налоги, учёт, отчётность РУз. Быстрый ответ прямо в виджете.</p>
                </div>
              )}
              {aiMsgs.map((m, i) => (
                <div key={i} className={`max-w-[88%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
                  <div className={`rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/[0.06] border border-white/10 text-slate-100 rounded-tl-sm'}`}>{m.content}</div>
                </div>
              ))}
              {aiSending && <div className="text-[10px] text-slate-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" /> ИИ печатает…</div>}
              <div ref={aiEndRef} />
            </div>
            <div className="flex-shrink-0 flex gap-2 pt-2">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendAi() }}
                placeholder="Ваш вопрос…" className="flex-1 min-w-0 bg-white/5 text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500/50" />
              <button onClick={sendAi} disabled={!aiInput.trim() || aiSending}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all active:scale-95">→</button>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <>
            {/* Конвертер */}
            <div className="rounded-2xl p-3.5 border border-white/10 bg-white/[0.03] space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">🔁 Конвертер валют</span>
              <div className="flex gap-1 p-0.5 bg-white/5 border border-white/10 rounded-lg">
                <button onClick={() => setConvDir('toUZS')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${convDir === 'toUZS' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Валюта → Сум</button>
                <button onClick={() => setConvDir('fromUZS')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${convDir === 'fromUZS' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Сум → Валюта</button>
              </div>
              <div className="flex gap-2">
                <input value={convAmount} onChange={e => setConvAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={convDir === 'toUZS' ? 'Сумма в валюте' : 'Сумма в сумах'}
                  className="flex-1 min-w-0 bg-white/5 text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50" />
                <select value={convCode} onChange={e => setConvCode(e.target.value)} className="bg-white/5 text-white text-xs px-2 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50">
                  {['USD', 'EUR', 'RUB'].map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-gradient-to-r from-emerald-600/15 to-transparent border border-emerald-500/25">
                <span className="text-[10px] text-slate-400">Результат</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-emerald-300">{fmt(convResult, convDir === 'toUZS' ? 0 : 2)} {convDir === 'toUZS' ? 'сум' : convCode}</span>
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
                {([['Без НДС', vatResult.net, 'text-slate-200'], ['НДС 12%', vatResult.vat, 'text-blue-300'], ['Всего с НДС', vatResult.total, 'text-emerald-300']] as const).map(([label, val, cls]) => (
                  <div key={label} className="flex justify-between items-center rounded-lg px-2.5 py-1.5 bg-white/[0.04] border border-white/5">
                    <span className="text-slate-400 text-[11px]">{label}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black font-mono ${cls}`}>{fmt(val)}</span>
                      <button onClick={() => copyToClipboard(String(val), label)} className="text-[10px] text-slate-600 hover:text-blue-300">📋</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Число прописью (утилита) */}
            <div className="rounded-2xl p-3.5 border border-white/10 bg-white/[0.03] space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">🔤 Сумма прописью</span>
              <input value={wordsSum} onChange={e => setWordsSum(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Введите сумму"
                className="w-full bg-white/5 text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50" />
              {wordsNum > 0 && (
                <div className="rounded-xl px-3 py-2 bg-white/[0.04] border border-white/5 flex items-start justify-between gap-2">
                  <p className="text-[11px] text-slate-200 leading-snug flex-1">{toWordsRu(wordsNum, 'сум')}</p>
                  <button onClick={() => copyToClipboard(toWordsRu(wordsNum, 'сум'), 'Прописью')} className="text-[11px] text-slate-500 hover:text-blue-300 flex-shrink-0">📋</button>
                </div>
              )}
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
                <p className="text-[10px] text-slate-400 leading-relaxed">Инженер уведомлён. Диалог — в разделе «Поддержка».</p>
                <button onClick={() => openApp('/support')} className="text-[11px] text-blue-400 hover:underline">Открыть чат поддержки →</button>
                <button onClick={() => setTicketCreated(false)} className="block mx-auto text-[10px] text-slate-500 hover:text-slate-300 mt-1">Создать ещё запрос</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 leading-relaxed">Опишите проблему (1С, E-Imzo, Windows, принтер, сеть) — создадим срочный тикет.</p>
                <textarea value={supportText} onChange={e => setSupportText(e.target.value)} rows={5} placeholder="Например: не открывается база 1С…"
                  className="w-full bg-white/5 text-white text-xs px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50 resize-none" />
                <button onClick={handleCreateSupportTicket} disabled={!supportText.trim() || supportSending}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all active:scale-95">
                  {supportSending ? 'Отправка…' : 'Отправить запрос'}
                </button>
                {supportError && (
                  <p className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 leading-snug">{supportError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {copied && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 text-[10px] font-semibold text-white bg-emerald-600/90 px-3 py-1.5 rounded-full shadow-lg bx-animate-fade">{copied} скопировано ✓</div>
      )}

      {/* Tabs */}
      <div className="relative flex-shrink-0 border-t border-white/10 bg-black/20 backdrop-blur flex p-1.5 gap-0.5" style={NODRAG}>
        {([['overview', 'Обзор', '📊'], ['alerts', 'Дела', '🔔'], ['ai', 'ИИ', '🤖'], ['tools', 'Утилиты', '🛠'], ['support', 'Помощь', '🎧']] as const).map(([t, label, icon]) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[9px] font-bold transition-all relative ${activeTab === t ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <span className="text-sm leading-none">{icon}</span>
            {label}
            {t === 'alerts' && notices.length > 0 && <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
        ))}
      </div>
    </div>
  )
}

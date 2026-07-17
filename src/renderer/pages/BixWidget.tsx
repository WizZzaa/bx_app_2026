import { useCallback, useEffect, useMemo, useState } from 'react'
import '../styles/bix-widget.css'
import bixMascot from '../assets/mascot/bix-head-paws.png'
import { usePlan } from '../lib/plan'
import { createCanonicalEvent } from './planner/eventRepository'
import { todayISO } from '../lib/dates'
import { uid } from '../lib/uid'
import { supabase } from '../lib/db/supabase'
import { emitPlannerReload } from './planner/plannerBus'

type Panel = 'menu' | 'task' | 'note' | 'translator' | 'tools' | 'home' | null
type BxWidgetWindow = Window & { bx?: { tray?: { openApp?: (route?: string) => Promise<void> } } }
type BixState = { coins: number; needs: { food: number; mood: number; energy: number }; lastDailyClaim: string | null }
type BixReminder = { id: string; title: string; date: string; type: string }

const BIX_STATE_KEY = 'bx_bix_state_v1'
const QUICK_NOTES_KEY = 'bx_quick_notes'
const DAILY_COINS = { free: 0, standard: 5, premium: 15 } as const
const DEFAULT_BIX_STATE: BixState = { coins: 30, needs: { food: 72, mood: 86, energy: 91 }, lastDailyClaim: null }
const BIX_JOKES = [
  'Я не паникую. Я просто проверяю, где снова поменяли форму отчёта.',
  'Налоговая любит порядок. Я тоже — особенно когда дедлайн не сегодня.',
  'Если госсайт открылся с первого раза, можно смело загадывать желание.',
  'Моя суперсила — напомнить про задачу до того, как она станет срочной.',
  'Таблицы не кусаются. Но лучше всё равно сделать резервную копию.',
]

function loadBixState(): BixState {
  try {
    const saved = JSON.parse(localStorage.getItem(BIX_STATE_KEY) || 'null')
    if (typeof saved?.coins === 'number' && saved.needs) return { ...DEFAULT_BIX_STATE, ...saved, needs: { ...DEFAULT_BIX_STATE.needs, ...saved.needs } }
  } catch { /* use starter state */ }
  return DEFAULT_BIX_STATE
}

function stateFromRemote(row: { coins: number; food: number; mood: number; energy: number; last_daily_claim: string | null }): BixState {
  return { coins: row.coins, needs: { food: row.food, mood: row.mood, energy: row.energy }, lastDailyClaim: row.last_daily_claim }
}

const ACTIONS = [
  { id: 'ai', label: 'Спросить BX', icon: '✦', route: '/ai' },
  { id: 'task', label: 'Создать задачу', icon: '✓' },
  { id: 'note', label: 'Быстрая заметка', icon: '✎' },
  { id: 'tools', label: 'Утилиты', icon: '⌘' },
  { id: 'translator', label: 'Переводчик', icon: '文', route: '/translator' },
]

const TOOL_ACTIONS = [
  ['Очистить кэш 1С', '/tools'],
  ['Процессы 1С', '/tools'],
  ['Резервная копия базы', '/tools'],
  ['Проверить E‑Imzo', '/tools'],
  ['Проверить госсайты и банки', '/services'],
  ['Проверить ActiveX', '/tools'],
]

const openApp = (route: string) => (window as BxWidgetWindow).bx?.tray?.openApp?.(route)

export default function BixWidget() {
  const { plan } = usePlan()
  const [panel, setPanel] = useState<Panel>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [message, setMessage] = useState('Я рядом. Нажмите — покажу, что умею.')
  const [bix, setBix] = useState<BixState>(loadBixState)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [reminder, setReminder] = useState<BixReminder | null>(null)
  const [idleJoke, setIdleJoke] = useState<string | null>(null)

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      setPointer({
        x: Math.max(-7, Math.min(7, (event.clientX - window.innerWidth / 2) / 22)),
        y: Math.max(-4, Math.min(4, (event.clientY - window.innerHeight / 2) / 26)),
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    let hideTimer: number | undefined
    let nextTimer: number | undefined
    const schedule = () => {
      const delay = 10 * 60 * 1000 + Math.round(Math.random() * 5 * 60 * 1000)
      nextTimer = window.setTimeout(() => {
        setIdleJoke(BIX_JOKES[Math.floor(Math.random() * BIX_JOKES.length)])
        hideTimer = window.setTimeout(() => setIdleJoke(null), 7 * 1000)
        schedule()
      }, delay)
    }
    schedule()
    return () => { if (nextTimer) window.clearTimeout(nextTimer); if (hideTimer) window.clearTimeout(hideTimer) }
  }, [])

  useEffect(() => {
    const refreshReminder = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('bx_events')
        .select('id, title, date, type')
        .eq('user_id', user.id)
        .in('type', ['task', 'tax_deadline'])
        .neq('status', 'done')
        .lte('date', todayISO())
        .order('date', { ascending: true })
        .limit(1)
      const next = data?.[0] as BixReminder | undefined
      setReminder(next ?? null)
    }
    void refreshReminder()
    const timer = window.setInterval(() => void refreshReminder(), 5 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  const gaze = useMemo(() => ({ transform: `translate(${pointer.x * 0.25}px, ${pointer.y * 0.25}px)` }), [pointer])
  useEffect(() => { localStorage.setItem(BIX_STATE_KEY, JSON.stringify(bix)) }, [bix])

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('bx_bix_companions')
        .select('coins, food, mood, energy, last_daily_claim')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setBix(stateFromRemote(data))
    })()
  }, [])

  const claimDaily = useCallback(async () => {
    const today = todayISO()
    if (bix.lastDailyClaim === today) return
    const reward = DAILY_COINS[plan]
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.rpc('bx_claim_bix_daily_coins')
      if (!error && data) {
        setBix(stateFromRemote(data))
        const claimed = data.last_daily_claim === today && bix.lastDailyClaim !== today
        setMessage(claimed && reward ? `Подарок дня: +${reward} монет. Мр-р, спасибо, что заглянули!` : 'Я рад вас видеть!')
        return
      }
    }
    // До применения миграции или без сети виджет остаётся рабочим локально.
    setBix(value => ({ ...value, coins: value.coins + reward, lastDailyClaim: today }))
    setMessage(reward ? `Подарок дня: +${reward} монет. Мр-р, спасибо, что заглянули!` : 'Сегодня без монет, но я всё равно рад вас видеть!')
  }, [bix.lastDailyClaim, plan])

  const toggleMenu = () => {
    if (panel !== 'menu') void claimDaily()
    setPanel(value => value === 'menu' ? null : 'menu')
  }
  const choose = (action: typeof ACTIONS[number]) => {
    if (action.route) { openApp(action.route); setPanel(null); return }
    setPanel(action.id as Panel)
  }
  const useCare = async (kind: 'food' | 'mood') => {
    if (bix.coins < 2) { setMessage('Сначала накопим ещё немного монет.'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.rpc('bx_use_bix_care', { p_item: kind === 'food' ? 'food' : 'toy' })
      if (!error && data) {
        setBix(stateFromRemote(data))
        setMessage(kind === 'food' ? 'Мр-р. Спасибо за угощение!' : 'Поиграли — настроение на высоте!')
        return
      }
    }
    setBix(value => ({
      ...value,
      coins: value.coins - 2,
      needs: kind === 'food'
        ? { ...value.needs, food: Math.min(100, value.needs.food + 35) }
        : { ...value.needs, mood: Math.min(100, value.needs.mood + 25) },
    }))
    setMessage(kind === 'food' ? 'Мр-р. Спасибо за угощение!' : 'Поиграли — настроение на высоте!')
  }
  const saveDraft = async (kind: 'task' | 'note') => {
    const text = draft.trim()
    if (!text || saving) return
    setSaving(true)
    try {
      if (kind === 'task') {
        const task = await createCanonicalEvent({
          company_id: localStorage.getItem('bx_active_company') || null,
          type: 'task', title: text, date: todayISO(), due_date: null,
          status: 'todo', priority: 'normal', source: 'manual',
        })
        if (!task) throw new Error('Не удалось сохранить задачу. Проверьте подключение и вход в BX.')
        setMessage('Задача добавлена в Планировщик. Отлично!')
      } else {
        const current = (() => { try { return JSON.parse(localStorage.getItem(QUICK_NOTES_KEY) || '[]') } catch { return [] } })()
        localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify([{ id: uid(), text, createdAt: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), pinned: false }, ...current]))
        setMessage('Заметка сохранена. Ничего не потеряем.')
      }
      setDraft(''); setPanel(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить. Попробуйте ещё раз.')
    } finally { setSaving(false) }
  }
  const finishReminder = async () => {
    if (!reminder) return
    const { error } = await supabase.from('bx_events').update({ status: 'done' }).eq('id', reminder.id)
    if (error) { setMessage('Не удалось завершить задачу. Попробуйте ещё раз.'); return }
    emitPlannerReload(); setMessage('Готово. Отличная работа!'); setReminder(null)
  }
  const snoozeReminder = async () => {
    if (!reminder) return
    const reminderAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const { error } = await supabase.from('bx_events').update({ reminder_at: reminderAt }).eq('id', reminder.id)
    if (error) { setMessage('Не получилось отложить. Попробуйте ещё раз.'); return }
    emitPlannerReload(); setMessage('Хорошо, напомню через 15 минут.'); setReminder(null)
  }

  return <main className="bix-widget" onMouseDown={event => { if (event.target === event.currentTarget) setPanel(null) }}>
    {panel === 'menu' && <section className="bix-fan" aria-label="Действия Бикса">
      {ACTIONS.map((action, index) => <button key={action.id} className={`bix-action bix-action-${index}`} onClick={() => choose(action)}>
        <b>{action.icon}</b><span>{action.label}</span>
      </button>)}
      <button className="bix-home-button" onClick={() => setPanel('home')}><span>♟</span>Домик Бикса</button>
    </section>}

    {panel && panel !== 'menu' && <section className="bix-panel">
      <button className="bix-panel-close" onClick={() => setPanel(null)} aria-label="Закрыть">×</button>
      {panel === 'task' && <><small>БЫСТРАЯ ЗАДАЧА</small><h2>Что не забыть?</h2><textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Например: сверить первичку" autoFocus /><button className="bix-primary" disabled={saving} onClick={() => void saveDraft('task')}>{saving ? 'Сохраняю…' : 'Добавить в план'}</button></>}
      {panel === 'note' && <><small>БЫСТРАЯ ЗАМЕТКА</small><h2>Запишу, не потеряем.</h2><textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Введите заметку…" autoFocus /><button className="bix-primary" disabled={saving} onClick={() => void saveDraft('note')}>{saving ? 'Сохраняю…' : 'Сохранить'}</button></>}
      {panel === 'translator' && <><small>ПЕРЕВОДЧИК</small><h2>Переведём без потери смысла.</h2><button className="bix-primary" onClick={() => openApp('/translator')}>Открыть переводчик</button></>}
      {panel === 'tools' && <><small>УТИЛИТЫ BX</small><h2>Выберите операцию</h2><div className="bix-tools">{TOOL_ACTIONS.map(([label, route]) => <button key={label} onClick={() => { openApp(route); setPanel(null) }}>{label}<span>→</span></button>)}</div></>}
      {panel === 'home' && <><div className="bix-home-head"><div><small>ДОМИК БИКСА · {plan}</small><h2>{bix.coins} <em>монет</em></h2></div><span className="bix-coin">●</span></div><div className="bix-needs">{[['Сытость', bix.needs.food], ['Настроение', bix.needs.mood], ['Энергия', bix.needs.energy]].map(([label, value]) => <label key={String(label)}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></label>)}</div><div className="bix-care"><button onClick={() => void useCare('food')}>🥣<span>Корм</span><small>2 ●</small></button><button onClick={() => void useCare('mood')}>🧶<span>Игрушка</span><small>2 ●</small></button><button onClick={() => setMessage('Гардероб скоро откроется с первым набором одежды.')}>👕<span>Гардероб</span><small>скоро</small></button></div></>}
    </section>}

    <div className="bix-speech" aria-live="polite">{reminder ? `Напоминание: ${reminder.title}` : idleJoke || message}</div>
    {reminder && <div className="bix-reminder-actions">
      <button onClick={() => void finishReminder()}>Готово</button>
      <button onClick={() => void snoozeReminder()}>15 мин</button>
      <button onClick={() => openApp('/planner')}>Открыть</button>
    </div>}
    <button className="bix-character" onClick={toggleMenu} aria-label="Открыть действия Бикса">
      <span className="bix-drag" title="Перетащите Бикса за голову" />
      <img className="bix-mascot" src={bixMascot} alt="Бикс — питомец BX" style={gaze} draggable={false} />
    </button>
  </main>
}

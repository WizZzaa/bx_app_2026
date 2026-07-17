import { useCallback, useEffect, useMemo, useState } from 'react'
import '../styles/bix-widget.css'
import bixMascot from '../assets/mascot/bix-head-paws.png'
import bixBusinessMascot from '../assets/mascot/bix-business.png'
import bixAnalystMascot from '../assets/mascot/bix-analyst.png'
import bixNightMascot from '../assets/mascot/bix-night.png'
import { usePlan } from '../lib/plan'
import { createCanonicalEvent } from './planner/eventRepository'
import { todayISO } from '../lib/dates'
import { uid } from '../lib/uid'
import { supabase } from '../lib/db/supabase'
import { emitPlannerReload } from './planner/plannerBus'
import { buildPlainLanguagePrompt, buildTranslationPrompt, type TranslationLanguage } from '../lib/translator'
import type { CacheScanResult, ProcessEntry } from '../../shared/types'

type Panel = 'menu' | 'ai' | 'task' | 'note' | 'translator' | 'tools' | 'home' | 'settings' | 'intro' | null
type BxWidgetWindow = Window & { bx?: { tray?: { openApp?: (route?: string) => Promise<void>; getPinned?: () => Promise<boolean>; setPinned?: (pinned: boolean) => Promise<boolean>; dockToTaskbar?: () => Promise<void> }; onec?: { scanCache?: () => Promise<CacheScanResult>; cleanCache?: (paths: string[], backup?: boolean) => Promise<{ deletedPaths: string[]; failedPaths: Array<{ path: string }>; freedBytes: number }>; listProcesses?: () => Promise<ProcessEntry[]>; killProcesses?: (pids: number[]) => Promise<{ killed: number[]; failed: Array<{ pid: number }> }> } } }
type BixState = { coins: number; needs: { food: number; mood: number; energy: number }; lastDailyClaim: string | null }
type BixReminder = { id: string; title: string; date: string; type: string }
type JokeFrequency = 'rare' | 'normal' | 'often'
type BixSettings = { jokesEnabled: boolean; jokeFrequency: JokeFrequency; quietHours: boolean; quietFrom: string; quietTo: string; privateReminders: boolean; reducedMotion: boolean }
type BixCatalogItem = { sku: string; title: string; category: string; price: number; plan_required: string; visual_key: string }
type BixInventoryItem = { sku: string; equipped: boolean }
type BixCollection = { catalog: BixCatalogItem[]; inventory: BixInventoryItem[]; achievements: string[] }
type BixActivity = 'idle' | 'thinking' | 'working' | 'success' | 'error'
type WidgetTranslation = { id: string; source: string; result: string; plain?: string; direction: 'ru-uz' | 'uz-ru'; createdAt: string }

const BIX_STATE_KEY = 'bx_bix_state_v1'
const BIX_SETTINGS_KEY = 'bx_bix_settings_v1'
const BIX_INTRO_KEY = 'bx_bix_intro_seen_v1'
const QUICK_NOTES_KEY = 'bx_quick_notes'
const WIDGET_TRANSLATION_HISTORY_KEY = 'bx_widget_translation_history'
const DAILY_COINS = { free: 0, standard: 5, premium: 15 } as const
const DEFAULT_BIX_STATE: BixState = { coins: 30, needs: { food: 72, mood: 86, energy: 91 }, lastDailyClaim: null }
const DEFAULT_BIX_SETTINGS: BixSettings = { jokesEnabled: true, jokeFrequency: 'normal', quietHours: true, quietFrom: '21:00', quietTo: '08:00', privateReminders: false, reducedMotion: false }
const EMPTY_COLLECTION: BixCollection = { catalog: [], inventory: [], achievements: [] }
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

function loadBixSettings(): BixSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(BIX_SETTINGS_KEY) || 'null')
    if (saved && typeof saved === 'object') return { ...DEFAULT_BIX_SETTINGS, ...saved }
  } catch { /* use safe defaults */ }
  return DEFAULT_BIX_SETTINGS
}

export function isWithinQuietHours(settings: BixSettings, now = new Date()): boolean {
  if (!settings.quietHours) return false
  const minutes = now.getHours() * 60 + now.getMinutes()
  const parse = (value: string) => {
    const [hour, minute] = value.split(':').map(Number)
    return hour * 60 + minute
  }
  const from = parse(settings.quietFrom)
  const to = parse(settings.quietTo)
  return from === to ? false : from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to
}

export function jokeDelay(frequency: JokeFrequency): number {
  const range = frequency === 'often' ? [10, 12] : frequency === 'rare' ? [15, 20] : [10, 15]
  return (range[0] * 60 + Math.round(Math.random() * (range[1] - range[0]) * 60)) * 1000
}

function stateFromRemote(row: { coins: number; food: number; mood: number; energy: number; last_daily_claim: string | null }): BixState {
  return { coins: row.coins, needs: { food: row.food, mood: row.mood, energy: row.energy }, lastDailyClaim: row.last_daily_claim }
}

const ACTIONS = [
  { id: 'ai', label: 'Спросить BX', icon: '✦' },
  { id: 'task', label: 'Создать задачу', icon: '✓' },
  { id: 'note', label: 'Быстрая заметка', icon: '✎' },
  { id: 'tools', label: 'Утилиты', icon: '⌘' },
  { id: 'translator', label: 'Переводчик', icon: '文' },
]

const TOOL_ACTIONS = [
  ['Очистить кэш 1С', '/tools?tool=cache'],
  ['Процессы 1С', '/tools?tool=killer'],
  ['Резервная копия базы', '/tools?tool=backup'],
  ['Проверить E‑Imzo', '/tools?tool=eimzo'],
  ['Проверить госсайты и банки', '/tools?tool=network'],
  ['Проверить ActiveX', '/tools?tool=activex'],
]

const openApp = (route: string) => (window as BxWidgetWindow).bx?.tray?.openApp?.(route)

export default function BixWidget() {
  const { plan } = usePlan()
  const [panel, setPanel] = useState<Panel>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [message, setMessage] = useState('Я рядом. Нажмите — покажу, что умею.')
  const [bix, setBix] = useState<BixState>(loadBixState)
  const [draft, setDraft] = useState('')
  const [taskDate, setTaskDate] = useState(todayISO)
  const [taskTime, setTaskTime] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [taskNote, setTaskNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [reminder, setReminder] = useState<BixReminder | null>(null)
  const [idleJoke, setIdleJoke] = useState<string | null>(null)
  const [settings, setSettings] = useState<BixSettings>(loadBixSettings)
  const [collection, setCollection] = useState<BixCollection>(EMPTY_COLLECTION)
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [introOpen, setIntroOpen] = useState(() => !localStorage.getItem(BIX_INTRO_KEY))
  const [pinned, setPinned] = useState(true)
  const [translationText, setTranslationText] = useState('')
  const [translationResult, setTranslationResult] = useState('')
  const [translationDirection, setTranslationDirection] = useState<'ru-uz' | 'uz-ru'>('ru-uz')
  const [translating, setTranslating] = useState(false)
  const [translationExplaining, setTranslationExplaining] = useState(false)
  const [translationPlain, setTranslationPlain] = useState('')
  const [translationHistory, setTranslationHistory] = useState<WidgetTranslation[]>(() => { try { return JSON.parse(localStorage.getItem(WIDGET_TRANSLATION_HISTORY_KEY) || '[]') } catch { return [] } })
  const [activity, setActivity] = useState<BixActivity>('idle')
  const [utilityBusy, setUtilityBusy] = useState(false)
  const [cacheScan, setCacheScan] = useState<CacheScanResult | null>(null)
  const [onecProcesses, setOnecProcesses] = useState<ProcessEntry[]>([])
  const [utilityStatus, setUtilityStatus] = useState('')
  const [speechVisible, setSpeechVisible] = useState(true)
  const [speechHovered, setSpeechHovered] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [askingAi, setAskingAi] = useState(false)
  const [widgetChatId, setWidgetChatId] = useState<string | null>(null)
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [reportingAi, setReportingAi] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')
    html.classList.add('bix-widget-window'); body.classList.add('bix-widget-window'); root?.classList.add('bix-widget-window')
    return () => { html.classList.remove('bix-widget-window'); body.classList.remove('bix-widget-window'); root?.classList.remove('bix-widget-window') }
  }, [])

  useEffect(() => { void (window as BxWidgetWindow).bx?.tray?.getPinned?.().then(setPinned) }, [])

  useEffect(() => {
    if (activity === 'idle') return
    const timer = window.setTimeout(() => setActivity('idle'), activity === 'working' || activity === 'thinking' ? 8_000 : 3_000)
    return () => window.clearTimeout(timer)
  }, [activity])

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
    let nextTimer: number | undefined
    const schedule = () => {
      if (!settings.jokesEnabled) return
      const delay = jokeDelay(settings.jokeFrequency)
      nextTimer = window.setTimeout(() => {
        if (!isWithinQuietHours(settings)) {
          setIdleJoke(BIX_JOKES[Math.floor(Math.random() * BIX_JOKES.length)])
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => { if (nextTimer) window.clearTimeout(nextTimer) }
  }, [settings])

  useEffect(() => {
    if (!idleJoke || speechHovered) return
    const timer = window.setTimeout(() => setIdleJoke(null), 7_000)
    return () => window.clearTimeout(timer)
  }, [idleJoke, speechHovered])

  useEffect(() => { setSpeechVisible(true) }, [message])

  useEffect(() => {
    if (!speechVisible || speechHovered || reminder || idleJoke) return
    const timer = window.setTimeout(() => setSpeechVisible(false), 7_000)
    return () => window.clearTimeout(timer)
  }, [speechVisible, speechHovered, reminder, idleJoke, message])

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
  useEffect(() => { localStorage.setItem(BIX_SETTINGS_KEY, JSON.stringify(settings)) }, [settings])

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

  const refreshCollection = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCollectionLoading(true)
    const { data, error } = await supabase.rpc('bx_get_bix_collection')
    if (!error && data) setCollection(data as BixCollection)
    setCollectionLoading(false)
  }, [])

  useEffect(() => { void refreshCollection() }, [refreshCollection])

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

  const dismissIntro = () => {
    localStorage.setItem(BIX_INTRO_KEY, '1')
    setIntroOpen(false)
    setMessage('Я Бикс. Буду бережно напоминать о важном и помогать с рутиной.')
  }
  const dockToTaskbar = async () => {
    await (window as BxWidgetWindow).bx?.tray?.dockToTaskbar?.()
    const nextPinned = await (window as BxWidgetWindow).bx?.tray?.setPinned?.(true)
    setPinned(nextPinned !== false)
    setMessage('Закрепил Бикса над панелью задач. Лапки — на своём месте!')
  }
  const togglePinned = async () => {
    const next = !pinned
    const value = await (window as BxWidgetWindow).bx?.tray?.setPinned?.(next)
    setPinned(value ?? next)
    setMessage(next ? 'Бикс закреплён и останется на месте.' : 'Теперь Бикса можно скрыть через значок BX в трее.')
  }
  const translateInline = async () => {
    if (!translationText.trim() || translating) return
    setTranslating(true); setTranslationResult(''); setTranslationPlain(''); setActivity('thinking')
    const source: TranslationLanguage = translationDirection === 'ru-uz' ? 'ru' : 'uz-latn'
    const target: TranslationLanguage = translationDirection === 'ru-uz' ? 'uz-latn' : 'ru'
    try {
      const prompt = buildTranslationPrompt({ source, target, mode: 'accounting', text: translationText, glossary: '', preserveStructure: true })
      const { data, error } = await supabase.functions.invoke('ai-consultant', { body: { messages: [{ role: 'user', content: prompt }] } })
      if (error) throw error
      if (data?.error) throw new Error(data.message || data.error)
      const result = String(data?.text || '').trim()
      if (!result) throw new Error('Сервис вернул пустой перевод.')
      setTranslationResult(result)
      const item: WidgetTranslation = { id: uid(), source: translationText.trim(), result, direction: translationDirection, createdAt: new Date().toISOString() }
      setTranslationHistory(previous => {
        const next = [item, ...previous].slice(0, 20)
        localStorage.setItem(WIDGET_TRANSLATION_HISTORY_KEY, JSON.stringify(next))
        return next
      })
      setMessage('Перевод готов. Можно упростить текст, скопировать или открыть полный режим.'); setActivity('success')
    } catch (error) { setTranslationResult(error instanceof Error ? `Не удалось перевести: ${error.message}` : 'Не удалось выполнить перевод.'); setActivity('error') }
    finally { setTranslating(false) }
  }
  const explainTranslation = async (humanize = false) => {
    if (!translationResult.trim() || translationExplaining) return
    setTranslationExplaining(true); setActivity('thinking')
    const target: TranslationLanguage = translationDirection === 'ru-uz' ? 'uz-latn' : 'ru'
    const prompt = humanize
      ? `Перепиши текст понятным, естественным и доброжелательным языком на «${target === 'ru' ? 'русском' : 'узбекском'}». Сохрани все факты, суммы, сроки и смысл. Не добавляй ничего от себя.\n\n${translationResult}`
      : buildPlainLanguagePrompt(translationResult, target)
    try {
      const { data, error } = await supabase.functions.invoke('ai-consultant', { body: { messages: [{ role: 'user', content: prompt }] } })
      if (error) throw error
      const result = String(data?.text || '').trim()
      if (!result) throw new Error('Сервис вернул пустой ответ.')
      setTranslationPlain(result)
      setTranslationHistory(previous => {
        const next = previous.map(item => item.result === translationResult ? { ...item, plain: result } : item)
        localStorage.setItem(WIDGET_TRANSLATION_HISTORY_KEY, JSON.stringify(next))
        return next
      })
      setActivity('success')
    } catch { setMessage('Не удалось подготовить упрощённую версию.'); setActivity('error') }
    finally { setTranslationExplaining(false) }
  }
  const copyTranslation = async () => { if (translationResult) await navigator.clipboard.writeText(translationResult); setMessage('Перевод скопирован.') }
  const scanCacheFromWidget = async () => {
    const onec = (window as BxWidgetWindow).bx?.onec
    if (!onec?.scanCache) { openApp('/tools?tool=cache'); return }
    setUtilityBusy(true); setActivity('working'); setUtilityStatus('Проверяю кэш 1С…')
    try { const scan = await onec.scanCache(); setCacheScan(scan); setUtilityStatus(scan.platformSupported ? `Найдено: ${scan.entries.length} папок кэша.` : 'Эта операция доступна только в Windows.') ; setActivity('success') }
    catch { setUtilityStatus('Не удалось проверить кэш.'); setActivity('error') }
    finally { setUtilityBusy(false) }
  }
  const cleanCacheFromWidget = async () => {
    const onec = (window as BxWidgetWindow).bx?.onec
    if (!onec?.cleanCache || !cacheScan?.entries.length) return
    setUtilityBusy(true); setActivity('working')
    try { const result = await onec.cleanCache(cacheScan.entries.map(entry => entry.path), true); setUtilityStatus(`Готово: очищено ${result.deletedPaths.length} папок.`); setCacheScan(null); setActivity('success') }
    catch { setUtilityStatus('Не удалось очистить кэш.'); setActivity('error') }
    finally { setUtilityBusy(false) }
  }
  const scanProcessesFromWidget = async () => {
    const onec = (window as BxWidgetWindow).bx?.onec
    if (!onec?.listProcesses) { openApp('/tools?tool=killer'); return }
    setUtilityBusy(true); setActivity('working')
    try { const processes = await onec.listProcesses(); setOnecProcesses(processes); setUtilityStatus(processes.length ? `Найдено процессов 1С: ${processes.length}.` : 'Процессов 1С не найдено.'); setActivity('success') }
    catch { setUtilityStatus('Не удалось получить список процессов.'); setActivity('error') }
    finally { setUtilityBusy(false) }
  }
  const stopProcessesFromWidget = async () => {
    const onec = (window as BxWidgetWindow).bx?.onec
    if (!onec?.killProcesses || !onecProcesses.length) return
    setUtilityBusy(true); setActivity('working')
    try { const result = await onec.killProcesses(onecProcesses.map(process => process.pid)); setUtilityStatus(`Завершено процессов: ${result.killed.length}.`); setOnecProcesses([]); setActivity('success') }
    catch { setUtilityStatus('Не удалось завершить процессы.'); setActivity('error') }
    finally { setUtilityBusy(false) }
  }
  const choose = (action: typeof ACTIONS[number]) => {
    setPanel(action.id as Panel)
  }
  const askBix = async () => {
    const question = aiQuestion.trim()
    if (!question || askingAi) return
    setAskingAi(true); setAiAnswer(''); setActivity('thinking')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let chatId = widgetChatId
      if (user && !chatId) {
        chatId = uid()
        const { error: chatError } = await supabase.from('bx_ai_chats').insert({ id: chatId, user_id: user.id, title: question.slice(0, 50) })
        if (!chatError) setWidgetChatId(chatId)
      }
      const nextMessages = [...aiMessages, { role: 'user' as const, content: question }]
      setAiMessages(nextMessages)
      if (user && chatId) await supabase.from('bx_ai_messages').insert({ chat_id: chatId, user_id: user.id, role: 'user', content: question })
      const { data, error } = await supabase.functions.invoke('ai-consultant', {
        body: { messages: [{ role: 'system', content: 'Ты Бикс, краткий и доброжелательный помощник BX.UZ для малого бизнеса Узбекистана. Отвечай по-русски, профессионально и без выдуманных юридических или налоговых утверждений. Если вопрос требует проверки, предложи открыть полный AI-консультант.' }, ...nextMessages] },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.message || data.error)
      const answer = String(data?.text || '').trim()
      if (!answer) throw new Error('Не получил ответ от консультанта.')
      setAiAnswer(answer); setAiMessages(previous => [...previous, { role: 'assistant', content: answer }]); setAiQuestion('')
      if (user && chatId) await supabase.from('bx_ai_messages').insert({ chat_id: chatId, user_id: user.id, role: 'assistant', content: answer })
      setMessage('Ответ готов.'); setActivity('success')
    } catch (error) { setAiAnswer(error instanceof Error ? `Не удалось получить ответ: ${error.message}` : 'Не удалось получить ответ.'); setActivity('error') }
    finally { setAskingAi(false) }
  }
  const reportAiAnswer = async () => {
    if (!aiAnswer.trim() || reportingAi) return
    setReportingAi(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Нужен вход в BX.')
      const body = `Нужна проверка ответа AI-консультанта.\n\nВопрос:\n${aiMessages.filter(item => item.role === 'user').at(-1)?.content || '—'}\n\nОтвет BX:\n${aiAnswer}`
      const { data: ticket, error } = await supabase.from('bx_tickets').insert({ user_id: user.id, subject: 'Проверить неточность ответа BX', category: 'ai_accuracy' }).select('id').single()
      if (error || !ticket) throw error || new Error('Не удалось создать обращение.')
      const { error: messageError } = await supabase.from('bx_ticket_messages').insert({ ticket_id: ticket.id, user_id: user.id, author: 'user', body })
      if (messageError) throw messageError
      setMessage('Отправил ответ администраторам на проверку. Спасибо!'); setActivity('success')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось отправить проверку.'); setActivity('error') }
    finally { setReportingAi(false) }
  }
  const useCare = async (kind: 'food' | 'mood') => {
    if (bix.coins < 2) { setMessage('Сначала накопим ещё немного монет.'); return }
    setActivity('working')
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.rpc('bx_use_bix_care', { p_item: kind === 'food' ? 'food' : 'toy' })
      if (!error && data) {
        setBix(stateFromRemote(data))
        setMessage(kind === 'food' ? 'Мр-р. Спасибо за угощение!' : 'Поиграли — настроение на высоте!'); setActivity('success')
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
    setMessage(kind === 'food' ? 'Мр-р. Спасибо за угощение!' : 'Поиграли — настроение на высоте!'); setActivity('success')
  }
  const buyOrEquip = async (item: BixCatalogItem) => {
    if (collectionLoading) return
    const owned = collection.inventory.find(entry => entry.sku === item.sku)
    setCollectionLoading(true)
    const result = owned
      ? await supabase.rpc('bx_equip_bix_item', { p_sku: item.sku })
      : await supabase.rpc('bx_buy_bix_item', { p_sku: item.sku })
    setCollectionLoading(false)
    if (result.error || !result.data) {
      setMessage(result.error?.message || 'Не получилось обновить гардероб. Проверьте подключение.')
      return
    }
    setCollection(result.data as BixCollection)
    if (!owned) {
      const { data } = await supabase.from('bx_bix_companions').select('coins, food, mood, energy, last_daily_claim').maybeSingle()
      if (data) setBix(stateFromRemote(data))
    }
    setMessage(owned ? `${item.title} теперь на Биксе.` : `${item.title} добавлен в гардероб.`)
  }
  const equippedVisuals = useMemo(() => new Set(collection.inventory.filter(item => item.equipped).map(item => collection.catalog.find(catalogItem => catalogItem.sku === item.sku)?.visual_key).filter(Boolean)), [collection])
  const mascotSource = equippedVisuals.has('business') ? bixBusinessMascot : equippedVisuals.has('analyst') ? bixAnalystMascot : equippedVisuals.has('night') ? bixNightMascot : bixMascot
  const bixMode = activity !== 'idle' ? activity : reminder ? 'reminding' : panel ? 'engaged' : idleJoke ? 'joking' : bix.needs.energy < 25 ? 'sleepy' : bix.needs.food < 25 || bix.needs.mood < 25 ? 'concerned' : 'idle'
  const saveDraft = async (kind: 'task' | 'note') => {
    const text = draft.trim()
    if (!text || saving) return
    setSaving(true); setActivity('working')
    try {
      if (kind === 'task') {
        const reminderAt = taskTime ? new Date(`${taskDate || todayISO()}T${taskTime}`).toISOString() : null
        const task = await createCanonicalEvent({
          company_id: localStorage.getItem('bx_active_company') || null,
          type: 'task', title: text, date: taskDate || todayISO(), due_date: taskDate || todayISO(),
          status: 'todo', priority: taskPriority, note: taskNote.trim() || null, reminder_at: reminderAt, source: 'manual',
        })
        if (!task) throw new Error('Не удалось сохранить задачу. Проверьте подключение и вход в BX.')
        setMessage('Задача добавлена в Планировщик. Отлично!')
      } else {
        const current = (() => { try { return JSON.parse(localStorage.getItem(QUICK_NOTES_KEY) || '[]') } catch { return [] } })()
        localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify([{ id: uid(), text, createdAt: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), pinned: false }, ...current]))
        setMessage('Заметка сохранена. Ничего не потеряем.')
      }
      setDraft(''); setTaskNote(''); setTaskTime(''); setTaskPriority('normal'); setPanel(null); setActivity('success')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить. Попробуйте ещё раз.'); setActivity('error')
    } finally { setSaving(false) }
  }
  const finishReminder = async () => {
    if (!reminder) return
    const { error } = await supabase.from('bx_events').update({ status: 'done' }).eq('id', reminder.id)
    if (error) { setMessage('Не удалось завершить задачу. Попробуйте ещё раз.'); setActivity('error'); return }
    emitPlannerReload(); setMessage('Готово. Отличная работа!'); setReminder(null); setActivity('success')
  }
  const snoozeReminder = async () => {
    if (!reminder) return
    const reminderAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const { error } = await supabase.from('bx_events').update({ reminder_at: reminderAt }).eq('id', reminder.id)
    if (error) { setMessage('Не получилось отложить. Попробуйте ещё раз.'); setActivity('error'); return }
    emitPlannerReload(); setMessage('Хорошо, напомню через 15 минут.'); setReminder(null)
  }

  const reminderText = reminder ? (settings.privateReminders ? 'Напоминание: есть задача на сегодня.' : `Напоминание: ${reminder.title}`) : idleJoke || (speechVisible ? message : null)
  return <main className={`bix-widget bix-state-${bixMode}${settings.reducedMotion ? ' bix-reduced-motion' : ''}`} onMouseDown={event => { if (event.target === event.currentTarget) setPanel(null) }}>
    {panel === 'menu' && <section className="bix-fan" aria-label="Действия Бикса">
      {ACTIONS.map((action, index) => <button key={action.id} className={`bix-action bix-action-${index}`} onClick={() => choose(action)}>
        <b>{action.icon}</b><span>{action.label}</span>
      </button>)}
      <button className="bix-home-button" onClick={() => setPanel('home')}><span>♟</span>Домик Бикса</button>
    </section>}

    {introOpen && <section className="bix-intro" aria-label="Знакомство с Биксом">
      <span>BX.UZ · ПОМОЩНИК</span><h2>Привет, я Бикс.</h2><p>Буду рядом с панелью задач, напомню о делах и помогу начать работу быстрее.</p>
      <button className="bix-primary" onClick={dismissIntro}>Познакомиться</button>
    </section>}

    {panel && panel !== 'menu' && <section className="bix-panel">
      <button className="bix-panel-close" onClick={() => setPanel(null)} aria-label="Закрыть">×</button>
      {panel === 'ai' && <><small>СПРОСИТЬ БИКСА</small><h2>Коротко разберём вопрос.</h2>{aiMessages.length > 0 && <div className="bix-ai-history">{aiMessages.map((item, index) => <p key={`${item.role}-${index}`} className={`bix-ai-message ${item.role}`}>{item.content}</p>)}</div>}<textarea value={aiQuestion} onChange={event => setAiQuestion(event.target.value)} placeholder="Например: что проверить перед сдачей отчёта?" autoFocus /><button className="bix-primary" disabled={!aiQuestion.trim() || askingAi} onClick={() => void askBix()}>{askingAi ? 'Думаю…' : 'Спросить'}</button>{aiAnswer && <div className="bix-inline-actions"><button disabled={reportingAi} onClick={() => void reportAiAnswer()}>{reportingAi ? 'Отправляю…' : 'Сообщить о неточности'}</button></div>}<div className="bix-inline-actions"><button onClick={() => openApp('/ai')}>Открыть полный диалог ↗</button></div></>}
      {panel === 'task' && <><small>БЫСТРАЯ ЗАДАЧА</small><h2>Что не забыть?</h2><textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Например: сверить первичку" autoFocus /><div className="bix-task-fields"><label>Дата<input type="date" value={taskDate} onChange={event => setTaskDate(event.target.value)} /></label><label>Напомнить<input type="time" value={taskTime} onChange={event => setTaskTime(event.target.value)} /></label><label className="bix-task-priority">Приоритет<select value={taskPriority} onChange={event => setTaskPriority(event.target.value as 'low' | 'normal' | 'high')}><option value="low">Низкий</option><option value="normal">Обычный</option><option value="high">Высокий</option></select></label></div><textarea className="bix-task-note" value={taskNote} onChange={event => setTaskNote(event.target.value)} placeholder="Комментарий или детали (необязательно)" /><button className="bix-primary" disabled={saving} onClick={() => void saveDraft('task')}>{saving ? 'Сохраняю…' : taskTime ? 'Добавить с напоминанием' : 'Добавить в план'}</button></>}
      {panel === 'note' && <><small>БЫСТРАЯ ЗАМЕТКА</small><h2>Запишу, не потеряем.</h2><textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Введите заметку…" autoFocus /><button className="bix-primary" disabled={saving} onClick={() => void saveDraft('note')}>{saving ? 'Сохраняю…' : 'Сохранить'}</button></>}
      {panel === 'translator' && <>
        <small>БЫСТРЫЙ ПЕРЕВОДЧИК</small><h2>RU ↔ UZ прямо здесь.</h2>
        <div className="bix-translate-direction"><button className={translationDirection === 'ru-uz' ? 'active' : ''} onClick={() => setTranslationDirection('ru-uz')}>RU → UZ</button><button className={translationDirection === 'uz-ru' ? 'active' : ''} onClick={() => setTranslationDirection('uz-ru')}>UZ → RU</button></div>
        <textarea value={translationText} onChange={event => setTranslationText(event.target.value)} placeholder="Вставьте короткий текст…" />
        <button className="bix-primary" disabled={!translationText.trim() || translating} onClick={() => void translateInline()}>{translating ? 'Перевожу…' : 'Перевести'}</button>
        {translationResult && <><div className="bix-translation-result">{translationResult}</div><div className="bix-inline-actions bix-translation-tools"><button disabled={translationExplaining} onClick={() => void explainTranslation(false)}>{translationExplaining ? 'Готовлю…' : 'Объяснить просто'}</button><button disabled={translationExplaining} onClick={() => void explainTranslation(true)}>Очеловечить</button></div>{translationPlain && <div className="bix-translation-result bix-plain-result">{translationPlain}</div>}</>}
        <div className="bix-inline-actions">{translationResult && <button onClick={() => void copyTranslation()}>Копировать</button>}<button onClick={() => openApp('/translator')}>Полный переводчик ↗</button></div>
        {translationHistory.length > 0 && <details className="bix-translation-history"><summary>История переводов · {translationHistory.length}</summary>{translationHistory.slice(0, 5).map(item => <button key={item.id} onClick={() => { setTranslationText(item.source); setTranslationResult(item.result); setTranslationPlain(item.plain || ''); setTranslationDirection(item.direction) }}>{item.source.slice(0, 54)}</button>)}</details>}
      </>}
      {panel === 'tools' && <><small>УТИЛИТЫ BX</small><h2>Быстрые действия здесь</h2><p className="bix-panel-hint">Кэш и процессы 1С можно проверить прямо в виджете. Остальное открывается в полном режиме.</p><div className="bix-quick-tools"><button disabled={utilityBusy} onClick={() => void scanCacheFromWidget()}>🧹 Проверить кэш 1С</button>{cacheScan?.entries.length ? <button disabled={utilityBusy} className="accent" onClick={() => void cleanCacheFromWidget()}>Очистить {cacheScan.entries.length} папок</button> : null}<button disabled={utilityBusy} onClick={() => void scanProcessesFromWidget()}>⚡ Процессы 1С</button>{onecProcesses.length ? <button disabled={utilityBusy} className="danger" onClick={() => void stopProcessesFromWidget()}>Завершить {onecProcesses.length} процессов</button> : null}</div>{utilityStatus && <p className="bix-utility-status">{utilityStatus}</p>}<div className="bix-tools">{TOOL_ACTIONS.slice(2).map(([label, route]) => <button key={label} onClick={() => { openApp(route); setPanel(null) }}><span>{label}</span><b>Полный режим ↗</b></button>)}</div></>}
      {panel === 'home' && <><div className="bix-home-head"><div><small>ДОМИК БИКСА · {plan}</small><h2>{bix.coins} <em>монет</em></h2></div><span className="bix-coin">●</span></div><div className="bix-needs">{[['Сытость', bix.needs.food], ['Настроение', bix.needs.mood], ['Энергия', bix.needs.energy]].map(([label, value]) => <label key={String(label)}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></label>)}</div><div className="bix-care"><button onClick={() => void useCare('food')}>🥣<span>Корм</span><small>2 ●</small></button><button onClick={() => void useCare('mood')}>🧶<span>Игрушка</span><small>2 ●</small></button><button onClick={() => setPanel('settings')}>⚙<span>Настройки</span><small>виджет</small></button></div><div className="bix-wardrobe"><div><small>ГАРДЕРОБ</small><button onClick={() => void refreshCollection()} disabled={collectionLoading}>↻</button></div>{collection.catalog.length ? collection.catalog.map(item => { const owned = collection.inventory.find(entry => entry.sku === item.sku); const equipped = owned?.equipped; const locked = item.plan_required === 'standard' && plan === 'free' || item.plan_required === 'premium' && plan !== 'premium'; return <button key={item.sku} className={equipped ? 'equipped' : ''} disabled={locked || collectionLoading} onClick={() => void buyOrEquip(item)}><span>{item.title}</span><small>{locked ? `${item.plan_required}+` : equipped ? 'на Биксе' : owned ? 'надеть' : `${item.price} ●`}</small></button> }) : <p>Гардероб загрузится после входа в BX.</p>}</div></>}
      {panel === 'settings' && <><small>НАСТРОЙКИ БИКСА</small><h2>Тихо, бережно, по делу.</h2><div className="bix-settings"><label><span>Шутки</span><input type="checkbox" checked={settings.jokesEnabled} onChange={event => setSettings(value => ({ ...value, jokesEnabled: event.target.checked }))} /></label><label><span>Частота шуток</span><select value={settings.jokeFrequency} disabled={!settings.jokesEnabled} onChange={event => setSettings(value => ({ ...value, jokeFrequency: event.target.value as JokeFrequency }))}><option value="rare">реже — 15–20 мин</option><option value="normal">обычно — 10–15 мин</option><option value="often">чаще — 10–12 мин</option></select></label><label><span>Тихие часы</span><input type="checkbox" checked={settings.quietHours} onChange={event => setSettings(value => ({ ...value, quietHours: event.target.checked }))} /></label>{settings.quietHours && <label className="bix-setting-time"><span>Не беспокоить</span><input type="time" value={settings.quietFrom} onChange={event => setSettings(value => ({ ...value, quietFrom: event.target.value }))} /><b>—</b><input type="time" value={settings.quietTo} onChange={event => setSettings(value => ({ ...value, quietTo: event.target.value }))} /></label>}<label><span>Скрывать названия задач</span><input type="checkbox" checked={settings.privateReminders} onChange={event => setSettings(value => ({ ...value, privateReminders: event.target.checked }))} /></label><label><span>Уменьшить анимацию</span><input type="checkbox" checked={settings.reducedMotion} onChange={event => setSettings(value => ({ ...value, reducedMotion: event.target.checked }))} /></label></div><p className="bix-settings-note">Системный режим Windows «Не беспокоить» пока не считывается автоматически.</p></>}
    </section>}

    {reminderText && <div className="bix-speech" aria-live="polite" onMouseEnter={() => setSpeechHovered(true)} onMouseLeave={() => setSpeechHovered(false)}>{reminderText}</div>}
    {reminder && <div className="bix-reminder-actions">
      <button onClick={() => void finishReminder()}>Готово</button>
      <button onClick={() => void snoozeReminder()}>15 мин</button>
      <button onClick={() => openApp('/planner')}>Открыть</button>
    </div>}
    <button className="bix-character" onClick={toggleMenu} aria-label="Открыть действия Бикса">
      <span className="bix-drag" title="Перетащите Бикса за голову" />
      <img className="bix-mascot" src={mascotSource} alt="Бикс — питомец BX" style={gaze} draggable={false} />
    </button>
    <div className="bix-pin-controls"><button onClick={() => void dockToTaskbar()} title="Прикрепить к панели задач">⌖</button><button onClick={() => void togglePinned()} title={pinned ? 'Открепить виджет' : 'Закрепить виджет'}>{pinned ? '📌' : '📍'}</button></div>
  </main>
}

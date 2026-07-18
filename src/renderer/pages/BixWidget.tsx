import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../styles/bix-widget.css'
import bixMascot from '../assets/mascot/bix-head-paws.png'
import bixBusinessMascot from '../assets/mascot/bix-business.png'
import bixAnalystMascot from '../assets/mascot/bix-analyst.png'
import bixNightMascot from '../assets/mascot/bix-night.png'
import hatLimeCap from '../assets/mascot/hats/hat-lime-cap.png'
import hatTopHat from '../assets/mascot/hats/hat-top-hat.png'
import hatFedora from '../assets/mascot/hats/hat-fedora.png'
import hatCowboy from '../assets/mascot/hats/hat-cowboy.png'
import hatParty from '../assets/mascot/hats/hat-party.png'
import hatWizard from '../assets/mascot/hats/hat-wizard.png'
import hatSailor from '../assets/mascot/hats/hat-sailor.png'
import { usePlan } from '../lib/plan'
import { createCanonicalEvent } from './planner/eventRepository'
import { todayISO } from '../lib/dates'
import { uid } from '../lib/uid'
import { supabase } from '../lib/db/supabase'
import { emitPlannerReload } from './planner/plannerBus'
import { buildPlainLanguagePrompt, buildTranslationPrompt, type TranslationLanguage } from '../lib/translator'
import {
  enqueueBixEconomyOperation,
  makeBixEconomyOperation,
  syncBixEconomyQueue,
  type BixEconomyState,
} from '../lib/bixEconomy'
import type { CacheScanResult, CurrencyRate, ProcessEntry } from '../../shared/types'
import type { EventRecurrence } from './planner/useEvents'

type Panel = 'menu' | 'ai' | 'accuracy' | 'task' | 'note' | 'translator' | 'currency' | 'tools' | 'home' | 'wardrobe' | 'chest' | 'achievements' | 'settings' | 'intro' | null
type BxWidgetWindow = Window & { bx?: {
  tray?: { openApp?: (route?: string) => Promise<void>; getPinned?: () => Promise<boolean>; setPinned?: (pinned: boolean) => Promise<boolean>; dockToTaskbar?: () => Promise<void>; resizeWidget?: (width: number, height: number) => Promise<void>; setClickThrough?: (enabled: boolean) => Promise<void>; showNotification?: (title: string, body: string, route?: string) => Promise<boolean> }
  onec?: { scanCache?: () => Promise<CacheScanResult>; cleanCache?: (paths: string[], backup?: boolean) => Promise<{ deletedPaths: string[]; failedPaths: Array<{ path: string }>; freedBytes: number }>; listProcesses?: () => Promise<ProcessEntry[]>; killProcesses?: (pids: number[]) => Promise<{ killed: number[]; failed: Array<{ pid: number }> }> }
  widgets?: { getRates?: (codes?: string[]) => Promise<CurrencyRate[]> }
  siteSession?: { open?: (url: string) => Promise<{ success: boolean; message?: string; error?: string }>; reset?: (url: string, mode: 'cache' | 'full') => Promise<{ success: boolean; message?: string; error?: string }> }
} }
type BixState = { coins: number; needs: { food: number; mood: number; energy: number }; lastDailyClaim: string | null }
type BixReminder = { id: string; title: string; date: string; type: string; reminder_at?: string | null }
type JokeFrequency = 'rare' | 'normal' | 'often'
type AnimationSpeed = 'calm' | 'slow' | 'normal' | 'fast' | 'turbo'
type BixSettings = { jokesEnabled: boolean; jokeFrequency: JokeFrequency; animationSpeed: AnimationSpeed; quietHours: boolean; quietFrom: string; quietTo: string; privateReminders: boolean; notificationsEnabled?: boolean; reducedMotion: boolean }
type BixCatalogItem = { sku: string; title: string; category: string; price: number; plan_required: string; visual_key: string }
type BixInventoryItem = { sku: string; equipped: boolean }
type BixAchievement = { code: string; title: string; description: string; metric: string; target: number; rewardCoins: number }
type BixAchievementProgress = { code: string; value: number; target: number }
type BixCollection = {
  catalog: BixCatalogItem[]
  inventory: BixInventoryItem[]
  achievements: string[]
  achievementCatalog: BixAchievement[]
  achievementProgress: BixAchievementProgress[]
  companion?: BixEconomyState | null
}
type BixAnimationCycle = 'idle' | 'thinking' | 'working' | 'success' | 'error' | 'sleep' | 'greeting' | 'ai-wait' | 'translation' | 'task-done' | 'reminder' | 'feeding' | 'playing'
type BixActivity = Exclude<BixAnimationCycle, 'sleep' | 'reminder'>
type WidgetTranslation = { id: string; source: string; result: string; plain?: string; direction: 'ru-uz' | 'uz-ru'; createdAt: string }
type WidgetCompany = { id: string; name: string }
type ReminderLead = 'none' | 'at-time' | '15m' | '1h' | '1d'
type AccuracyKind = 'fact' | 'outdated' | 'unclear' | 'unsafe' | 'other'
type BixAnimationState = BixAnimationCycle

// Сортируем по исходному пути, а не по собранному URL: после production-build
// у URL есть hash. Промежуточный image_1_5 должен идти после image_1, а не до него.
export const loadBixFrames = (modules: Record<string, unknown>, include: (path: string) => boolean = () => true): string[] => Object.entries(modules)
  .filter(([path]) => include(path))
  .sort(([first], [second]) => {
    const readOrder = (path: string) => {
      const match = path.match(/(?:image|frame)_(\d+)(?:_(\d+))?\.png$/)
      return [Number(match?.[1] || 0), match?.[2] ? 1 : 0] as const
    }
    const [firstKey, firstPhase] = readOrder(first)
    const [secondKey, secondPhase] = readOrder(second)
    return firstKey - secondKey || firstPhase - secondPhase
  })
  .map(([, source]) => source as string)

// Инструменты подготовки кадров сохраняем для будущей анимации, но runtime
// текущего релиза не импортирует папки frames и показывает цельные PNG.
export const loadCycle = (modules: Record<string, unknown>) => {
  const hasRegeneratedFrames = Object.keys(modules).some(path => /frame_\d+\.png$/.test(path))
  return loadBixFrames(modules, path => hasRegeneratedFrames ? /frame_\d+\.png$/.test(path) : /image_\d+_5\.png$/.test(path))
}
const EVENT_FALLBACK_STATE: Partial<Record<BixAnimationState, BixAnimationState>> = {
  greeting: 'idle', 'ai-wait': 'thinking', translation: 'working', 'task-done': 'success', reminder: 'thinking', feeding: 'success', playing: 'success',
}

export function pickFrameCycle(
  base: Record<BixAnimationState, string[]>,
  outfit: Partial<Record<BixAnimationState, string[]>> | null,
  state: BixAnimationState,
  fallbackImage: string,
) {
  if (!outfit) return base[state]
  const exact = outfit[state]
  if (exact?.length) return exact
  const fallbackState = EVENT_FALLBACK_STATE[state]
  const fallback = fallbackState ? outfit[fallbackState] : null
  return fallback?.length ? fallback : [fallbackImage]
}
const BIX_STATE_KEY = 'bx_bix_state_v1'
const BIX_SETTINGS_KEY = 'bx_bix_settings_v1'
const BIX_INTRO_KEY = 'bx_bix_intro_seen_v1'
const QUICK_NOTES_KEY = 'bx_quick_notes'
const WIDGET_TRANSLATION_HISTORY_KEY = 'bx_widget_translation_history'
const DAILY_COINS = { free: 0, standard: 5, premium: 15 } as const
const DEFAULT_BIX_STATE: BixState = { coins: 30, needs: { food: 72, mood: 86, energy: 91 }, lastDailyClaim: null }
const DEFAULT_BIX_SETTINGS: BixSettings = { jokesEnabled: true, jokeFrequency: 'normal', animationSpeed: 'normal', quietHours: true, quietFrom: '21:00', quietTo: '08:00', privateReminders: false, notificationsEnabled: true, reducedMotion: false }
const EMPTY_COLLECTION: BixCollection = { catalog: [], inventory: [], achievements: [], achievementCatalog: [], achievementProgress: [] }
const BIX_PANEL_VIEWPORT_RESERVE = 234

export const widgetHeightForPanel = (contentScrollHeight: number) => Math.max(
  560,
  Math.min(1200, Math.ceil(contentScrollHeight) + BIX_PANEL_VIEWPORT_RESERVE),
)

const BIX_JOKES = [
  'Я не паникую. Я просто проверяю, где снова поменяли форму отчёта.',
  'Налоговая любит порядок. Я тоже — особенно когда дедлайн не сегодня.',
  'Если госсайт открылся с первого раза, можно смело загадывать желание.',
  'Моя суперсила — напомнить про задачу до того, как она станет срочной.',
  'Таблицы не кусаются. Но лучше всё равно сделать резервную копию.',
  'Отчёт любит спокойствие. Я уже проверил, где лежит калькулятор.',
  'Пусть цифры сходятся так же легко, как кот на тёплый ноутбук.',
  'Дедлайн ещё не рычит. Но я держу его в поле зрения.',
  'Сегодня работаем по плану: сначала важное, потом ещё один чай.',
  'Если реквизиты сошлись с первого раза — это не магия. Это вы молодец.',
]
const BIX_PHRASES = {
  greeting: ['Я рядом. Нажмите — покажу, что умею.', 'Добрый день! Я держу важные дела на виду.', 'На посту. Готов помочь с задачами и переводом.', 'Привет! Давайте сделаем рабочий день спокойнее.'],
  dailyGift: ['Подарок дня: +{coins} монет. Мр-р, спасибо, что заглянули!', '+{coins} монет в копилку Бикса. Хорошего рабочего ритма!', 'Ежедневный запас монет пополнен: +{coins}. Я на связи!'],
  dailyFree: ['Сегодня без монет, но я всё равно рад быть рядом.', 'Тариф без ежедневных монет — а поддержка Бикса всё равно безлимитна.', 'Монет сегодня нет, зато есть я и хороший рабочий план.'],
  introduction: ['Я Бикс. Бережно напомню о важном и помогу с рутиной.', 'Я Бикс: слежу за сроками, а не за вами. Начнём спокойно?', 'Буду рядом с панелью задач: задача, перевод или короткий вопрос — в один клик.'],
  docked: ['Закрепил Бикса над панелью задач. Лапки — на своём месте!', 'Готово: я держусь за панель задач и не мешаю рабочему столу.', 'Закрепился. Теперь я рядом, но не лезу в документы.'],
  pinned: ['Бикс закреплён и останется на месте.', 'Закрепил позицию. Я никуда не убегу.', 'На месте — можно спокойно заниматься делами.'],
  hidden: ['Теперь Бикса можно скрыть через значок BX в трее.', 'Если понадобится тишина — спрячьте меня из значка BX рядом с часами.', 'Открепил: управлять виджетом можно через трей BX.'],
  translated: ['Перевод готов. Можно упростить текст, скопировать или открыть полный режим.', 'Готово! Если формулировка слишком канцелярская, нажмите «Очеловечить».', 'Перевёл. Могу также объяснить смысл простыми словами.'],
  taskSaved: ['Задача добавлена в Планировщик. Отлично!', 'Записал задачу — теперь она не потеряется.', 'Готово, дело уже в плане. Я напомню вовремя.'],
  noteSaved: ['Заметка сохранена. Ничего не потеряем.', 'Записал. Вернёмся к этому, когда понадобится.', 'Готово — мысль в надёжном месте.'],
  success: ['Готово. Ещё одно дело спокойно закрыто.', 'Отлично сработано — результат уже сохранён.', 'Есть! Всё получилось с первого кошачьего захода.'],
  error: ['Не получилось. Я сохранил контекст — попробуем ещё раз.', 'Что-то пошло не по плану. Проверьте подключение, а я подожду.', 'Небольшая техническая заминка. Данные не потеряны.'],
  reminder: ['Мягко напоминаю: пришло время важной задачи.', 'Срок уже рядом. Открыть задачу или отложить на 15 минут?', 'Я держал это дело в поле зрения — пора взглянуть.'],
  working: ['Работаю. Сейчас разложу всё по полочкам.', 'Проверяю данные — это займёт немного времени.', 'Секунду, Бикс уже занят делом.'],
} as const
const WARDROBE_ICONS: Record<string, string> = { business: '💼', analyst: '📊', night: '🌙' }
const WARDROBE_VISUALS: Record<string, string> = { business: bixBusinessMascot, analyst: bixAnalystMascot, night: bixNightMascot }
const HAT_VISUALS: Record<string, string> = {
  hat_lime_cap: hatLimeCap, hat_top_hat: hatTopHat, hat_fedora: hatFedora, hat_cowboy: hatCowboy,
  hat_party: hatParty, hat_wizard: hatWizard, hat_sailor: hatSailor,
}

function pickPhrase(phrases: readonly string[]) {
  return phrases[Math.floor(Math.random() * phrases.length)]
}

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
  const minutes: Record<JokeFrequency, number> = { often: 2, normal: 5, rare: 10 }
  return minutes[frequency] * 60 * 1000
}

export function animationDelay(speed: AnimationSpeed): number {
  return { calm: 520, slow: 400, normal: 300, fast: 220, turbo: 150 }[speed]
}

export function taskReminderAt(date: string, time: string, lead: ReminderLead): string | null {
  if (lead === 'none') return null
  const due = new Date(`${date}T${time || '09:00'}:00`)
  if (Number.isNaN(due.getTime())) return null
  const minutes = { 'at-time': 0, '15m': 15, '1h': 60, '1d': 24 * 60 }[lead]
  return new Date(due.getTime() - minutes * 60_000).toISOString()
}

export function clampPanelOffset(
  desired: { x: number; y: number },
  bounds: { baseLeft: number; baseTop: number; width: number; height: number; viewportWidth: number; viewportHeight: number },
) {
  return {
    x: Math.min(bounds.viewportWidth - bounds.baseLeft - bounds.width, Math.max(-bounds.baseLeft, desired.x)),
    y: Math.min(bounds.viewportHeight - bounds.baseTop - bounds.height, Math.max(-bounds.baseTop, desired.y)),
  }
}

function stateFromRemote(row: BixEconomyState): BixState {
  return { coins: row.coins, needs: { food: row.food, mood: row.mood, energy: row.energy }, lastDailyClaim: row.last_daily_claim }
}

const ACTIONS = [
  { id: 'ai', label: 'Спросить BX', icon: '✦' },
  { id: 'task', label: 'Создать задачу', icon: '✓' },
  { id: 'note', label: 'Быстрая заметка', icon: '✎' },
  { id: 'tools', label: 'Утилиты', icon: '⌘' },
  { id: 'translator', label: 'Переводчик', icon: '文' },
  { id: 'app', label: 'Открыть приложение', icon: '▣', route: '/' },
  { id: 'currency', label: 'Курсы валют', icon: '💱' },
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
  const [message, setMessage] = useState('')
  const [bix, setBix] = useState<BixState>(loadBixState)
  const [draft, setDraft] = useState('')
  const [taskDate, setTaskDate] = useState(todayISO)
  const [taskTime, setTaskTime] = useState('')
  const [taskCompanyId, setTaskCompanyId] = useState(() => localStorage.getItem('bx_active_company') || '')
  const [taskRecurrence, setTaskRecurrence] = useState<EventRecurrence>(null)
  const [taskReminderLead, setTaskReminderLead] = useState<ReminderLead>('at-time')
  const [taskPriority, setTaskPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [taskNote, setTaskNote] = useState('')
  const [companies, setCompanies] = useState<WidgetCompany[]>([])
  const [saving, setSaving] = useState(false)
  const [reminder, setReminder] = useState<BixReminder | null>(null)
  const [reminderPhrase, setReminderPhrase] = useState('')
  const [idleJoke, setIdleJoke] = useState<string | null>(null)
  const [settings, setSettings] = useState<BixSettings>(loadBixSettings)
  const [collection, setCollection] = useState<BixCollection>(EMPTY_COLLECTION)
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [wardrobeSection, setWardrobeSection] = useState<'outfits' | 'accessories'>('outfits')
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
  const [siteUrl, setSiteUrl] = useState('https://my.soliq.uz')
  const [speechVisible, setSpeechVisible] = useState(false)
  const [speechHovered, setSpeechHovered] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [askingAi, setAskingAi] = useState(false)
  const [widgetChatId, setWidgetChatId] = useState<string | null>(null)
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [reportingAi, setReportingAi] = useState(false)
  const [accuracyKind, setAccuracyKind] = useState<AccuracyKind>('fact')
  const [accuracyDetails, setAccuracyDetails] = useState('')
  const [accuracyExpected, setAccuracyExpected] = useState('')
  const [rates, setRates] = useState<CurrencyRate[]>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 })
  const [pinControlsVisible, setPinControlsVisible] = useState(false)
  const notifiedReminderRef = useRef<string | null>(null)
  const controlsTimerRef = useRef<number | null>(null)
  const clickThroughRef = useRef(true)
  const panelRef = useRef<HTMLElement | null>(null)
  const panelDragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null)

  const setClickThrough = useCallback((enabled: boolean) => {
    if (clickThroughRef.current === enabled) return
    clickThroughRef.current = enabled
    void (window as BxWidgetWindow).bx?.tray?.setClickThrough?.(enabled)
  }, [])
  const showPinControls = useCallback(() => {
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current)
    setPinControlsVisible(true)
  }, [])
  const schedulePinControlsHide = useCallback(() => {
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = window.setTimeout(() => setPinControlsVisible(false), 1_200)
  }, [])

  const beginPanelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    panelDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: panelOffset.x, offsetY: panelOffset.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const movePanel = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = panelDragRef.current
    const element = panelRef.current
    if (!drag || drag.pointerId !== event.pointerId || !element) return
    const rect = element.getBoundingClientRect()
    const baseLeft = rect.left - panelOffset.x
    const baseTop = rect.top - panelOffset.y
    const desiredX = drag.offsetX + event.clientX - drag.startX
    const desiredY = drag.offsetY + event.clientY - drag.startY
    setPanelOffset(clampPanelOffset(
      { x: desiredX, y: desiredY },
      { baseLeft, baseTop, width: rect.width, height: rect.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight },
    ))
  }
  const endPanelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panelDragRef.current?.pointerId !== event.pointerId) return
    panelDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')
    html.classList.add('bix-widget-window'); body.classList.add('bix-widget-window'); root?.classList.add('bix-widget-window')
    return () => { html.classList.remove('bix-widget-window'); body.classList.remove('bix-widget-window'); root?.classList.remove('bix-widget-window') }
  }, [])

  useEffect(() => { void (window as BxWidgetWindow).bx?.tray?.getPinned?.().then(setPinned) }, [])

  useEffect(() => {
    const interactiveSelector = '.bix-character,.bix-pin-controls,.bix-speech,.bix-reminder-actions,.bix-fan,.bix-panel,.bix-intro,.bix-unequip-all,.bix-resize-handle'
    const syncClickThrough = (event: MouseEvent) => {
      const target = event.target
      const isInteractive = target instanceof Element && !!target.closest(interactiveSelector)
      setClickThrough(!isInteractive)
    }
    window.addEventListener('mousemove', syncClickThrough, true)
    return () => window.removeEventListener('mousemove', syncClickThrough, true)
  }, [setClickThrough])

  useEffect(() => () => {
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current)
    void (window as BxWidgetWindow).bx?.tray?.setClickThrough?.(true)
  }, [])

  useEffect(() => {
    const tray = (window as BxWidgetWindow).bx?.tray
    if (!panel || panel === 'menu') {
      return
    }

    // Высота зависит от реального содержимого, а не от заранее выбранной
    // величины. Поэтому у переводчика, утилит, сундука и гардероба не
    // появляется лишний внутренний скролл на обычном высоком мониторе.
    let frame = 0
    const resizeToContent = () => {
      const element = panelRef.current
      if (!element) return
      // Внизу оставляем 220px под Бикса, сверху 12px воздуха и ещё 2px
      // под границу панели. Если резерв меньше, последний ряд Домика и других
      // карточек остаётся во внутреннем скролле даже на высоком мониторе.
      const requestedHeight = widgetHeightForPanel(element.scrollHeight)
      void tray?.resizeWidget?.(540, requestedHeight)
    }
    const scheduleResize = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(resizeToContent)
    }
    // Не наблюдаем изменение самой высоты панели: ручной resize окна меняет
    // max-height и иначе сразу провоцировал бы обратный программный resize.
    // Все изменения содержимого перечислены в зависимостях эффекта ниже.
    scheduleResize()
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [panel, collection.catalog.length, collection.inventory.length, collection.achievementCatalog.length, collectionLoading, wardrobeSection, translationResult.length, translationPlain.length, translationHistory.length, aiMessages.length, cacheScan?.entries.length, onecProcesses.length, utilityStatus])

  useEffect(() => {
    if (activity === 'idle') return
    const longCycle = activity === 'working' || activity === 'thinking' || activity === 'ai-wait' || activity === 'translation'
    const timer = window.setTimeout(() => setActivity('idle'), longCycle ? 8_000 : 4_500)
    return () => window.clearTimeout(timer)
  }, [activity])

  useEffect(() => {
    if (!reminder) {
      notifiedReminderRef.current = null
      return
    }
    const reminderKey = `${reminder.id}:${reminder.date}`
    if (settings.notificationsEnabled === false || isWithinQuietHours(settings) || notifiedReminderRef.current === reminderKey) return
    notifiedReminderRef.current = reminderKey
    const body = settings.privateReminders ? 'Есть задача, требующая внимания.' : `Пора заняться: ${reminder.title}`
    void (window as BxWidgetWindow).bx?.tray?.showNotification?.('BX — напоминание', body, '/planner')
  }, [reminder, settings.notificationsEnabled, settings.privateReminders, settings.quietHours, settings.quietFrom, settings.quietTo])

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

  useEffect(() => { setSpeechVisible(Boolean(message)) }, [message])

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
        .select('id, title, date, type, reminder_at')
        .eq('user_id', user.id)
        .in('type', ['task', 'tax_deadline'])
        .neq('status', 'done')
        .lte('date', todayISO())
        .order('date', { ascending: true })
        .limit(20)
      // Задача с заданным временем не должна тревожить с утра: показываем её
      // только когда действительно наступил reminder_at. Для задач без времени
      // сохраняем привычное напоминание в день срока.
      const next = data?.find(item => !item.reminder_at || Date.parse(item.reminder_at) <= Date.now()) as BixReminder | undefined
      setReminder(current => {
        if (next?.id && next.id !== current?.id) setReminderPhrase(pickPhrase(BIX_PHRASES.reminder))
        if (!next) setReminderPhrase('')
        return next ?? null
      })
    }
    void refreshReminder()
    const timer = window.setInterval(() => void refreshReminder(), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: companyRows }, { data: chat }] = await Promise.all([
        supabase.from('bx_companies').select('id, name').order('created_at', { ascending: true }),
        supabase.from('bx_ai_chats').select('id').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (cancelled) return
      setCompanies((companyRows ?? []) as WidgetCompany[])
      if (!chat?.id) return
      const { data: history } = await supabase.from('bx_ai_messages').select('role, content').eq('chat_id', chat.id).order('created_at', { ascending: true }).limit(40)
      if (cancelled) return
      const shared = (history ?? []).filter(item => item.role === 'user' || item.role === 'assistant') as Array<{ role: 'user' | 'assistant'; content: string }>
      setWidgetChatId(chat.id)
      setAiMessages(shared)
      setAiAnswer(shared.filter(item => item.role === 'assistant').at(-1)?.content || '')
    })()
    return () => { cancelled = true }
  }, [])

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
    if (!error && data) {
      const next = data as BixCollection
      setCollection(next)
      if (next.companion) setBix(stateFromRemote(next.companion))
    }
    setCollectionLoading(false)
  }, [])

  useEffect(() => { void refreshCollection() }, [refreshCollection])

  const flushBixEconomy = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const synced = await syncBixEconomyQueue(async (operationId, operationType) => {
      const { data, error } = await supabase.rpc('bx_apply_bix_operation', {
        p_operation_id: operationId,
        p_operation_type: operationType,
      })
      return { data: data as Awaited<ReturnType<typeof syncBixEconomyQueue>>['results'][number] | null, error }
    }, user.id)
    if (synced.latestState) setBix(stateFromRemote(synced.latestState))
    if (synced.results.length) await refreshCollection()
    return synced
  }, [refreshCollection])

  useEffect(() => {
    const flush = () => { void flushBixEconomy() }
    flush()
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [flushBixEconomy])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        setCollection(EMPTY_COLLECTION)
        return
      }
      if (event === 'SIGNED_IN') {
        window.setTimeout(() => {
          void flushBixEconomy()
          void refreshCollection()
        }, 0)
      }
    })
    return () => subscription.unsubscribe()
  }, [flushBixEconomy, refreshCollection])

  useEffect(() => {
    if (panel === 'achievements') void refreshCollection()
  }, [panel, refreshCollection])

  const claimDaily = useCallback(async () => {
    const today = todayISO()
    if (bix.lastDailyClaim === today) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setMessage('Войдите в BX, чтобы получать ежедневные подарки.'); return }
    const reward = DAILY_COINS[plan]
    const operation = makeBixEconomyOperation('daily_claim', session.user.id)
    enqueueBixEconomyOperation(operation)
    const synced = await flushBixEconomy()
    const stillPending = synced?.pending.some(item => item.id === operation.id) ?? true
    if (stillPending) setBix(value => ({ ...value, coins: value.coins + reward, lastDailyClaim: today }))
    setMessage(reward ? pickPhrase(BIX_PHRASES.dailyGift).replace('{coins}', String(reward)) : pickPhrase(BIX_PHRASES.dailyFree))
  }, [bix.lastDailyClaim, flushBixEconomy, plan])

  const toggleMenu = () => {
    if (panel !== 'menu') void claimDaily()
    setPanel(value => value === 'menu' ? null : 'menu')
  }

  const dismissIntro = () => {
    localStorage.setItem(BIX_INTRO_KEY, '1')
    setIntroOpen(false)
    setMessage(pickPhrase(BIX_PHRASES.introduction))
  }
  const dockToTaskbar = async () => {
    await (window as BxWidgetWindow).bx?.tray?.dockToTaskbar?.()
    const nextPinned = await (window as BxWidgetWindow).bx?.tray?.setPinned?.(true)
    setPinned(nextPinned !== false)
    setMessage(pickPhrase(BIX_PHRASES.docked))
  }
  const togglePinned = async () => {
    const next = !pinned
    const value = await (window as BxWidgetWindow).bx?.tray?.setPinned?.(next)
    setPinned(value ?? next)
    setMessage(next ? pickPhrase(BIX_PHRASES.pinned) : pickPhrase(BIX_PHRASES.hidden))
  }
  const translateInline = async () => {
    if (!translationText.trim() || translating) return
    setTranslating(true); setTranslationResult(''); setTranslationPlain(''); setActivity('translation')
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
      setMessage(pickPhrase(BIX_PHRASES.translated)); setActivity('success')
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
  const checkEimzoFromWidget = async () => {
    setUtilityBusy(true); setActivity('working'); setUtilityStatus('Проверяю локальную службу E-Imzo…')
    try {
      await fetch('http://localhost:64443', { mode: 'no-cors', signal: AbortSignal.timeout(2_500) })
      setUtilityStatus('E-Imzo отвечает на локальном порту 64443. Служба готова к работе.'); setActivity('success')
    } catch {
      setUtilityStatus('E-Imzo не отвечает. Запустите локальную службу и повторите проверку.'); setActivity('error')
    } finally { setUtilityBusy(false) }
  }
  const resetSelectedSiteCache = async () => {
    const session = (window as BxWidgetWindow).bx?.siteSession
    if (!session?.reset || !siteUrl.trim()) return
    setUtilityBusy(true); setActivity('working'); setUtilityStatus('Очищаю кэш только выбранного сайта…')
    try {
      const result = await session.reset(siteUrl.trim(), 'cache')
      if (!result.success) throw new Error(result.error || 'Не удалось очистить кэш сайта.')
      setUtilityStatus(result.message || 'Кэш выбранного сайта очищен, авторизация сохранена.'); setActivity('success')
    } catch (error) {
      setUtilityStatus(error instanceof Error ? error.message : 'Не удалось очистить кэш сайта.'); setActivity('error')
    } finally { setUtilityBusy(false) }
  }
  const openSelectedSite = async () => {
    const session = (window as BxWidgetWindow).bx?.siteSession
    if (!session?.open || !siteUrl.trim()) return
    setUtilityBusy(true)
    try {
      const result = await session.open(siteUrl.trim())
      setUtilityStatus(result.message || result.error || 'Сайт открыт в безопасном окне BX.')
      setActivity(result.success ? 'success' : 'error')
    } finally { setUtilityBusy(false) }
  }
  const loadRates = async () => {
    const getRates = (window as BxWidgetWindow).bx?.widgets?.getRates
    if (!getRates || ratesLoading) return
    setRatesLoading(true); setActivity('working')
    try { setRates(await getRates(['USD', 'EUR', 'RUB', 'CNY', 'KZT'])); setActivity('success') }
    catch { setMessage(pickPhrase(BIX_PHRASES.error)); setActivity('error') }
    finally { setRatesLoading(false) }
  }
  const choose = (action: typeof ACTIONS[number]) => {
    if (action.route) { openApp(action.route); setPanel(null); return }
    if (action.id === 'currency') void loadRates()
    setPanel(action.id as Panel)
  }
  const askBix = async () => {
    const question = aiQuestion.trim()
    if (!question || askingAi) return
    setAskingAi(true); setAiAnswer(''); setActivity('ai-wait')
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
      if (user && chatId) await supabase.from('bx_ai_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId)
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
      const question = aiMessages.filter(item => item.role === 'user').at(-1)?.content || '—'
      const labels: Record<AccuracyKind, string> = { fact: 'Ошибка в факте или расчёте', outdated: 'Устаревшая информация', unclear: 'Непонятный ответ', unsafe: 'Рискованная рекомендация', other: 'Другое' }
      const body = [
        'ЗАПРОС НА ПРОВЕРКУ ОТВЕТА BX',
        `Тип: ${labels[accuracyKind]}`,
        `Chat ID: ${widgetChatId || '—'}`,
        `Комментарий пользователя: ${accuracyDetails.trim() || '—'}`,
        `Ожидаемый ответ или исправление: ${accuracyExpected.trim() || '—'}`,
        `Вопрос:\n${question}`,
        `Ответ BX:\n${aiAnswer}`,
      ].join('\n\n')
      const { data: ticket, error } = await supabase.from('bx_tickets').insert({ user_id: user.id, subject: `[AI] ${labels[accuracyKind]}`, category: 'ai_accuracy' }).select('id').single()
      if (error || !ticket) throw error || new Error('Не удалось создать обращение.')
      const { error: messageError } = await supabase.from('bx_ticket_messages').insert({ ticket_id: ticket.id, user_id: user.id, author: 'user', body })
      if (messageError) throw messageError
      setAccuracyDetails(''); setAccuracyExpected(''); setPanel('ai')
      setMessage('Отправил отдельный запрос администраторам на проверку. Спасибо!'); setActivity('success')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось отправить проверку.'); setActivity('error') }
    finally { setReportingAi(false) }
  }
  const useCare = async (kind: 'food' | 'mood') => {
    if (bix.coins < 2) { setMessage('Сначала накопим ещё немного монет.'); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setMessage('Войдите в BX, чтобы состояние Бикса синхронизировалось.'); return }
    setActivity('working')
    const operation = makeBixEconomyOperation(kind === 'food' ? 'care_food' : 'care_toy', session.user.id)
    enqueueBixEconomyOperation(operation)
    const synced = await flushBixEconomy()
    const result = synced?.results.at(-1)
    if (result?.error === 'not_enough_coins') {
      setMessage('На серверном балансе пока не хватает монет. Состояние Бикса обновлено.')
      setActivity('error')
      return
    }
    const stillPending = synced?.pending.some(item => item.id === operation.id) ?? true
    if (stillPending) {
      setBix(value => ({
        ...value,
        coins: value.coins - 2,
        needs: kind === 'food'
          ? { ...value.needs, food: Math.min(100, value.needs.food + 35) }
          : { ...value.needs, mood: Math.min(100, value.needs.mood + 25) },
      }))
    }
    setMessage(kind === 'food' ? 'Мр-р. Спасибо за угощение!' : 'Поиграли — настроение на высоте!'); setActivity(kind === 'food' ? 'feeding' : 'playing')
  }
  const buyOrEquip = async (item: BixCatalogItem) => {
    if (collectionLoading) return
    const owned = collection.inventory.find(entry => entry.sku === item.sku)
    setCollectionLoading(true)
    const result = owned?.equipped
      ? await supabase.rpc('bx_unequip_bix_item', { p_sku: item.sku })
      : owned
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
    setMessage(owned?.equipped
      ? `${item.title} снят с Бикса.`
      : owned
        ? `${item.title} теперь на Биксе.`
        : `${item.title} добавлен в Сундук.`)
  }
  const unequipAll = async () => {
    const equipped = collection.inventory.filter(entry => entry.equipped)
    if (!equipped.length || collectionLoading) return
    setCollectionLoading(true)
    let latest: BixCollection | null = null
    for (const entry of equipped) {
      const result = await supabase.rpc('bx_unequip_bix_item', { p_sku: entry.sku })
      if (result.error || !result.data) {
        setCollectionLoading(false)
        setMessage(result.error?.message || 'Не все вещи удалось снять. Проверьте подключение и попробуйте ещё раз.')
        setActivity('error')
        return
      }
      latest = result.data as BixCollection
    }
    setCollectionLoading(false)
    if (latest) setCollection(latest)
    setMessage('Бикс снова в базовом образе.')
    setActivity('success')
  }
  const equippedVisuals = useMemo(() => new Set<string>(collection.inventory
    .filter(item => item.equipped)
    .map(item => collection.catalog.find(catalogItem => catalogItem.sku === item.sku)?.visual_key)
    .filter((visualKey): visualKey is string => Boolean(visualKey))), [collection])
  const selectedOutfit = equippedVisuals.has('business') ? 'business' : equippedVisuals.has('analyst') ? 'analyst' : equippedVisuals.has('night') ? 'night' : null
  const selectedHat = [...equippedVisuals].find(visualKey => visualKey in HAT_VISUALS)
  const selectedHatSource = selectedHat ? HAT_VISUALS[selectedHat] : null
  const mascotSource = selectedOutfit ? WARDROBE_VISUALS[selectedOutfit] : bixMascot
  const ownedSkus = useMemo(() => new Set(collection.inventory.map(item => item.sku)), [collection.inventory])
  const wardrobeItems = useMemo(() => collection.catalog.filter(item => {
    if (ownedSkus.has(item.sku)) return false
    return wardrobeSection === 'outfits' ? item.category === 'outfit' : item.category !== 'outfit'
  }), [collection.catalog, ownedSkus, wardrobeSection])
  const chestItems = useMemo(() => collection.catalog.filter(item => ownedSkus.has(item.sku)), [collection.catalog, ownedSkus])
  const chestOutfits = useMemo(() => chestItems.filter(item => item.category === 'outfit'), [chestItems])
  const chestAccessories = useMemo(() => chestItems.filter(item => item.category !== 'outfit'), [chestItems])
  const achievementProgress = useMemo(() => new Map(collection.achievementProgress.map(item => [item.code, item])), [collection.achievementProgress])
  const renderCollectionCard = (item: BixCatalogItem, location: 'wardrobe' | 'chest') => {
    const owned = collection.inventory.find(entry => entry.sku === item.sku)
    const equipped = owned?.equipped
    const locked = location === 'wardrobe' && (item.plan_required === 'standard' && plan === 'free' || item.plan_required === 'premium' && plan !== 'premium')
    const preview = WARDROBE_VISUALS[item.visual_key] || HAT_VISUALS[item.visual_key]
    const type = item.category === 'outfit' ? 'образ Бикса' : item.category === 'headwear' ? 'головной убор' : 'аксессуар'
    const action = locked ? `${item.plan_required}+` : location === 'wardrobe' ? `${item.price} ●` : equipped ? 'снять' : 'надеть'
    return <button key={item.sku} className={`bix-wardrobe-card${equipped ? ' equipped' : ''}`} disabled={locked || collectionLoading} onClick={() => void buyOrEquip(item)}>
      {preview ? <img src={preview} alt="" /> : <span className="bix-wardrobe-icon">{WARDROBE_ICONS[item.visual_key] || '✦'}</span>}
      <span className="bix-wardrobe-card-copy"><b>{item.title}</b><small>{type}</small></span>
      <strong>{action}</strong>
    </button>
  }
  const bixMode = activity !== 'idle' ? activity : reminder ? 'reminding' : panel ? 'engaged' : idleJoke ? 'joking' : bix.needs.energy < 25 ? 'sleepy' : bix.needs.food < 25 || bix.needs.mood < 25 ? 'concerned' : 'idle'
  // В 2.31.18 используем только цельные статичные PNG. Подготовленные
  // загрузчики кадров остаются для будущего возвращения анимаций.
  const currentBixFrame = mascotSource
  const equippedItemCount = collection.inventory.filter(item => item.equipped).length
  const saveDraft = async (kind: 'task' | 'note') => {
    const text = draft.trim()
    if (!text || saving) return
    setSaving(true); setActivity('working')
    try {
      if (kind === 'task') {
        const reminderAt = taskReminderAt(taskDate || todayISO(), taskTime, taskReminderLead)
        const task = await createCanonicalEvent({
          company_id: taskCompanyId || null,
          type: 'task', title: text, date: taskDate || todayISO(), due_date: taskDate || todayISO(),
          status: 'todo', priority: taskPriority, note: taskNote.trim() || null, reminder_at: reminderAt, recurrence: taskRecurrence, source: 'manual',
        })
        if (!task) throw new Error('Не удалось сохранить задачу. Проверьте подключение и вход в BX.')
        setMessage(pickPhrase(BIX_PHRASES.taskSaved))
      } else {
        const current = (() => { try { return JSON.parse(localStorage.getItem(QUICK_NOTES_KEY) || '[]') } catch { return [] } })()
        localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify([{ id: uid(), text, createdAt: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), pinned: false }, ...current]))
        setMessage(pickPhrase(BIX_PHRASES.noteSaved))
      }
      setDraft(''); setTaskNote(''); setTaskTime(''); setTaskPriority('normal'); setTaskRecurrence(null); setTaskReminderLead('at-time'); setPanel(null); setActivity(kind === 'task' ? 'task-done' : 'success')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить. Попробуйте ещё раз.'); setActivity('error')
    } finally { setSaving(false) }
  }
  const finishReminder = async () => {
    if (!reminder) return
    const { error } = await supabase.from('bx_events').update({ status: 'done' }).eq('id', reminder.id)
    if (error) { setMessage('Не удалось завершить задачу. Попробуйте ещё раз.'); setActivity('error'); return }
    emitPlannerReload(); setMessage('Готово. Отличная работа!'); setReminder(null); setActivity('task-done')
  }
  const snoozeReminder = async () => {
    if (!reminder) return
    const reminderAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const { error } = await supabase.from('bx_events').update({ reminder_at: reminderAt }).eq('id', reminder.id)
    if (error) { setMessage('Не получилось отложить. Попробуйте ещё раз.'); setActivity('error'); return }
    emitPlannerReload(); setMessage('Хорошо, напомню через 15 минут.'); setReminder(null)
  }

  const reminderText = reminder ? (settings.privateReminders ? reminderPhrase || 'Есть задача, требующая внимания.' : `${reminderPhrase || 'Напоминание:'}\n${reminder.title}`) : idleJoke || (speechVisible ? message : null)
  return <main className={`bix-widget bix-state-${bixMode}${settings.reducedMotion ? ' bix-reduced-motion' : ''}`} onMouseDown={event => { if (event.target === event.currentTarget) setPanel(null) }}>
    <div className="bix-resize-handle bix-resize-n" aria-hidden="true" />
    <div className="bix-resize-handle bix-resize-e" aria-hidden="true" />
    <div className="bix-resize-handle bix-resize-s" aria-hidden="true" />
    <div className="bix-resize-handle bix-resize-w" aria-hidden="true" />
    <div className="bix-resize-handle bix-resize-ne" aria-hidden="true" />
    <div className="bix-resize-handle bix-resize-se" aria-hidden="true" />
    <div className="bix-resize-handle bix-resize-sw" aria-hidden="true" />
    <div className="bix-resize-handle bix-resize-nw" aria-hidden="true" />
    {panel === 'menu' && <section className="bix-fan" aria-label="Действия Бикса">
      {ACTIONS.map((action, index) => <button key={action.id} className={`bix-action bix-action-${index}`} onClick={() => choose(action)}>
        <b>{action.icon}</b><span>{action.label}</span>
      </button>)}
      <button className="bix-home-button" onClick={() => setPanel('home')}><b>♟</b><span>Домик Бикса</span></button>
    </section>}

    {introOpen && <section className="bix-intro" aria-label="Знакомство с Биксом">
      <span>BX.UZ · ПОМОЩНИК</span><h2>Привет, я Бикс.</h2><p>Буду рядом с панелью задач, напомню о делах и помогу начать работу быстрее.</p>
      <button className="bix-primary" onClick={dismissIntro}>Познакомиться</button>
    </section>}

    {panel && panel !== 'menu' && <section ref={panelRef} className="bix-panel" style={{ transform: `translate3d(${panelOffset.x}px, ${panelOffset.y}px, 0)` }}>
      <div className="bix-panel-drag" aria-hidden="true" onPointerDown={beginPanelDrag} onPointerMove={movePanel} onPointerUp={endPanelDrag} onPointerCancel={endPanelDrag}><span>⠿⠿</span> Перетащить карточку · размер меняется за край окна</div>
      <button className="bix-panel-close" onClick={() => setPanel(null)} aria-label="Закрыть">×</button>
      {panel === 'ai' && <><small>СПРОСИТЬ БИКСА</small><h2>Общая история BX.</h2><p className="bix-panel-hint">Здесь отображается последний диалог основного AI-консультанта. Новые ответы сохраняются в ту же историю.</p>{aiMessages.length > 0 && <div className="bix-ai-history">{aiMessages.map((item, index) => <p key={`${item.role}-${index}`} className={`bix-ai-message ${item.role}`}>{item.content}</p>)}</div>}<textarea value={aiQuestion} onChange={event => setAiQuestion(event.target.value)} placeholder="Например: что проверить перед сдачей отчёта?" autoFocus /><button className="bix-primary" disabled={!aiQuestion.trim() || askingAi} onClick={() => void askBix()}>{askingAi ? 'Думаю…' : 'Спросить'}</button>{aiAnswer && <div className="bix-inline-actions"><button onClick={() => setPanel('accuracy')}>Сообщить о неточности</button></div>}<div className="bix-inline-actions"><button onClick={() => openApp('/ai')}>Открыть полный диалог ↗</button></div></>}
      {panel === 'accuracy' && <><small>ПРОВЕРКА ОТВЕТА BX</small><h2>Что именно неточно?</h2><p className="bix-panel-hint">Вопрос и ответ прикладываются автоматически. Обращение попадёт в отдельную очередь AI-проверок у администраторов.</p><label className="bix-field">Тип неточности<select value={accuracyKind} onChange={event => setAccuracyKind(event.target.value as AccuracyKind)}><option value="fact">Ошибка в факте или расчёте</option><option value="outdated">Устаревшая информация</option><option value="unclear">Непонятный ответ</option><option value="unsafe">Рискованная рекомендация</option><option value="other">Другое</option></select></label><label className="bix-field">Что показалось неверным<textarea value={accuracyDetails} onChange={event => setAccuracyDetails(event.target.value)} placeholder="Опишите конкретную фразу или расчёт…" autoFocus /></label><label className="bix-field">Как должно быть, если знаете<textarea value={accuracyExpected} onChange={event => setAccuracyExpected(event.target.value)} placeholder="Необязательно" /></label><div className="bix-inline-actions"><button onClick={() => setPanel('ai')}>Назад</button><button className="accent" disabled={!accuracyDetails.trim() || reportingAi} onClick={() => void reportAiAnswer()}>{reportingAi ? 'Отправляю…' : 'Отправить на проверку'}</button></div></>}
      {panel === 'task' && <><small>РАСШИРЕННАЯ ЗАДАЧА</small><h2>Что и когда сделать?</h2><textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Например: сверить первичку" autoFocus /><div className="bix-task-fields"><label>Срок<input type="date" value={taskDate} onChange={event => setTaskDate(event.target.value)} /></label><label>Время<input type="time" value={taskTime} onChange={event => setTaskTime(event.target.value)} /></label><label>Компания<select value={taskCompanyId} onChange={event => setTaskCompanyId(event.target.value)}><option value="">Личная задача</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label>Приоритет<select value={taskPriority} onChange={event => setTaskPriority(event.target.value as 'low' | 'normal' | 'high')}><option value="low">Низкий</option><option value="normal">Обычный</option><option value="high">Высокий</option></select></label><label>Повторение<select value={taskRecurrence || 'none'} onChange={event => setTaskRecurrence(event.target.value === 'none' ? null : event.target.value as Exclude<EventRecurrence, null>)}><option value="none">Не повторять</option><option value="weekly">Каждую неделю</option><option value="monthly">Каждый месяц</option><option value="quarterly">Каждый квартал</option><option value="yearly">Каждый год</option></select></label><label>Напоминание<select value={taskReminderLead} onChange={event => setTaskReminderLead(event.target.value as ReminderLead)}><option value="none">Не напоминать</option><option value="at-time">В срок</option><option value="15m">За 15 минут</option><option value="1h">За час</option><option value="1d">За день</option></select></label></div><textarea className="bix-task-note" value={taskNote} onChange={event => setTaskNote(event.target.value)} placeholder="Комментарий или детали (необязательно)" /><button className="bix-primary" disabled={saving} onClick={() => void saveDraft('task')}>{saving ? 'Сохраняю…' : 'Добавить задачу'}</button></>}
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
      {panel === 'currency' && <><small>КУРСЫ ЦБ РУЗ</small><h2>Валюты прямо в виджете.</h2><div className="bix-rates">{ratesLoading ? <p>Обновляю курсы…</p> : rates.map(rate => <article key={rate.code}><span>{rate.flag}</span><div><b>{rate.code}</b><small>{rate.date}</small></div><strong>{rate.value.toLocaleString('ru-RU')}</strong><em className={rate.diff >= 0 ? 'up' : 'down'}>{rate.diff >= 0 ? '+' : ''}{rate.diff.toLocaleString('ru-RU')}</em></article>)}</div><div className="bix-inline-actions"><button onClick={() => void loadRates()}>Обновить</button><button onClick={() => openApp('/currency')}>Полный раздел ↗</button></div></>}
      {panel === 'tools' && <><small>УТИЛИТЫ BX</small><h2>Быстрые действия здесь</h2><p className="bix-panel-hint">1С, E-Imzo и кэш выбранного сайта работают внутри карточки. Очистка сайта не затрагивает другие домены и сохраняет авторизацию.</p><div className="bix-quick-tools"><button disabled={utilityBusy} onClick={() => void scanCacheFromWidget()}>🧹 Проверить кэш 1С</button>{cacheScan?.entries.length ? <button disabled={utilityBusy} className="accent" onClick={() => void cleanCacheFromWidget()}>Очистить {cacheScan.entries.length} папок</button> : null}<button disabled={utilityBusy} onClick={() => void scanProcessesFromWidget()}>⚡ Процессы 1С</button>{onecProcesses.length ? <button disabled={utilityBusy} className="danger" onClick={() => void stopProcessesFromWidget()}>Завершить {onecProcesses.length} процессов</button> : null}<button disabled={utilityBusy} onClick={() => void checkEimzoFromWidget()}>🔏 Проверить E-Imzo</button></div><section className="bix-site-cache"><b>Кэш выбранного сайта</b><input value={siteUrl} onChange={event => setSiteUrl(event.target.value)} placeholder="https://my.soliq.uz" /><div className="bix-inline-actions"><button disabled={utilityBusy || !siteUrl.trim()} onClick={() => void openSelectedSite()}>Открыть в BX</button><button className="accent" disabled={utilityBusy || !siteUrl.trim()} onClick={() => void resetSelectedSiteCache()}>Очистить кэш</button></div></section>{utilityStatus && <p className="bix-utility-status">{utilityStatus}</p>}<div className="bix-tools">{TOOL_ACTIONS.slice(2).filter(([label]) => !label.includes('E‑Imzo')).map(([label, route]) => <button key={label} onClick={() => { openApp(route); setPanel(null) }}><span>{label}</span><b>Полный режим ↗</b></button>)}</div></>}
      {panel === 'home' && <><div className="bix-home-head"><div><small>ДОМИК БИКСА · {plan}</small><h2>{bix.coins} <em>монет</em></h2></div><span className="bix-coin">●</span></div><div className="bix-needs">{[['Сытость', bix.needs.food], ['Настроение', bix.needs.mood], ['Энергия', bix.needs.energy]].map(([label, value]) => <label key={String(label)}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></label>)}</div><div className="bix-care"><button onClick={() => void useCare('food')}>🥣<span>Корм</span><small>2 ●</small></button><button onClick={() => void useCare('mood')}>🧶<span>Игрушка</span><small>2 ●</small></button><button onClick={() => setPanel('wardrobe')}>♜<span>Гардероб</span><small>{collection.catalog.length - chestItems.length || '—'} в магазине</small></button><button onClick={() => setPanel('chest')}>◈<span>Сундук</span><small>{chestItems.length} куплено</small></button><button onClick={() => setPanel('achievements')}>★<span>Достижения</span><small>{collection.achievements.length}/{collection.achievementCatalog.length || '—'}</small></button><button onClick={() => setPanel('settings')}>⚙<span>Настройки</span><small>виджет</small></button></div></>}
      {panel === 'wardrobe' && <><small>ГАРДЕРОБ БИКСА</small><h2>Магазин образов.</h2><p className="bix-panel-hint">Покупка сразу отправляет вещь в Сундук. Там её можно надеть или снять с Бикса.</p><div className="bix-wardrobe-toolbar"><span>{collection.catalog.length ? `${collection.catalog.length - chestItems.length} доступно в магазине` : 'Войдите в BX, чтобы загрузить гардероб'}</span><button onClick={() => void refreshCollection()} disabled={collectionLoading}>↻ Обновить</button></div>{collection.catalog.length ? <><div className="bix-wardrobe-tabs" role="tablist" aria-label="Раздел гардероба"><button role="tab" aria-selected={wardrobeSection === 'outfits'} className={wardrobeSection === 'outfits' ? 'active' : ''} onClick={() => setWardrobeSection('outfits')}>Образы Бикса</button><button role="tab" aria-selected={wardrobeSection === 'accessories'} className={wardrobeSection === 'accessories' ? 'active' : ''} onClick={() => setWardrobeSection('accessories')}>Аксессуары и шляпы</button></div>{wardrobeItems.length ? <div className="bix-wardrobe-grid">{wardrobeItems.map(item => renderCollectionCard(item, 'wardrobe'))}</div> : <p className="bix-wardrobe-empty">Все вещи этого раздела уже лежат в Сундуке.</p>}</> : <p className="bix-wardrobe-empty">Гардероб загрузится после входа в BX.</p>}</>}
      {panel === 'chest' && <><small>СУНДУК БИКСА</small><h2>Купленные вещи.</h2><p className="bix-panel-hint">Здесь хранится всё, что уже куплено. Нажмите на вещь, чтобы надеть её; на надетую — чтобы снять.</p><div className="bix-wardrobe-toolbar"><span>{chestItems.length ? `${chestItems.length} вещей в Сундуке` : 'Сундук пока пуст'}</span><span className="bix-wardrobe-actions"><button onClick={() => void refreshCollection()} disabled={collectionLoading}>↻ Обновить</button>{equippedItemCount > 0 && <button className="bix-wardrobe-reset" onClick={() => void unequipAll()} disabled={collectionLoading}>Снять всё</button>}</span></div>{chestItems.length ? <div className="bix-chest-sections">{chestOutfits.length > 0 && <section><h3>Образы Бикса</h3><div className="bix-wardrobe-grid">{chestOutfits.map(item => renderCollectionCard(item, 'chest'))}</div></section>}{chestAccessories.length > 0 && <section><h3>Аксессуары и шляпы</h3><div className="bix-wardrobe-grid">{chestAccessories.map(item => renderCollectionCard(item, 'chest'))}</div></section>}</div> : <p className="bix-wardrobe-empty">Купите первый образ или шляпу в Гардеробе — вещь появится здесь.</p>}</>}
      {panel === 'achievements' && <><small>ДОСТИЖЕНИЯ БИКСА</small><h2>Награды за реальные дела.</h2><p className="bix-panel-hint">Прогресс считается на сервере по задачам, завершённым делам, вопросам AI, коллекции и заботе о Биксе. Награда начисляется только один раз.</p><div className="bix-achievement-summary"><strong>{collection.achievements.length}/{collection.achievementCatalog.length}</strong><span>получено</span><button onClick={() => void refreshCollection()} disabled={collectionLoading}>↻ Проверить</button></div><div className="bix-achievement-list">{collection.achievementCatalog.map(item => { const unlocked = collection.achievements.includes(item.code); const progress = achievementProgress.get(item.code); const value = Math.min(progress?.value || 0, item.target); return <article key={item.code} className={unlocked ? 'unlocked' : ''}><span className="bix-achievement-icon">{unlocked ? '★' : '☆'}</span><div><b>{item.title}</b><p>{item.description}</p><i><span style={{ width: `${Math.min(100, value / item.target * 100)}%` }} /></i><small>{unlocked ? 'Получено' : `${value}/${item.target}`} · +{item.rewardCoins} монет</small></div></article> })}</div></>}
      {panel === 'settings' && <><small>НАСТРОЙКИ БИКСА</small><h2>Тихо, бережно, по делу.</h2><div className="bix-settings"><label><span>Шутки</span><input type="checkbox" checked={settings.jokesEnabled} onChange={event => setSettings(value => ({ ...value, jokesEnabled: event.target.checked }))} /></label><label><span>Частота шуток</span><select value={settings.jokeFrequency} disabled={!settings.jokesEnabled} onChange={event => setSettings(value => ({ ...value, jokeFrequency: event.target.value as JokeFrequency }))}><option value="often">часто — раз в 2 минуты</option><option value="normal">обычно — раз в 5 минут</option><option value="rare">редко — раз в 10 минут</option></select></label><label><span>Уведомления Windows</span><input type="checkbox" checked={settings.notificationsEnabled !== false} onChange={event => setSettings(value => ({ ...value, notificationsEnabled: event.target.checked }))} /></label><label><span>Тихие часы</span><input type="checkbox" checked={settings.quietHours} onChange={event => setSettings(value => ({ ...value, quietHours: event.target.checked }))} /></label>{settings.quietHours && <label className="bix-setting-time"><span>Не беспокоить</span><input type="time" value={settings.quietFrom} onChange={event => setSettings(value => ({ ...value, quietFrom: event.target.value }))} /><b>—</b><input type="time" value={settings.quietTo} onChange={event => setSettings(value => ({ ...value, quietTo: event.target.value }))} /></label>}<label><span>Скрывать названия задач</span><input type="checkbox" checked={settings.privateReminders} onChange={event => setSettings(value => ({ ...value, privateReminders: event.target.checked }))} /></label></div><p className="bix-settings-note">Бикс временно использует статичные образы. Анимации вернутся отдельным обновлением. Системный режим Windows «Не беспокоить» пока не считывается автоматически.</p></>}
    </section>}

    {reminderText && <div className="bix-speech" aria-live="polite" onMouseEnter={() => setSpeechHovered(true)} onMouseLeave={() => setSpeechHovered(false)}>{reminderText}</div>}
    {reminder && <div className="bix-reminder-actions">
      <button onClick={() => void finishReminder()}>Готово</button>
      <button onClick={() => void snoozeReminder()}>15 мин</button>
      <button onClick={() => openApp('/planner')}>Открыть</button>
    </div>}
    <button className="bix-character" onClick={toggleMenu} onMouseEnter={showPinControls} onMouseLeave={schedulePinControlsHide} aria-label="Открыть действия Бикса">
      <span className="bix-drag" title="Перетащите Бикса за голову" />
      <img className="bix-mascot bix-frame bix-current-frame" src={currentBixFrame} alt={`Бикс: ${bixMode}`} draggable={false} />
      {selectedHatSource && <img className={`bix-hat bix-hat-${selectedHat}${selectedOutfit ? '' : ' bix-hat-main'}`} src={selectedHatSource} alt="Надетая шляпа Бикса" draggable={false} />}
    </button>
    <div className={`bix-pin-controls${pinControlsVisible ? ' is-visible' : ''}`} onMouseEnter={showPinControls} onMouseLeave={schedulePinControlsHide} aria-label="Управление виджетом"><button onClick={() => void dockToTaskbar()} title="Прикрепить к панели задач">⌖</button><button onClick={() => void togglePinned()} title={pinned ? 'Открепить виджет' : 'Закрепить виджет'}>{pinned ? '📌' : '📍'}</button><button className="bix-move-control" title="Потяните, чтобы переместить Бикса" aria-label="Переместить Бикса">⠿</button></div>
  </main>
}

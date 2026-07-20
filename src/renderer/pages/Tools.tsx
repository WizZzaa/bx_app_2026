import React, { Suspense, useState } from 'react'
import CacheCleaner from './tools/CacheCleaner'
import ProcessKiller from './tools/ProcessKiller'
import DatabaseBackup from './tools/DatabaseBackup'
import PcCleaner from './tools/PcCleaner'
import NetworkChecker from './tools/NetworkChecker'
import EimzoDiag from './tools/EimzoDiag'
import QuickNotes from './tools/QuickNotes'
import NumberToWords from './tools/NumberToWords'
import Transliterate from './tools/Transliterate'
import BankCheck from './tools/BankCheck'
import InnCheckTool from './tools/InnCheckTool'
import EcpManager from './EcpManager'
import ActiveXConfigurator from './tools/ActiveXConfigurator'
import SiteSessionReset from './tools/SiteSessionReset'
import { isElectron } from '../lib/onecApi'
import Icon from '../lib/ui/Icon'
import { UTILITY_PROPOSALS } from '../data/workbenchCatalog'
import { ProposalWorkbench } from '../components/workspace/ProposalWorkbench'
import { useWorkbenchFavorites } from '../lib/useWorkbenchFavorites'
import { WorkbenchActions, WorkbenchCanvas, WorkbenchGuide, WorkbenchModeSwitch, WorkbenchTutorial, type WorkbenchView } from '../components/workspace/WorkbenchChrome'

const PdfCompress = React.lazy(() => import('./tools/PdfCompress'))
const PdfConvert = React.lazy(() => import('./tools/PdfConvert'))
const OcrTool = React.lazy(() => import('./tools/OcrTool'))

const lazyTool = (tool: React.ReactNode) => (
  <Suspense fallback={<div className="px-4 py-8 text-center text-xs font-semibold text-bx-muted">Загрузка инструмента…</div>}>
    {tool}
  </Suspense>
)

interface Tool {
  id: string
  icon: string
  label: string
  group: string
  component: React.ReactNode
  desc: string
  status?: 'ready' | 'proposal'
}

const READY_TOOLS: Tool[] = [
  // 1С
  { id: 'cache',  icon: 'trash', label: 'Очистка кэша 1С',  group: '1С', desc: 'Временные файлы 1С:Предприятие', component: <CacheCleaner /> },
  { id: 'backup', icon: 'save',  label: 'Резервная копия',  group: '1С', desc: 'Бэкап баз данных 1С (.1CD)', component: <DatabaseBackup /> },
  { id: 'killer', icon: 'zap',   label: 'Снятие процессов', group: '1С', desc: 'Завершить зависший 1cv8.exe', component: <ProcessKiller /> },
  // Текст и проверки
  { id: 'inncheck', icon: 'search', label: 'Проверка ИНН', group: 'Текст и проверки', desc: 'Статус, НДС и класс риска по ИНН', component: <InnCheckTool /> },
  { id: 'num2words', icon: 'hash',      label: 'Число прописью',        group: 'Текст и проверки', desc: 'Для договоров и платёжек', component: <NumberToWords /> },
  { id: 'translit',  icon: 'languages', label: 'Транслитерация',        group: 'Текст и проверки', desc: 'Узбек кирилл ↔ латиница (2019)', component: <Transliterate /> },
  { id: 'bankcheck', icon: 'building',  label: 'Проверка счёта и МФО',  group: 'Текст и проверки', desc: 'Р/с 20 цифр + банк по МФО', component: <BankCheck /> },
  // Система
  { id: 'ecp',       icon: 'ecp',      label: 'Сроки сертификатов',  group: 'Система', desc: 'Метаданные, сроки и готовность E-Imzo', component: <EcpManager /> },
  { id: 'activex',   icon: 'settings', label: 'Настройка ActiveX', group: 'Система', desc: 'Авто-настройка IE для банк-клиентов РУз', component: <ActiveXConfigurator /> },
  { id: 'pccleaner', icon: 'monitor',  label: 'Очистка ПК',    group: 'Система', desc: 'TEMP Windows + кэши браузеров', component: <PcCleaner /> },
  { id: 'site-reset', icon: 'globe', label: 'Сброс веб-сервиса', group: 'Система', desc: 'Очистить кэш только выбранного сайта', component: <SiteSessionReset /> },
  { id: 'network',   icon: 'services', label: 'Проверка сети', group: 'Система', desc: 'Доступность госсайтов РУз', component: <NetworkChecker /> },
  { id: 'eimzo',     icon: 'ecp',      label: 'Диагностика E-Imzo', group: 'Система', desc: 'Доступность службы для официальных порталов', component: <EimzoDiag /> },
  // Заметки
  { id: 'notes', icon: 'note', label: 'Быстрые заметки', group: 'Заметки', desc: 'Буфер для текстов и реквизитов', component: <QuickNotes /> },
  // Документы и PDF
  { id: 'pdfcompress', icon: 'recycle', label: 'Сжатие PDF', group: 'Документы и PDF', desc: 'Оптимизация и уменьшение веса PDF файлов', component: lazyTool(<PdfCompress />) },
  { id: 'pdfconvert',  icon: 'exchange', label: 'Конвертер PDF', group: 'Документы и PDF', desc: 'Конвертация PDF в таблицы Excel или тексты Word', component: lazyTool(<PdfConvert />) },
  { id: 'ocr',         icon: 'ai',       label: 'Распознавание текста (OCR)', group: 'Документы и PDF', desc: 'Извлечение текста из сканов и фото (PDF/JPEG) в Word', component: lazyTool(<OcrTool />) },
]

const PROPOSAL_TOOLS: Tool[] = UTILITY_PROPOSALS.map(proposal => ({
  id: proposal.id,
  icon: proposal.icon,
  label: proposal.title,
  group: `${proposal.sector} · идеи`,
  desc: proposal.summary,
  component: <ProposalWorkbench proposal={proposal} />,
  status: 'proposal',
}))

const TOOLS: Tool[] = [...READY_TOOLS, ...PROPOSAL_TOOLS]

const PROPOSAL_SECTOR_COUNTS = UTILITY_PROPOSALS.reduce<Record<string, number>>((counts, proposal) => {
  counts[proposal.sector] = (counts[proposal.sector] ?? 0) + 1
  return counts
}, {})

const GROUPS = ['Текст и проверки', 'Документы и PDF', '1С', 'Система', 'Заметки', 'Общее · идеи', 'Документы и право · идеи', 'Агро · идеи', 'Строительство · идеи']

const ACCENT = Object.fromEntries(GROUPS.map(group => [group, {
  text: 'text-violet-700 dark:text-violet-300',
  chipBg: 'bg-violet-500/10 border-violet-500/20',
  activeBg: 'bg-violet-500/10 border-violet-500/20',
  iconBg: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  grad: 'from-violet-500/[0.07]',
}])) as Record<string, { text: string; chipBg: string; activeBg: string; iconBg: string; grad: string }>

const FULL_HEIGHT_TOOLS = new Set(['notes', 'ecp', 'activex'])

const LAST_TOOL_KEY = 'bx_tools_last'
const TOOLS_VIEW_KEY = 'bx_tools_view'
const TOOLS_TUTORIAL_KEY = 'bx_tools_tutorial_v2'

const Tools = () => {
  const [active, setActiveRaw] = useState(() => {
    const requested = new URLSearchParams(window.location.hash.split('?')[1] || '').get('tool')
    if (requested && TOOLS.some(t => t.id === requested)) return requested
    const last = localStorage.getItem(LAST_TOOL_KEY)
    return last && TOOLS.some(t => t.id === last) ? last : 'inncheck'
  })
  const [search, setSearch] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [catalog, setCatalog] = useState<'ready' | 'proposal'>(() => TOOLS.find(item => item.id === active)?.status === 'proposal' ? 'proposal' : 'ready')
  const [view, setView] = useState<WorkbenchView>(() => localStorage.getItem(TOOLS_VIEW_KEY) === 'guided' ? 'guided' : 'compact')
  const [showGuide, setShowGuide] = useState(() => localStorage.getItem(TOOLS_VIEW_KEY) === 'guided')
  const [tutorialEnabled, setTutorialEnabled] = useState(() => localStorage.getItem(TOOLS_TUTORIAL_KEY) !== 'hidden')
  const [workspaceRevision, setWorkspaceRevision] = useState(0)
  const { favorites, toggleFavorite } = useWorkbenchFavorites('utility')

  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LAST_TOOL_KEY && e.newValue && TOOLS.some(t => t.id === e.newValue)) {
        setActiveRaw(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleSetActive = (id: string) => {
    setActiveRaw(id)
    localStorage.setItem(LAST_TOOL_KEY, id)
  }

  const handleViewChange = (next: WorkbenchView) => {
    setView(next)
    setShowGuide(next === 'guided')
    localStorage.setItem(TOOLS_VIEW_KEY, next)
  }

  const handleCatalogChange = (next: 'ready' | 'proposal') => {
    setSearch('')
    setFavoritesOnly(false)
    setCatalog(next)
    const current = TOOLS.find(item => item.id === active)
    const activeMatches = next === 'proposal' ? current?.status === 'proposal' : current?.status !== 'proposal'
    if (!activeMatches) {
      const nextTool = next === 'proposal' ? PROPOSAL_TOOLS[0] : READY_TOOLS[0]
      if (nextTool) handleSetActive(nextTool.id)
    }
  }

  const toggleTutorial = () => setTutorialEnabled(current => {
    const next = !current
    localStorage.setItem(TOOLS_TUTORIAL_KEY, next ? 'shown' : 'hidden')
    return next
  })

  const q = search.trim().toLowerCase()
  const visible = TOOLS.filter(t =>
    (!q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.group.toLowerCase().includes(q))
    && (!favoritesOnly || favorites.includes(t.id))
    && (catalog === 'proposal' ? t.status === 'proposal' : t.status !== 'proposal'))

  React.useEffect(() => {
    if (visible.length > 0 && !visible.some(item => item.id === active)) {
      const nextId = visible[0].id
      setActiveRaw(nextId)
      localStorage.setItem(LAST_TOOL_KEY, nextId)
    }
  }, [active, catalog, favorites, favoritesOnly, q])

  const tool = TOOLS.find(t => t.id === active) ?? TOOLS[0]
  const a = ACCENT[tool.group]
  const isFullHeight = FULL_HEIGHT_TOOLS.has(tool.id)

  return (
    <div className="z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-bx-bg font-sans text-bx-text lg:flex-row">
      {/* Левая панель — список утилит */}
      <aside className="z-10 flex w-full flex-shrink-0 flex-col overflow-hidden border-b border-bx-border bg-bx-surface lg:w-[280px] lg:border-b-0 lg:border-r 2xl:w-[304px]">
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">Рабочий центр</p>
          <h1 className="mt-1 text-xl font-black text-bx-text">Утилиты</h1>
          <p className="mt-1 text-xs leading-relaxed text-bx-muted">Найдите задачу по действию, затем работайте только в одном выбранном модуле.</p>
        </div>

        <div className="px-4 pb-3 flex-shrink-0">
          <WorkbenchModeSwitch kind="utility" view={view} onViewChange={handleViewChange} />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted">
              <Icon name="search" className="w-3.5 h-3.5" />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Поиск утилиты"
              placeholder="Поиск утилиты..."
              className="mt-2 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg pl-9 pr-3 text-sm font-semibold text-bx-text outline-none placeholder:text-bx-muted focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-bx-border bg-bx-bg p-1" aria-label="Статус утилит">
            <button type="button" onClick={() => handleCatalogChange('ready')} aria-pressed={catalog === 'ready'} className={`min-h-9 rounded-lg px-2 text-[10px] font-bold transition-colors ${catalog === 'ready' ? 'bg-emerald-600 text-white' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}>Работают · {READY_TOOLS.length}</button>
            <button type="button" onClick={() => handleCatalogChange('proposal')} aria-pressed={catalog === 'proposal'} className={`min-h-9 rounded-lg px-2 text-[10px] font-bold transition-colors ${catalog === 'proposal' ? 'bg-amber-500 text-slate-950' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}>Идеи · {PROPOSAL_TOOLS.length}</button>
          </div>
          <button
            type="button"
            onClick={() => setFavoritesOnly(value => !value)}
            className={`mt-2 flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${favoritesOnly ? 'border-violet-600 bg-violet-600 text-white' : 'border-bx-border bg-bx-bg text-bx-muted hover:text-bx-text'}`}
          >
            <span>Избранные</span>
            <span>{favorites.length}</span>
          </button>
          <label className="mt-2 block text-xs font-black text-bx-text lg:hidden">Открыть утилиту<select value={active} onChange={event => handleSetActive(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm font-semibold text-bx-text outline-none focus:border-violet-500">{visible.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        </div>

        <nav className="custom-scrollbar hidden flex-1 space-y-3.5 overflow-y-auto px-2.5 pb-4 lg:block">
          {visible.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-bx-muted font-medium">Подходящих утилит нет</p>
              <button type="button" onClick={() => { setSearch(''); setFavoritesOnly(false) }} className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded">Сбросить фильтры</button>
            </div>
          )}
          {GROUPS.map(g => {
            const items = visible.filter(t => t.group === g)
            if (items.length === 0) return null
            const ga = ACCENT[g]
            return (
              <div key={g} className="flex flex-col gap-0.5">
                <p className={`px-3 mb-1 text-[9px] uppercase tracking-[0.12em] font-extrabold ${ga.text}`}>{g}</p>
                <div className="space-y-0.5">
                  {items.map(t => {
                    const isToolActive = active === t.id;
                    return (
                      <button 
                        key={t.id} 
                        onClick={() => handleSetActive(t.id)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                          isToolActive 
                            ? 'border-violet-600 bg-violet-600 text-white font-extrabold'
                            : 'border-transparent text-bx-text hover:bg-violet-500/[0.07]'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isToolActive ? 'bg-white/20 text-white' : `${ga.iconBg} border border-bx-border/50`}`}>
                          <Icon name={t.icon} className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs font-bold leading-tight ${isToolActive ? 'text-white' : 'text-bx-text'}`}>{t.label}</span>
                          {view === 'guided' && <span className={`block text-[9px] mt-0.5 leading-snug line-clamp-2 ${isToolActive ? 'text-white/85' : 'text-bx-muted'}`}>{t.desc}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Правая панель */}
      <div className={`flex-1 ${isFullHeight ? 'flex flex-col overflow-hidden bg-bx-bg' : 'overflow-y-auto bg-bx-bg'}`}>
        <div className={isFullHeight ? 'flex-shrink-0 px-4 pt-4 sm:px-6 sm:pt-6' : 'mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6'}>
          <WorkbenchTutorial kind="utility" enabled={tutorialEnabled} onToggle={toggleTutorial} />
          {catalog === 'ready' && (
            <section
              aria-labelledby="utility-ideas-title"
              className="mb-4 flex flex-col gap-4 rounded-2xl border border-violet-500/25 bg-violet-500/[0.07] p-4 sm:flex-row sm:items-center"
            >
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-violet-600 text-white">
                <Icon name="ai" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">Новые идеи для BX</p>
                <h2 id="utility-ideas-title" className="mt-1 text-base font-black text-bx-text">{PROPOSAL_TOOLS.length} утилит уже можно посмотреть и обсудить</h2>
                <p className="mt-1 text-xs leading-relaxed text-bx-muted">В каждой карточке описано, что загружать, какой результат получится и зачем инструмент нужен бухгалтеру, юристу, агро- или строительной компании.</p>
                <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Идеи по направлениям">
                  {Object.entries(PROPOSAL_SECTOR_COUNTS).map(([sector, count]) => (
                    <span key={sector} className="rounded-lg border border-bx-border bg-bx-surface px-2 py-1 text-[10px] font-bold text-bx-text">
                      {sector} · {count}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCatalogChange('proposal')}
                className="inline-flex min-h-11 flex-shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-black text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bx-bg"
              >
                Посмотреть все идеи
                <Icon name="arrowR" className="h-4 w-4" />
              </button>
            </section>
          )}
          {!isFullHeight && view === 'guided' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-2xl border border-bx-border bg-bx-surface px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-bx-muted">Рабочие утилиты</p>
                <p className="text-xl font-black text-bx-text mt-1">{READY_TOOLS.length}</p>
              </div>
              <div className="rounded-2xl border border-bx-border bg-bx-surface px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-bx-muted">Обработка документов</p>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{READY_TOOLS.filter(item => item.group === 'Документы и PDF').length}</p>
              </div>
              <div className="rounded-2xl border border-bx-border bg-bx-surface px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-bx-muted">Новые концепции</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{PROPOSAL_TOOLS.length}</p>
              </div>
            </div>
          )}
          {/* Hero-шапка с акцентом группы */}
          <div className={`rounded-3xl bg-gradient-to-br ${a.grad} via-transparent to-transparent border border-bx-border px-5 py-4.5 mb-5 bg-bx-surface shadow-sm`}>
            <div className="flex flex-wrap items-center gap-3.5">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${a.iconBg} shadow-inner`}>
                <Icon name={tool.icon} className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-extrabold text-bx-text leading-tight">{tool.label}</h2>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${a.chipBg} ${a.text} font-bold uppercase`}>{tool.group}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${tool.status === 'proposal' ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
                    {tool.status === 'proposal' ? 'На согласование' : 'Работает'}
                  </span>
                </div>
                <p className="text-[11px] text-bx-muted mt-1">{tool.desc}</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <WorkbenchActions
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={() => toggleFavorite(tool.id)}
                  onReset={() => setWorkspaceRevision(value => value + 1)}
                  showGuide={showGuide}
                  onToggleGuide={() => setShowGuide(value => !value)}
                />
              </div>
            </div>
            {/* Быстрое переключение внутри группы */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {TOOLS.filter(t => t.group === tool.group).map(t => (
                <button 
                  key={t.id} 
                  onClick={() => handleSetActive(t.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                    t.id === tool.id
                      ? `${a.chipBg} ${a.text} font-bold`
                      : 'border-transparent text-bx-muted hover:text-bx-text hover:bg-bx-surface-2/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {!isElectron && tool.group === '1С' && (
            <div className="mb-4 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-xl px-4 py-2.5">
              Системные операции работают только в десктоп-версии Electron.
            </div>
          )}
          {showGuide && <WorkbenchGuide kind="utility" />}
        </div>

        {/* Верстак инструмента */}
        {!isFullHeight ? (
          <div className="max-w-5xl mx-auto px-6 pb-6">
            <WorkbenchCanvas resetKey={`${tool.id}-${workspaceRevision}`}>{tool.component}</WorkbenchCanvas>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <WorkbenchCanvas resetKey={`${tool.id}-${workspaceRevision}`} fullHeight>{tool.component}</WorkbenchCanvas>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tools

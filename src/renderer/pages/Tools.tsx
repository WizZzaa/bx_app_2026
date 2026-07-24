import React, { Suspense, useState } from 'react'
import '../styles/a7-calculators-tools.css'
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
import { WorkbenchActions, WorkbenchCanvas, WorkbenchCatalogNav } from '../components/workspace/WorkbenchChrome'

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
  group: proposal.sector,
  desc: proposal.summary,
  component: <ProposalWorkbench proposal={proposal} />,
  status: 'proposal',
}))

const TOOLS: Tool[] = [...READY_TOOLS, ...PROPOSAL_TOOLS]

const GROUPS = ['Текст и проверки', 'Документы и PDF', '1С', 'Система', 'Заметки', 'Общее', 'Документы и право', 'Агро', 'Строительство']

const ACCENT = Object.fromEntries(GROUPS.map(group => [group, {
  text: 'text-violet-700 dark:text-violet-300',
  chipBg: 'bg-violet-500/10 border-violet-500/20',
  activeBg: 'bg-violet-500/10 border-violet-500/20',
  iconBg: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  grad: 'from-violet-500/[0.07]',
}])) as Record<string, { text: string; chipBg: string; activeBg: string; iconBg: string; grad: string }>

const FULL_HEIGHT_TOOLS = new Set(['notes', 'ecp', 'activex'])

const LAST_TOOL_KEY = 'bx_tools_last'

const Tools = () => {
  const [active, setActiveRaw] = useState(() => {
    const requested = new URLSearchParams(window.location.hash.split('?')[1] || '').get('tool')
    if (requested && TOOLS.some(t => t.id === requested)) return requested
    const last = localStorage.getItem(LAST_TOOL_KEY)
    return last && TOOLS.some(t => t.id === last) ? last : 'inncheck'
  })
  const [search, setSearch] = useState('')
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

  const q = search.trim().toLowerCase()
  const visible = TOOLS.filter(t =>
    !q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.group.toLowerCase().includes(q))

  React.useEffect(() => {
    if (visible.length > 0 && !visible.some(item => item.id === active)) {
      const nextId = visible[0].id
      setActiveRaw(nextId)
      localStorage.setItem(LAST_TOOL_KEY, nextId)
    }
  }, [active, q])

  const tool = TOOLS.find(t => t.id === active) ?? TOOLS[0]
  const a = ACCENT[tool.group]
  const isFullHeight = FULL_HEIGHT_TOOLS.has(tool.id)

  return (
    <div className="bx-a7-workbench bx-a7-workbench--tools z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-bx-bg font-sans text-bx-text lg:flex-row">
      <aside className="bx-a7-workbench__catalog z-10 flex w-full flex-shrink-0 flex-col overflow-hidden border-b border-bx-border bg-bx-surface lg:w-[320px] lg:border-b-0 lg:border-r 2xl:w-[344px]">
        <WorkbenchCatalogNav
          ariaLabel="Категории утилит"
          activeId={active}
          emptyText="Подходящих утилит нет"
          groups={GROUPS}
          items={visible}
          search={search}
          searchLabel="Поиск утилиты"
          searchPlaceholder="Найти утилиту…"
          onSearchChange={setSearch}
          onSelect={handleSetActive}
        />
      </aside>

      {/* Правая панель */}
      <main className={`bx-a7-workbench__content flex-1 ${isFullHeight ? 'flex flex-col overflow-hidden bg-bx-bg' : 'overflow-y-auto bg-bx-bg'}`}>
        <div className={isFullHeight ? 'bx-a7-workbench__inner flex-shrink-0 px-4 pt-4 sm:px-6 sm:pt-6' : 'bx-a7-workbench__inner px-4 pt-4 sm:px-6 sm:pt-6'}>
          {/* Hero-шапка с акцентом группы */}
          <header className={`bx-a7-workbench__hero rounded-3xl bg-gradient-to-br ${a.grad} via-transparent to-transparent border border-bx-border px-5 py-4.5 mb-5 bg-bx-surface shadow-sm`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${a.iconBg} shadow-inner`}>
                <Icon name={tool.icon} className="w-5 h-5" />
              </span>
              <div className="min-w-0 sm:flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-extrabold text-bx-text leading-tight">{tool.label}</h2>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${a.chipBg} ${a.text} font-bold uppercase`}>{tool.group}</span>
                  {tool.status === 'proposal' && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400">
                      На согласование
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-bx-muted mt-1">{tool.desc}</p>
              </div>
              <div className="w-full flex-shrink-0 sm:ml-auto sm:w-auto">
                <WorkbenchActions
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={() => toggleFavorite(tool.id)}
                  onReset={() => setWorkspaceRevision(value => value + 1)}
                />
              </div>
            </div>
          </header>

          {!isElectron && tool.group === '1С' && (
            <div className="mb-4 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-xl px-4 py-2.5">
              Системные операции работают только в десктоп-версии Electron.
            </div>
          )}
        </div>

        {/* Верстак инструмента */}
        {!isFullHeight ? (
          <div className="bx-a7-workbench__canvas-wrap px-6 pb-6">
            <WorkbenchCanvas resetKey={`${tool.id}-${workspaceRevision}`}>{tool.component}</WorkbenchCanvas>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <WorkbenchCanvas resetKey={`${tool.id}-${workspaceRevision}`} fullHeight>{tool.component}</WorkbenchCanvas>
          </div>
        )}
      </main>
    </div>
  )
}

export default Tools

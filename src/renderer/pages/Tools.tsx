import React, { useState } from 'react'
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
import PdfCompress from './tools/PdfCompress'
import PdfConvert from './tools/PdfConvert'
import OcrTool from './tools/OcrTool'
import EcpManager from './EcpManager'
import ActiveXConfigurator from './tools/ActiveXConfigurator'
import { isElectron } from '../lib/onecApi'
import Icon from '../lib/ui/Icon'
import { UTILITY_PROPOSALS } from '../data/workbenchCatalog'
import { ProposalWorkbench } from '../components/workspace/ProposalWorkbench'
import { useWorkbenchFavorites } from '../lib/useWorkbenchFavorites'

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
  { id: 'ecp',       icon: 'key',      label: 'Менеджер ЭЦП',  group: 'Система', desc: 'Мониторинг ключей и статуса E-Imzo', component: <EcpManager /> },
  { id: 'activex',   icon: 'settings', label: 'Настройка ActiveX', group: 'Система', desc: 'Авто-настройка IE для банк-клиентов РУз', component: <ActiveXConfigurator /> },
  { id: 'pccleaner', icon: 'monitor',  label: 'Очистка ПК',    group: 'Система', desc: 'TEMP Windows + кэши браузеров', component: <PcCleaner /> },
  { id: 'network',   icon: 'services', label: 'Проверка сети', group: 'Система', desc: 'Доступность госсайтов РУз', component: <NetworkChecker /> },
  { id: 'eimzo',     icon: 'ecp',      label: 'Диагностика E-Imzo', group: 'Система', desc: 'Плагин и локальный сервис ЭЦП', component: <EimzoDiag /> },
  // Заметки
  { id: 'notes', icon: 'note', label: 'Быстрые заметки', group: 'Заметки', desc: 'Буфер для текстов и реквизитов', component: <QuickNotes /> },
  // Документы и PDF
  { id: 'pdfcompress', icon: 'recycle', label: 'Сжатие PDF', group: 'Документы и PDF', desc: 'Оптимизация и уменьшение веса PDF файлов', component: <PdfCompress /> },
  { id: 'pdfconvert',  icon: 'exchange', label: 'Конвертер PDF', group: 'Документы и PDF', desc: 'Конвертация PDF в таблицы Excel или тексты Word', component: <PdfConvert /> },
  { id: 'ocr',         icon: 'ai',       label: 'Распознавание текста (OCR)', group: 'Документы и PDF', desc: 'Извлечение текста из сканов и фото (PDF/JPEG) в Word', component: <OcrTool /> },
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

const GROUPS = ['Текст и проверки', 'Документы и PDF', '1С', 'Система', 'Заметки', 'Общее · идеи', 'Документы и право · идеи', 'Агро · идеи', 'Строительство · идеи']

const ACCENT: Record<string, { text: string; chipBg: string; activeBg: string; iconBg: string; grad: string }> = {
  '1С':                { text: 'text-amber-700 dark:text-amber-400',   chipBg: 'bg-amber-500/10 border-amber-500/20',     activeBg: 'bg-amber-500/10 border-amber-500/20',   iconBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',     grad: 'from-amber-500/5' },
  'Текст и проверки': { text: 'text-purple-700 dark:text-purple-400',  chipBg: 'bg-purple-500/10 border-purple-500/20',   activeBg: 'bg-purple-500/10 border-purple-500/20',  iconBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',   grad: 'from-purple-500/5' },
  'Документы и PDF':   { text: 'text-rose-700 dark:text-rose-400',    chipBg: 'bg-rose-500/10 border-rose-500/20',       activeBg: 'bg-rose-500/10 border-rose-500/20',    iconBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',       grad: 'from-rose-500/5' },
  'Система':           { text: 'text-cyan-700 dark:text-cyan-400',    chipBg: 'bg-cyan-500/10 border-cyan-500/20',       activeBg: 'bg-cyan-500/10 border-cyan-500/20',    iconBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',       grad: 'from-cyan-500/5' },
  'Заметки':           { text: 'text-emerald-700 dark:text-emerald-400', chipBg: 'bg-emerald-500/10 border-emerald-500/20', activeBg: 'bg-emerald-500/10 border-emerald-500/20', iconBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', grad: 'from-emerald-500/5' },
  'Общее · идеи':      { text: 'text-blue-700 dark:text-blue-400', chipBg: 'bg-blue-500/10 border-blue-500/20', activeBg: 'bg-blue-500/10 border-blue-500/20', iconBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', grad: 'from-blue-500/5' },
  'Документы и право · идеи': { text: 'text-violet-700 dark:text-violet-400', chipBg: 'bg-violet-500/10 border-violet-500/20', activeBg: 'bg-violet-500/10 border-violet-500/20', iconBg: 'bg-violet-500/10 text-violet-700 dark:text-violet-400', grad: 'from-violet-500/5' },
  'Агро · идеи':      { text: 'text-emerald-700 dark:text-emerald-400', chipBg: 'bg-emerald-500/10 border-emerald-500/20', activeBg: 'bg-emerald-500/10 border-emerald-500/20', iconBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', grad: 'from-emerald-500/5' },
  'Строительство · идеи': { text: 'text-orange-700 dark:text-orange-400', chipBg: 'bg-orange-500/10 border-orange-500/20', activeBg: 'bg-orange-500/10 border-orange-500/20', iconBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400', grad: 'from-orange-500/5' },
}

const FULL_HEIGHT_TOOLS = new Set(['notes', 'ecp', 'activex'])

const LAST_TOOL_KEY = 'bx_tools_last'

const Tools = () => {
  const [active, setActiveRaw] = useState(() => {
    const last = localStorage.getItem(LAST_TOOL_KEY)
    return last && TOOLS.some(t => t.id === last) ? last : 'inncheck'
  })
  const [search, setSearch] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
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
    (!q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.group.toLowerCase().includes(q))
    && (!favoritesOnly || favorites.includes(t.id)))
  const tool = TOOLS.find(t => t.id === active) ?? TOOLS[0]
  const a = ACCENT[tool.group]
  const isFullHeight = FULL_HEIGHT_TOOLS.has(tool.id)

  return (
    <div className="flex-1 flex overflow-hidden z-10 font-sans bg-bx-bg text-bx-text">
      {/* Левая панель — список утилит */}
      <aside className="w-[292px] flex-shrink-0 border-r border-bx-border bg-bx-surface-2/65 dark:bg-bx-surface flex flex-col z-10 overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <h1 className="text-xs font-black text-bx-text uppercase tracking-wider">Утилиты</h1>
          <p className="text-[10px] text-bx-muted mt-0.5">{READY_TOOLS.length} работают · {PROPOSAL_TOOLS.length} идей на согласование</p>
        </div>

        <div className="px-4 pb-3 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted">
              <Icon name="search" className="w-3.5 h-3.5" />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Поиск утилиты"
              placeholder="Поиск утилиты..."
              className="w-full bg-bx-surface text-bx-text placeholder-bx-muted text-xs pl-9 pr-3 py-2 rounded-xl border border-bx-border focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 shadow-inner transition-all font-semibold"
            />
          </div>
          <button
            type="button"
            onClick={() => setFavoritesOnly(value => !value)}
            className={`mt-2 w-full min-h-11 rounded-xl border px-3 flex items-center justify-between text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${favoritesOnly ? 'bg-blue-600 border-blue-600 text-white' : 'bg-bx-surface border-bx-border text-bx-muted hover:text-bx-text'}`}
          >
            <span>Избранные</span>
            <span>{favorites.length}</span>
          </button>
        </div>

        <nav className="flex-1 px-2.5 pb-4 space-y-3.5 overflow-y-auto custom-scrollbar">
          {visible.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-bx-muted font-medium">Подходящих утилит нет</p>
              <button type="button" onClick={() => { setSearch(''); setFavoritesOnly(false) }} className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded">Показать весь каталог</button>
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
                            ? 'bg-blue-600 text-white font-extrabold border-transparent shadow-md' 
                            : 'text-bx-text border-transparent hover:bg-bx-surface/80 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isToolActive ? 'bg-white/20 text-white' : `${ga.iconBg} border border-bx-border/50`}`}>
                          <Icon name={t.icon} className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs font-bold leading-tight ${isToolActive ? 'text-white' : 'text-bx-text'}`}>{t.label}</span>
                          <span className={`block text-[9px] mt-0.5 leading-snug line-clamp-2 ${isToolActive ? 'text-white/85' : 'text-bx-muted'}`}>{t.desc}</span>
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
        <div className={isFullHeight ? 'px-6 pt-6 flex-shrink-0' : 'max-w-5xl mx-auto px-6 pt-6'}>
          {!isFullHeight && (
            <div className="grid grid-cols-3 gap-3 mb-5">
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
            <div className="flex items-center gap-3.5">
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
              <button
                type="button"
                onClick={() => toggleFavorite(tool.id)}
                aria-pressed={favorites.includes(tool.id)}
                className={`ml-auto min-h-11 px-3.5 border text-xs font-semibold rounded-xl transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${favorites.includes(tool.id) ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400' : 'bg-bx-surface border-bx-border text-bx-muted hover:text-bx-text'}`}
              >
                {favorites.includes(tool.id) ? 'В избранном' : 'В избранное'}
              </button>
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
        </div>

        {/* Верстак инструмента */}
        {!isFullHeight ? (
          <div className="max-w-5xl mx-auto px-6 pb-6">
            <div className="rounded-3xl bg-bx-surface border border-bx-border p-5 shadow-sm">
              {tool.component}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <div className="rounded-3xl bg-bx-surface border border-bx-border p-4 h-full overflow-hidden shadow-sm">
              {tool.component}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tools

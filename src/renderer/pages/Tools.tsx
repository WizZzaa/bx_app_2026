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
import TranslatorTool from './tools/TranslatorTool'
import { isElectron } from '../lib/onecApi'
import Icon from '../lib/ui/Icon'

interface Tool {
  id: string
  icon: string
  label: string
  group: string
  component: React.ReactNode
  desc: string
}

const TOOLS: Tool[] = [
  // 1С
  { id: 'cache',  icon: 'trash', label: 'Очистка кэша 1С',  group: '1С', desc: 'Временные файлы 1С:Предприятие', component: <CacheCleaner /> },
  { id: 'backup', icon: 'save',  label: 'Резервная копия',  group: '1С', desc: 'Бэкап баз данных 1С (.1CD)', component: <DatabaseBackup /> },
  { id: 'killer', icon: 'zap',   label: 'Снятие процессов', group: '1С', desc: 'Завершить зависший 1cv8.exe', component: <ProcessKiller /> },
  // Текст и реквизиты
  { id: 'inncheck', icon: 'search', label: 'Проверка ИНН', group: 'Текст и реквизиты', desc: 'Статус, НДС и класс риска по ИНН', component: <InnCheckTool /> },
  { id: 'translator', icon: 'languages', label: 'Переводчик документов', group: 'Текст и реквизиты', desc: 'Умный переводчик с узбекского языка', component: <TranslatorTool /> },
  { id: 'num2words', icon: 'hash',      label: 'Число прописью',        group: 'Текст и реквизиты', desc: 'Для договоров и платёжек', component: <NumberToWords /> },
  { id: 'translit',  icon: 'languages', label: 'Транслитерация',        group: 'Текст и реквизиты', desc: 'Узбек кирилл ↔ латиница (2019)', component: <Transliterate /> },
  { id: 'bankcheck', icon: 'building',  label: 'Проверка счёта и МФО',  group: 'Текст и реквизиты', desc: 'Р/с 20 цифр + банк по МФО', component: <BankCheck /> },
  // Система
  { id: 'pccleaner', icon: 'monitor',  label: 'Очистка ПК',    group: 'Система', desc: 'TEMP Windows + кэши браузеров', component: <PcCleaner /> },
  { id: 'network',   icon: 'services', label: 'Проверка сети', group: 'Система', desc: 'Доступность госсайтов РУз', component: <NetworkChecker /> },
  { id: 'eimzo',     icon: 'ecp',      label: 'Диагностика E-Imzo', group: 'Система', desc: 'Плагин и локальный сервис ЭЦП', component: <EimzoDiag /> },
  // Заметки
  { id: 'notes', icon: 'note', label: 'Быстрые заметки', group: 'Заметки', desc: 'Буфер для текстов и реквизитов', component: <QuickNotes /> },
]

const GROUPS = ['1С', 'Текст и реквизиты', 'Система', 'Заметки']

const ACCENT: Record<string, { text: string; chipBg: string; activeBg: string; iconBg: string; grad: string }> = {
  '1С':                { text: 'text-amber-400',   chipBg: 'bg-amber-500/15 border-amber-500/30',     activeBg: 'bg-amber-500/15',   iconBg: 'bg-amber-500/20 text-amber-400',     grad: 'from-amber-500/15' },
  'Текст и реквизиты': { text: 'text-purple-400',  chipBg: 'bg-purple-500/15 border-purple-500/30',   activeBg: 'bg-purple-500/15',  iconBg: 'bg-purple-500/20 text-purple-400',   grad: 'from-purple-500/15' },
  'Система':           { text: 'text-cyan-400',    chipBg: 'bg-cyan-500/15 border-cyan-500/30',       activeBg: 'bg-cyan-500/15',    iconBg: 'bg-cyan-500/20 text-cyan-400',       grad: 'from-cyan-500/15' },
  'Заметки':           { text: 'text-emerald-400', chipBg: 'bg-emerald-500/15 border-emerald-500/30', activeBg: 'bg-emerald-500/15', iconBg: 'bg-emerald-500/20 text-emerald-400', grad: 'from-emerald-500/15' },
}

const FULL_HEIGHT_TOOLS = new Set(['notes'])

const LAST_TOOL_KEY = 'bx_tools_last'

const Tools = () => {
  const [active, setActiveRaw] = useState(() => {
    const last = localStorage.getItem(LAST_TOOL_KEY)
    return last && TOOLS.some(t => t.id === last) ? last : 'inncheck'
  })
  const [search, setSearch] = useState('')

  const handleSetActive = (id: string) => {
    setActiveRaw(id)
    localStorage.setItem(LAST_TOOL_KEY, id)
  }

  const q = search.trim().toLowerCase()
  const visible = TOOLS.filter(t =>
    !q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.group.toLowerCase().includes(q))
  const tool = TOOLS.find(t => t.id === active) ?? TOOLS[0]
  const a = ACCENT[tool.group]
  const isFullHeight = FULL_HEIGHT_TOOLS.has(tool.id)

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Левая панель */}
      <aside className="w-60 flex-shrink-0 border-r border-[#1e2535] flex flex-col overflow-hidden">
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <h1 className="text-base font-semibold text-white">Утилиты</h1>
          <p className="text-xs text-slate-500 mt-0.5">{TOOLS.length} инструментов бухгалтера</p>
        </div>

        <div className="px-3 pb-2 flex-shrink-0">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Найти инструмент..."
            className="w-full bg-[#0f1117] text-slate-200 placeholder-slate-600 text-xs px-3 py-2 rounded-lg border border-[#1e2535] focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {visible.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">Ничего не найдено</p>
          )}
          {GROUPS.map(g => {
            const items = visible.filter(t => t.group === g)
            if (items.length === 0) return null
            const ga = ACCENT[g]
            return (
              <div key={g} className="mb-2">
                <p className={`px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest font-semibold ${ga.text} opacity-70`}>{g}</p>
                <div className="space-y-0.5">
                  {items.map(t => (
                    <button key={t.id} onClick={() => handleSetActive(t.id)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                        active === t.id ? `${ga.activeBg} ${ga.text}` : 'text-slate-400 hover:bg-[#1e2535] hover:text-slate-200'
                      }`}>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active === t.id ? ga.iconBg : 'bg-[#1e2535] text-slate-500'}`}>
                        <Icon name={t.icon} className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-sm leading-tight ${active === t.id ? 'font-medium' : ''}`}>{t.label}</span>
                        <span className={`block text-[10px] mt-0.5 leading-tight ${active === t.id ? 'opacity-70' : 'text-slate-600'}`}>{t.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Правая панель */}
      <div className={`flex-1 ${isFullHeight ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={isFullHeight ? 'px-6 pt-6 flex-shrink-0' : 'max-w-2xl mx-auto px-6 pt-6'}>
          {/* Hero-шапка с акцентом группы */}
          <div className={`rounded-2xl bg-gradient-to-br ${a.grad} via-transparent to-transparent border border-[#1e2535] px-5 py-4 mb-4`}>
            <div className="flex items-center gap-3.5">
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${a.iconBg}`}>
                <Icon name={tool.icon} className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white leading-tight">{tool.label}</h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${a.chipBg} ${a.text} font-semibold`}>{tool.group}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{tool.desc}</p>
              </div>
            </div>
            {/* Быстрое переключение внутри группы */}
            <div className="flex flex-wrap gap-1.5 mt-3.5">
              {TOOLS.filter(t => t.group === tool.group).map(t => (
                <button key={t.id} onClick={() => handleSetActive(t.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                    t.id === tool.id
                      ? `${a.chipBg} ${a.text} font-medium`
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#1e2535]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {!isElectron && tool.group === '1С' && (
            <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-4 py-2.5">
              ⚠ Системные операции работают только в десктоп-версии Electron
            </div>
          )}
        </div>

        {/* Верстак инструмента */}
        {!isFullHeight ? (
          <div className="max-w-2xl mx-auto px-6 pb-6">
            <div className="rounded-2xl bg-[#10141d] border border-[#1e2535] p-5">
              {tool.component}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <div className="rounded-2xl bg-[#10141d] border border-[#1e2535] p-4 h-full overflow-hidden">
              {tool.component}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tools

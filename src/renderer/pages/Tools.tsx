import React, { useState } from 'react';
import CacheCleaner from './tools/CacheCleaner';
import ProcessKiller from './tools/ProcessKiller';
import DatabaseBackup from './tools/DatabaseBackup';
import PcCleaner from './tools/PcCleaner';
import NetworkChecker from './tools/NetworkChecker';
import EimzoDiag from './tools/EimzoDiag';
import QuickNotes from './tools/QuickNotes';
import NumberToWords from './tools/NumberToWords';
import DateCalc from './tools/DateCalc';
import CompanyRequisites from './tools/CompanyRequisites';
import Transliterate from './tools/Transliterate';
import TaxCalculator from './tools/TaxCalculator';
import { isElectron } from '../lib/onecApi';
import Icon from '../lib/ui/Icon';

interface Tool {
  id: string;
  icon: string;
  label: string;
  category: string;
  component: React.ReactNode;
  description: string;
}

const TOOLS: Tool[] = [
  // 1С
  { id: 'cache', icon: 'trash', label: 'Очистка кэша 1С', category: '1С', description: 'Временные файлы 1С:Предприятие', component: <CacheCleaner /> },
  { id: 'backup', icon: 'save', label: 'Резервная копия', category: '1С', description: 'Бэкап баз данных 1С (.1CD)', component: <DatabaseBackup /> },
  { id: 'killer', icon: 'zap', label: 'Снятие процессов', category: '1С', description: 'Завершить зависший 1cv8.exe', component: <ProcessKiller /> },
  // Текст и числа
  { id: 'num2words', icon: 'hash', label: 'Число прописью', category: 'Текст', description: 'Для договоров, платёжных поручений', component: <NumberToWords /> },
  { id: 'translit', icon: 'languages', label: 'Транслитерация', category: 'Текст', description: 'Узбек кирилл ↔ латиница (2019)', component: <Transliterate /> },
  // Дата и время
  { id: 'datecalc', icon: 'planner', label: 'Калькулятор дат', category: 'Дата', description: 'Рабочие дни, разница, праздники РУз', component: <DateCalc /> },
  // Реквизиты
  { id: 'requisites', icon: 'building', label: 'Реквизиты компаний', category: 'Реквизиты', description: 'Р/с, МФО, ОКОНХ, ОКПО — быстро скопировать', component: <CompanyRequisites /> },
  // Система
  { id: 'pccleaner', icon: 'monitor', label: 'Очистка ПК', category: 'Система', description: 'TEMP Windows + кэши браузеров', component: <PcCleaner /> },
  { id: 'network', icon: 'services', label: 'Проверка сети', category: 'Система', description: 'Доступность госсайтов РУз', component: <NetworkChecker /> },
  // ЭЦП
  { id: 'eimzo', icon: 'ecp', label: 'Диагностика E-Imzo', category: 'ЭЦП', description: 'Проверка плагина и локального сервиса', component: <EimzoDiag /> },
  // Заметки
  { id: 'notes', icon: 'note', label: 'Быстрые заметки', category: 'Заметки', description: 'Временный буфер для текстов и реквизитов', component: <QuickNotes /> },
  // Налоги
  { id: 'taxcalc', icon: 'planner', label: 'Налоговый калькулятор', category: 'Налоги', description: 'Налог с оборота, НДС, НДФЛ — на основе ваших данных', component: <TaxCalculator /> },
];

const CATEGORIES = ['Все', '1С', 'Налоги', 'Текст', 'Дата', 'Реквизиты', 'Система', 'ЭЦП', 'Заметки'];

// Tools with non-standard height that need full content panel height
const FULL_HEIGHT_TOOLS = new Set(['requisites', 'notes']);

const LAST_TOOL_KEY = 'bx_tools_last';

export default function Tools() {
  const [active, setActiveRaw] = useState(() => {
    const last = localStorage.getItem(LAST_TOOL_KEY);
    return last && TOOLS.some(t => t.id === last) ? last : 'num2words';
  });
  const [catFilter, setCatFilter] = useState('Все');
  const [search, setSearch] = useState('');

  function setActive(id: string) {
    setActiveRaw(id);
    localStorage.setItem(LAST_TOOL_KEY, id);
  }

  const q = search.trim().toLowerCase();
  const filtered = TOOLS.filter(t =>
    (catFilter === 'Все' || t.category === catFilter) &&
    (!q || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
  );
  const tool = TOOLS.find(t => t.id === active) ?? TOOLS[0];
  const isFullHeight = FULL_HEIGHT_TOOLS.has(active);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Левая панель */}
      <aside className="w-56 flex-shrink-0 border-r border-[#1e2535] flex flex-col overflow-hidden">
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <h1 className="text-base font-semibold text-white">Утилиты</h1>
          <p className="text-xs text-slate-500 mt-0.5">Инструменты бухгалтера</p>
        </div>

        {/* Поиск */}
        <div className="px-3 pb-2 flex-shrink-0">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Найти инструмент..."
            className="w-full bg-[#0f1117] text-slate-200 placeholder-slate-600 text-xs px-3 py-2 rounded-lg border border-[#1e2535] focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Фильтр категорий */}
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${catFilter === c ? 'bg-blue-600/30 text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {filtered.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">Ничего не найдено</p>
          )}
          {filtered.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                active === t.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-[#1e2535] hover:text-slate-200'
              }`}>
              <Icon name={t.icon} className="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className={`text-sm leading-tight ${active === t.id ? 'font-medium' : ''}`}>{t.label}</p>
                <p className={`text-[10px] mt-0.5 leading-tight ${active === t.id ? 'text-blue-400/70' : 'text-slate-600'}`}>{t.description}</p>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Правая панель */}
      <div className={`flex-1 ${isFullHeight ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
        {!isFullHeight && (
          <div className="max-w-lg mx-auto px-6 py-6">
            <Header tool={tool} />
            {!isElectron && tool.category === '1С' && (
              <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-4 py-2.5">
                ⚠ Системные операции работают только в десктоп-версии Electron
              </div>
            )}
            {tool.component}
          </div>
        )}

        {isFullHeight && (
          <>
            <div className="px-6 py-4 border-b border-[#1e2535] flex-shrink-0">
              <Header tool={tool} compact />
            </div>
            <div className="flex-1 overflow-hidden p-4">
              {tool.component}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Header({ tool, compact }: { tool: Tool; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mb-6'}`}>
      <span className="text-blue-400"><Icon name={tool.icon} className={compact ? 'w-5 h-5' : 'w-6 h-6'} /></span>
      <div>
        <h2 className={`font-semibold text-white ${compact ? 'text-base' : 'text-lg'}`}>{tool.label}</h2>
        <p className="text-xs text-slate-500">{tool.description}</p>
      </div>
    </div>
  );
}

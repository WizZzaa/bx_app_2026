import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../lib/ui/Icon';

interface Cmd {
  id: string;
  label: string;
  icon: string;
  to: string;
  group: 'Действие' | 'Раздел';
  keywords?: string;
}

const COMMANDS: Cmd[] = [
  // Быстрые действия
  { id: 'a-task',   label: 'Новая задача',      icon: 'plus', to: '/planner',  group: 'Действие', keywords: 'добавить канбан доска' },
  { id: 'a-op',     label: 'Новая операция',    icon: 'plus', to: '/finance',  group: 'Действие', keywords: 'доход расход деньги' },
  { id: 'a-emp',    label: 'Новый сотрудник',   icon: 'plus', to: '/hr',       group: 'Действие', keywords: 'кадры зарплата' },
  { id: 'a-ai',     label: 'Спросить AI',       icon: 'ai',   to: '/ai',       group: 'Действие', keywords: 'консультант вопрос налоги' },
  // Разделы
  { id: 'n-dash',   label: 'Дашборд',           icon: 'dashboard', to: '/',          group: 'Раздел', keywords: 'главная рабочий стол' },
  { id: 'n-plan',   label: 'Планировщик',       icon: 'planner',   to: '/planner',   group: 'Раздел', keywords: 'задачи канбан календарь' },
  { id: 'n-calc',   label: 'Калькуляторы',      icon: 'calc',      to: '/calc',      group: 'Раздел', keywords: 'ндс ндфл пени' },
  { id: 'n-tools',  label: 'Утилиты',           icon: 'tools',     to: '/tools',     group: 'Раздел', keywords: 'инструменты 1с очистка' },
  { id: 'n-kb',     label: 'База знаний',       icon: 'knowledge', to: '/knowledge', group: 'Раздел', keywords: 'статьи гайды справочники ставки счета нсбу брв мрот' },
  { id: 'n-ref',    label: 'Справочные данные', icon: 'reference', to: '/reference', group: 'Раздел', keywords: 'справочники ставки счета нсбу брв мрот налоги' },
  { id: 'n-srv',    label: 'Сервисы',           icon: 'services',  to: '/services',  group: 'Раздел', keywords: 'госпорталы ссылки банки' },
  { id: 'n-news',   label: 'Новости',           icon: 'news',      to: '/news',      group: 'Раздел' },
  { id: 'n-tpl',    label: 'Шаблоны',           icon: 'templates', to: '/templates', group: 'Раздел', keywords: 'договор акт приказ' },
  { id: 'n-hr',     label: 'Сотрудники',        icon: 'hr',        to: '/hr',        group: 'Раздел', keywords: 'кадры зарплата зп' },
  { id: 'n-fin',    label: 'Контроль оплат',    icon: 'finance',   to: '/finance',   group: 'Раздел', keywords: 'финансы дебиторка кредиторка оплата долги' },
  { id: 'n-ecp',    label: 'ЭЦП',               icon: 'ecp',       to: '/ecp',       group: 'Раздел', keywords: 'ключ подпись e-imzo' },
  { id: 'n-inn',    label: 'Проверка ИНН',      icon: 'search',    to: '/check-inn', group: 'Раздел' },
  { id: 'n-ai',     label: 'AI-Консультант',    icon: 'ai',        to: '/ai',        group: 'Раздел' },
  { id: 'n-set',    label: 'Настройки',         icon: 'settings',  to: '/settings',  group: 'Раздел' },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return COMMANDS;
    return COMMANDS.filter(c => c.label.toLowerCase().includes(ql) || (c.keywords ?? '').includes(ql));
  }, [q]);

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  useEffect(() => { setSel(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); const c = results[sel]; if (c) run(c); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, sel]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-i="${sel}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  function run(c: Cmd) { navigate(c.to); onClose(); }

  if (!open) return null;

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[12vh]" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bx-animate-fade w-[560px] max-w-[92vw] bg-bx-surface border border-bx-border-2 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-bx-border">
          <Icon name="search" className="w-4 h-4 text-bx-muted" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Перейти к разделу или действию…"
            className="flex-1 bg-transparent text-bx-text text-sm focus:outline-none placeholder:text-bx-muted" />
          <kbd className="text-[10px] text-bx-muted border border-bx-border-2 rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && <p className="text-xs text-bx-muted text-center py-8">Ничего не найдено</p>}
          {results.map((c, i) => {
            const showGroup = c.group !== lastGroup; lastGroup = c.group;
            return (
              <React.Fragment key={c.id}>
                {showGroup && <p className="text-[10px] uppercase tracking-wide text-bx-muted px-4 pt-2 pb-1">{c.group}</p>}
                <button data-i={i}
                  onMouseEnter={() => setSel(i)} onClick={() => run(c)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${sel === i ? 'bg-blue-600/20' : 'hover:bg-bx-surface-2'}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${sel === i ? 'bg-blue-600/30 text-blue-300' : 'bg-bx-surface-2 text-bx-muted'}`}><Icon name={c.icon} className="w-4 h-4" /></span>
                  <span className={`text-sm ${sel === i ? 'text-bx-text' : 'text-bx-text'}`}>{c.label}</span>
                  {sel === i && <span className="ml-auto text-bx-muted"><Icon name="arrowR" className="w-4 h-4" /></span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border-t border-bx-border text-[10px] text-bx-muted">
          <span><kbd className="border border-bx-border-2 rounded px-1">↑</kbd> <kbd className="border border-bx-border-2 rounded px-1">↓</kbd> навигация</span>
          <span><kbd className="border border-bx-border-2 rounded px-1">↵</kbd> выбрать</span>
          <span className="ml-auto">⌘K / Ctrl+K — открыть</span>
        </div>
      </div>
    </div>
  );
}

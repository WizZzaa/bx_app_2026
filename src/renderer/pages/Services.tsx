import React, { useEffect, useMemo, useState } from 'react';
import { getSectionsSync, refreshServices } from '../lib/db/servicesRepo';
import type { ServiceItem, ServiceSection } from '../data/services';

function openLink(url: string) {
  if (typeof window !== 'undefined' && (window as any).bx?.shell?.openExternal) {
    (window as any).bx.shell.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// Цвет чипа-тега по смыслу
function tagClass(tag?: string): string {
  if (!tag) return 'bg-blue-500/10 text-blue-400';
  if (tag === 'TG') return 'bg-sky-500/15 text-sky-400';
  if (['ЛКН', 'ГНК', 'НДС', 'Налоги', 'Долги', 'Оплата', 'Отчёт'].includes(tag)) return 'bg-emerald-500/12 text-emerald-400';
  if (['Банк', 'ЦБ', 'Минфин', 'Казнач.'].includes(tag)) return 'bg-amber-500/12 text-amber-400';
  if (['Платежи', 'Карты', 'НМПС', 'НМПС'].includes(tag)) return 'bg-violet-500/12 text-violet-400';
  if (['ЭЦП', 'ЭДО', 'ЭСФ'].includes(tag)) return 'bg-rose-500/12 text-rose-400';
  if (['1С', 'ERP', 'Учёт', 'ИТ'].includes(tag)) return 'bg-orange-500/12 text-orange-400';
  return 'bg-slate-500/15 text-bx-text';
}

function ServiceCard({ item }: { item: ServiceItem }) {
  return (
    <button
      onClick={() => openLink(item.url)}
      className="group relative flex items-start gap-3 p-3.5 rounded-2xl text-left bg-bx-surface border border-bx-border hover:border-blue-500/40 hover:bg-bx-surface-2 transition-all active:scale-[0.99] overflow-hidden"
    >
      {/* лёгкая подсветка при наведении */}
      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'radial-gradient(120px 60px at 12% 0%, rgba(59,130,246,0.10), transparent)' }} />
      <span className="relative flex-shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-bx-bg border border-bx-border text-lg">
        {item.icon}
      </span>
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-sm font-semibold text-bx-text group-hover:text-white transition-colors truncate">{item.title}</span>
          {item.hot && <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-bold">ЧАСТО</span>}
          {item.tag && <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tagClass(item.tag)}`}>{item.tag}</span>}
        </div>
        <p className="text-xs text-bx-muted leading-relaxed line-clamp-2">{item.desc}</p>
      </div>
      <span className="relative text-bx-muted group-hover:text-blue-400 flex-shrink-0 text-sm mt-0.5 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
    </button>
  );
}

export default function Services() {
  const [sections, setSections] = useState<ServiceSection[]>(() => getSectionsSync());
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Подтянуть облачные сервисы (админ мог добавить), не блокируя первый рендер
  useEffect(() => { refreshServices().then(setSections).catch(() => { /* оффлайн — остаёмся на статике */ }); }, []);

  const q = search.toLowerCase().trim();

  const matches = (item: ServiceItem) =>
    !q || item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.tag?.toLowerCase().includes(q);

  const filtered = useMemo(() => sections
    .map(section => ({ ...section, items: section.items.filter(matches) }))
    .filter(s => !activeSection || s.id === activeSection)
    .filter(s => s.items.length > 0), [sections, q, activeSection]);

  const totalCount = useMemo(() => sections.reduce((sum, s) => sum + s.items.length, 0), [sections]);
  const hotItems = useMemo(() => sections.flatMap(s => s.items).filter(i => i.hot && matches(i)), [sections, q]);
  const showHot = !activeSection && !q && hotItems.length > 0;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Левая панель — категории */}
      <aside className="w-52 flex-shrink-0 border-r border-bx-border overflow-y-auto bg-bx-surface/30">
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] text-bx-muted uppercase tracking-wider font-semibold">Категории</p>
        </div>
        <nav className="px-2 pb-4 space-y-0.5">
          <button
            onClick={() => setActiveSection(null)}
            className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs transition-colors ${!activeSection ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-bx-muted hover:bg-bx-surface-2 hover:text-bx-text'}`}
          >
            <span>Все сервисы</span>
            <span className="text-[10px] text-bx-muted font-mono">{totalCount}</span>
          </button>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id === activeSection ? null : s.id)}
              className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg text-xs transition-colors leading-snug ${activeSection === s.id ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-bx-muted hover:bg-bx-surface-2 hover:text-bx-text'}`}
            >
              <span className="truncate">{s.title}</span>
              <span className="text-[10px] text-bx-muted font-mono flex-shrink-0">{s.items.length}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Правая панель */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 pt-5 pb-3 border-b border-bx-border bg-bx-bg/85 backdrop-blur flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-bx-text">Навигатор сервисов</h1>
            <p className="text-xs text-bx-muted">{totalCount} сервисов для бухгалтера РУз · <span className="text-blue-400 font-semibold">ЧАСТО</span> — самые нужные</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск сервиса…"
            className="ml-auto w-56 bg-bx-surface text-bx-text placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-bx-border-2 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="px-6 py-4 space-y-7">
          {/* Быстрый доступ — часто используемые */}
          {showHot && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-bx-text mb-3">
                <span className="w-1 h-3.5 rounded-full bg-blue-500" /> Часто используемые
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {hotItems.map(item => <ServiceCard key={'hot-' + item.url + item.title} item={item} />)}
              </div>
            </section>
          )}

          {filtered.map(section => (
            <section key={section.id}>
              <h2 className="flex items-center justify-between text-sm font-bold text-bx-text mb-3">
                <span>{section.title}</span>
                <span className="text-[10px] text-bx-muted font-mono font-normal">{section.items.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {section.items.map(item => <ServiceCard key={item.url + item.title} item={item} />)}
              </div>
            </section>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-bx-muted text-sm">
              По запросу «{search}» ничего не найдено
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

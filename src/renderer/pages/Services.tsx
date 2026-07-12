import React, { useEffect, useMemo, useState } from 'react';
import { getSectionsSync, refreshServices } from '../lib/db/servicesRepo';
import type { ServiceItem, ServiceSection } from '../data/services';

async function pingUrl(url: string): Promise<boolean> {
  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return true;
  } catch {
    return false;
  }
}

function openLink(url: string) {
  if (typeof window !== 'undefined' && (window as any).bx?.shell?.openExternal) {
    (window as any).bx.shell.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function tagClass(tag?: string): string {
  if (!tag) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (tag === 'TG') return 'bg-sky-500/15 text-sky-400 border-sky-500/20';
  if (['ЛКН', 'ГНК', 'НДС', 'Налоги', 'Долги', 'Оплата', 'Отчёт'].includes(tag)) return 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25';
  if (['Банк', 'ЦБ', 'Минфин', 'Казнач.'].includes(tag)) return 'bg-amber-500/12 text-amber-400 border-amber-500/25';
  if (['Платежи', 'Карты', 'НМПС'].includes(tag)) return 'bg-violet-500/12 text-violet-400 border-violet-500/25';
  if (['ЭЦП', 'ЭДО', 'ЭСФ'].includes(tag)) return 'bg-rose-500/12 text-rose-400 border-rose-500/25';
  if (['1С', 'ERP', 'Учёт', 'ИТ'].includes(tag)) return 'bg-orange-500/12 text-orange-400 border-orange-500/25';
  return 'bg-slate-500/15 text-bx-text border-bx-border';
}

function ServiceCard({ item }: { item: ServiceItem }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    pingUrl(item.url).then(res => {
      if (active) setOk(res);
    });
    return () => { active = false; };
  }, [item.url]);

  return (
    <button
      onClick={() => openLink(item.url)}
      className="group relative flex items-start gap-3.5 p-4 rounded-2xl text-left bg-bx-surface border border-bx-border hover:border-blue-500/40 hover:bg-bx-surface-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden active:scale-[0.98]"
    >
      {/* Light gradient glow effect */}
      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(140px 70px at 15% 0%, rgba(59,130,246,0.12), transparent)' }} />
      
      {/* Icon */}
      <span className="relative flex-shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-bx-bg border border-bx-border group-hover:border-blue-500/20 text-xl transition-colors duration-300">
        {item.icon}
      </span>

      {/* Content */}
      <div className="relative flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">{item.title}</span>
          {item.hot && <span className="flex-shrink-0 text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-extrabold border border-blue-500/25">ЧАСТО</span>}
          {item.tag && <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded border font-bold ${tagClass(item.tag)}`}>{item.tag}</span>}
          
          {/* Pulsing Status Badge */}
          <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
            ok === null ? 'bg-slate-500/10 text-bx-muted'
              : ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              ok === null ? 'bg-slate-500 animate-pulse'
                : ok ? 'bg-emerald-400 animate-pulse'
                : 'bg-red-400 animate-pulse'
            }`} />
            {ok === null ? 'опрос...' : ok ? 'работает' : 'недоступен'}
          </span>
        </div>
        <p className="text-[11px] text-bx-muted leading-relaxed line-clamp-2">{item.desc}</p>
      </div>

      {/* External Link Arrow */}
      <span className="relative text-bx-muted/60 group-hover:text-blue-400 flex-shrink-0 text-xs mt-0.5 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        ↗
      </span>
    </button>
  );
}

export default function Services() {
  const [sections, setSections] = useState<ServiceSection[]>(() => getSectionsSync());
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Sync cloud services from DB
  useEffect(() => { 
    refreshServices().then(setSections).catch(() => { /* Offline fallback */ }); 
  }, []);

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
      {/* ── Левая боковая панель: Категории (Папки) ── */}
      <aside className="w-56 flex-shrink-0 border-r border-bx-border overflow-y-auto bg-bx-surface/10 backdrop-blur-md">
        <div className="px-4 pt-4 pb-2.5">
          <p className="text-[10px] text-bx-muted uppercase tracking-wider font-bold">Разделы сервисов</p>
        </div>
        <nav className="px-2 pb-4 space-y-1">
          <button
            onClick={() => setActiveSection(null)}
            className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs transition-all ${
              !activeSection 
                ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20' 
                : 'text-bx-muted hover:bg-bx-surface/20 hover:text-bx-text'
            }`}
          >
            <span className="flex items-center gap-1.5">📂 Все сервисы</span>
            <span className="text-[10px] text-bx-muted font-mono font-bold">{totalCount}</span>
          </button>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id === activeSection ? null : s.id)}
              className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl text-xs transition-all leading-snug ${
                activeSection === s.id 
                  ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20' 
                  : 'text-bx-muted hover:bg-bx-surface/20 hover:text-bx-text'
              }`}
            >
              <span className="truncate flex items-center gap-1.5">📁 {s.title}</span>
              <span className="text-[10px] text-bx-muted font-mono font-bold flex-shrink-0">{s.items.length}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Правая панель с поиском и сеткой ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header toolbar */}
        <div className="sticky top-0 z-10 px-6 pt-5 pb-3.5 border-b border-bx-border bg-bx-bg/85 backdrop-blur flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              🌐 Навигатор сервисов РУз
            </h1>
            <p className="text-[11px] text-bx-muted">
              Каталог официальных ресурсов для бухгалтера с автоматической проверкой доступности
            </p>
          </div>

          <div className="relative w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию или тегам..."
              className="w-full bg-bx-surface text-bx-text placeholder-bx-muted text-xs pl-9 pr-3 py-2 rounded-xl border border-bx-border-2 focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-bx-muted hover:text-bx-text text-sm">×</button>
            )}
          </div>
        </div>

        {/* Scrollable grid area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8 custom-scrollbar">
          {/* Frequently used cards */}
          {showHot && (
            <section className="space-y-3.5">
              <h2 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <span className="w-1.5 h-3 rounded-full bg-blue-500" /> 
                Часто используемые
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {hotItems.map(item => <ServiceCard key={'hot-' + item.url + item.title} item={item} />)}
              </div>
            </section>
          )}

          {/* Categorized lists */}
          {filtered.map(section => (
            <section key={section.id} className="space-y-3">
              <h2 className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider border-b border-bx-border/30 pb-1.5">
                <span>{section.title}</span>
                <span className="text-[10px] text-bx-muted font-mono font-bold bg-bx-surface-2 px-2 py-0.5 rounded-full">{section.items.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {section.items.map(item => <ServiceCard key={item.url + item.title} item={item} />)}
              </div>
            </section>
          ))}

          {/* Empty search fallback */}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-xs text-bx-muted">По вашему запросу ничего не найдено</p>
              <button 
                onClick={() => { setSearch(''); setActiveSection(null); }}
                className="text-xs text-blue-400 hover:underline font-bold mt-2"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

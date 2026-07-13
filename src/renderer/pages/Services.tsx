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

export default function Services() {
  const [sections, setSections] = useState<ServiceSection[]>(() => getSectionsSync());
  const [search, setSearch] = useState('');

  // Подтягивание облачных сервисов
  useEffect(() => { 
    refreshServices().then(setSections).catch(() => { /* Offline fallback */ }); 
  }, []);

  const q = search.toLowerCase().trim();

  const filteredSections = useMemo(() => {
    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          !q || 
          item.title.toLowerCase().includes(q) || 
          item.desc.toLowerCase().includes(q) || 
          item.tag?.toLowerCase().includes(q)
        )
      }))
      .filter(s => s.items.length > 0);
  }, [sections, q]);

  return (
    <div className="flex-1 flex flex-col bg-bx-bg overflow-hidden z-10 font-sans">
      
      {/* Шапка навигатора */}
      <div className="flex-shrink-0 border-b border-bx-border px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-0.5">
          <h1 className="text-base font-extrabold text-bx-text tracking-wide flex items-center gap-2">
            🌐 Полезные сервисы РУз
          </h1>
          <p className="text-[11px] text-bx-muted">
            Быстрый и чистый каталог официальных веб-ресурсов для бухгалтера
          </p>
        </div>

        {/* Ультра-минималистичный поиск */}
        <div className="relative w-64">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию или теме..."
            className="w-full bg-bx-surface/40 text-bx-text placeholder-bx-muted text-xs pl-4.5 pr-8 py-2 rounded-xl border border-bx-border-2 focus:outline-none focus:border-blue-500/40 transition-colors shadow-sm"
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bx-muted hover:text-bx-text text-sm"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Контентная область */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
        {filteredSections.map(section => (
          <section key={section.id} className="space-y-4">
            <h2 className="text-xs font-black text-bx-muted uppercase tracking-wider border-b border-bx-border/30 pb-2">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {section.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => openLink(item.url)}
                  className="text-left bg-bx-surface/20 hover:bg-bx-surface/50 border border-bx-border rounded-xl p-4 flex items-start gap-3.5 transition-all group active:scale-[0.98]"
                >
                  <span className="w-9 h-9 rounded-lg bg-bx-surface border border-bx-border-2 flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon || '🔗'}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-bx-text group-hover:text-blue-400 transition-colors truncate">
                        {item.title}
                      </span>
                      {item.tag && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400/80">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-bx-muted leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                  <span className="text-[10px] text-bx-muted opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    ➔
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-16">
            <span className="text-2xl block mb-1">🔍</span>
            <p className="text-xs text-bx-muted">По вашему запросу сервисов не найдено</p>
            <button 
              onClick={() => setSearch('')}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold mt-1.5"
            >
              Сбросить поиск
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

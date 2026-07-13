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
    <div className="flex-1 flex flex-col bg-bx-bg overflow-hidden z-10 font-sans text-bx-text">
      
      {/* Шапка навигатора */}
      <div className="flex-shrink-0 border-b border-bx-border px-6 py-4 flex items-center justify-between gap-4 flex-wrap bg-bx-surface shadow-sm">
        <div className="space-y-0.5">
          <h1 className="text-base font-extrabold text-bx-text tracking-wide uppercase flex items-center gap-2">
            🌐 Полезные сервисы РУз
          </h1>
          <p className="text-[11px] text-bx-muted">
            Быстрый интерактивный каталог официальных электронных ресурсов и госуслуг
          </p>
        </div>

        {/* Ультра-минималистичный поиск */}
        <div className="relative w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bx-muted text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию или теме..."
            className="w-full bg-bx-surface-2 text-bx-text placeholder-bx-muted text-xs pl-9 pr-8 py-2 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/40 transition-colors shadow-inner"
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bx-muted hover:text-bx-text text-sm font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Контентная область */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
        {filteredSections.map(section => (
          <section key={section.id} className="space-y-4">
            <h2 className="text-xs font-black text-bx-text uppercase tracking-widest border-b border-bx-border pb-2">
              {section.title}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => openLink(item.url)}
                  className="text-left bg-bx-surface hover:border-blue-500/30 border border-bx-border rounded-2xl p-4.5 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-md group active:scale-[0.98] cursor-pointer"
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <span className="w-9 h-9 rounded-xl bg-bx-surface-2 border border-bx-border flex items-center justify-center text-lg flex-shrink-0 shadow-inner">
                        {item.icon || '🔗'}
                      </span>
                      {item.tag && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-bx-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-bx-muted leading-relaxed mt-1 line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-bx-border/50 pt-2.5 mt-3 w-full text-[10px] text-bx-muted font-bold flex justify-between items-center">
                    <span className="truncate max-w-[120px] font-mono text-[9px] opacity-80">{item.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">Перейти ↗</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-20 bg-bx-surface border border-bx-border border-dashed rounded-2xl">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-xs font-bold">Сервисов не найдено</p>
            <p className="text-[10px] text-bx-muted mt-1">Попробуйте изменить поисковый запрос</p>
            <button 
              onClick={() => setSearch('')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold mt-2 cursor-pointer"
            >
              Сбросить поиск
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

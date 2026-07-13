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
  const [activeSecId, setActiveSecId] = useState<string>('all');

  // Подтягивание облачных сервисов
  useEffect(() => { 
    refreshServices().then(setSections).catch(() => { /* Offline fallback */ }); 
  }, []);

  const q = search.toLowerCase().trim();

  // Отфильтрованные секции и элементы
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
      .filter(s => s.items.length > 0 && (activeSecId === 'all' || s.id === activeSecId));
  }, [sections, q, activeSecId]);

  return (
    <div className="flex-1 flex overflow-hidden bg-bx-bg text-bx-text font-sans">
      
      {/* Левая панель: Категории сервисов и Поиск */}
      <aside className="w-68 flex-shrink-0 border-r border-bx-border flex flex-col bg-bx-surface/10 backdrop-blur-md">
        {/* Поиск */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по сервисам..."
              className="w-full bg-bx-surface-2 text-bx-text placeholder-bx-muted pl-9 pr-3 py-2 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 text-xs transition-colors"
            />
          </div>
        </div>

        {/* Заголовок разделов */}
        <div className="px-3 pb-2 flex-shrink-0 border-b border-bx-border/40 flex items-center justify-between">
          <span className="text-[10px] font-bold text-bx-muted uppercase tracking-wider">Категории услуг</span>
          {search.trim() && (
            <button 
              onClick={() => setSearch('')}
              className="text-[10px] text-blue-500 hover:underline font-semibold"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Список разделов */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 custom-scrollbar">
          <button
            onClick={() => { setActiveSecId('all'); }}
            className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              activeSecId === 'all' 
                ? 'bg-blue-600/10 border-blue-500/10 text-blue-500 font-extrabold shadow-sm shadow-blue-500/5' 
                : 'hover:bg-bx-surface/20 border-transparent text-bx-text'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm flex-shrink-0">🌐</span>
              <span className="text-xs truncate font-semibold">Все разделы</span>
            </div>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              activeSecId === 'all' ? 'bg-blue-500/20 text-blue-500' : 'bg-bx-surface-2 text-bx-muted'
            }`}>
              {sections.reduce((acc, s) => acc + s.items.length, 0)}
            </span>
          </button>

          {sections.map(s => {
            const count = s.items.length;
            const isSel = activeSecId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveSecId(s.id); }}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                  isSel 
                    ? 'bg-blue-600/10 border-blue-500/10 text-blue-500 font-extrabold shadow-sm shadow-blue-500/5' 
                    : 'hover:bg-bx-surface/20 border-transparent text-bx-text'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm flex-shrink-0">📁</span>
                  <span className="text-xs truncate font-semibold">{s.title}</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  isSel ? 'bg-blue-500/20 text-blue-500' : 'bg-bx-surface-2 text-bx-muted'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Правая панель: Сетка карточек сервисов */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
        {/* Шапка навигатора */}
        <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm">
          <h1 className="text-sm font-extrabold text-bx-text tracking-wide uppercase flex items-center gap-2">
            🌐 Полезные сервисы РУз
          </h1>
          <p className="text-[11px] text-bx-muted mt-1 leading-relaxed">
            Быстрый интерактивный каталог официальных электронных ресурсов и госуслуг Республики Узбекистан
          </p>
        </div>

        {filteredSections.map(section => (
          <section key={section.id} className="space-y-4">
            <h2 className="text-xs font-black text-bx-text uppercase tracking-widest border-b border-bx-border pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-500 rounded-full" />
              {section.title}
              <span className="text-[10px] font-mono text-bx-muted bg-bx-surface-2 px-1.5 py-0.5 rounded-full">
                {section.items.length}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => openLink(item.url)}
                  className="text-left bg-bx-surface hover:border-blue-500/40 border border-bx-border rounded-2xl p-4.5 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-md group active:scale-[0.98] cursor-pointer"
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
            <p className="text-[10px] text-bx-muted mt-1">Попробуйте изменить поисковый запрос или выбрать другой раздел</p>
            <button 
              onClick={() => { setSearch(''); setActiveSecId('all'); }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold mt-2 cursor-pointer"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

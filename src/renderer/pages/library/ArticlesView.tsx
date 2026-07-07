import React, { useState, useMemo, useRef, useEffect } from 'react';
import { KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, type KbArticle } from '../../data/knowledge';
import { Icon, catColor, readMinutes, excerpt, highlight } from './shared';
import ArticleReader from './ArticleReader';

// Зона «Статьи» объединённой Базы знаний: левая панель с категориями и
// списком, лендинг с плитками категорий и популярным, просмотр статьи.

interface Props {
  articles: KbArticle[];
  activeId: string | null;
  onOpen: (id: string | null) => void;
}

export default function ArticlesView({ articles, activeId, onOpen }: Props) {
  const [category, setCategory] = useState('Все');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let list = category === 'Все' ? articles : articles.filter(a => a.category === category);
    if (search.trim()) {
      const ql = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(ql) || a.body.toLowerCase().includes(ql) || a.tags.some(t => t.toLowerCase().includes(ql)));
    }
    return list;
  }, [articles, category, search]);

  const active: KbArticle | null = activeId ? (articles.find(a => a.id === activeId) ?? null) : null;
  const popular = useMemo(
    () => KB_POPULAR_IDS.map(id => articles.find(a => a.id === id)).filter(Boolean) as KbArticle[],
    [articles],
  );

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [activeId]);

  const open = (a: KbArticle) => onOpen(a.id);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Левая панель ── */}
      <aside className="w-64 flex-shrink-0 border-r border-bx-border flex flex-col">
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bx-muted"><Icon name="search" className="w-3.5 h-3.5" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по статьям…"
              className="w-full bg-bx-bg text-bx-text pl-8 pr-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-xs transition-colors" />
          </div>
        </div>

        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {KB_CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setSearch(''); }}
              className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${category === c && !search ? 'bg-blue-600/30 text-blue-400' : 'text-bx-muted hover:text-bx-muted'}`}>{c}</button>
          ))}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {filtered.map(a => {
            const cc = catColor(a.category);
            return (
              <button key={a.id} onClick={() => open(a)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${activeId === a.id ? 'bg-blue-600/20' : 'hover:bg-bx-border'}`}>
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}><Icon name={KB_CATEGORY_META[a.category]?.icon ?? 'book'} className="w-3 h-3" /></span>
                  <p className={`text-xs font-medium leading-tight ${activeId === a.id ? 'text-blue-400' : 'text-bx-text'}`}>{a.title}</p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-bx-muted text-center py-6 px-2">Ничего не найдено</p>}
        </nav>
      </aside>

      {/* ── Главная часть ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {active ? (
          <ArticleReader
            article={active}
            articles={articles}
            search={search}
            onOpen={open}
            onBack={() => onOpen(null)}
            onCategory={c => { setCategory(c); onOpen(null); }}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-8 py-8">
            {search.trim() ? (
              <div>
                <p className="text-xs text-bx-muted mb-3">Найдено: {filtered.length}</p>
                <div className="space-y-2">
                  {filtered.map(a => {
                    const cc = catColor(a.category);
                    return (
                      <button key={a.id} onClick={() => open(a)} className="w-full text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-xl px-4 py-3 flex items-start gap-3 transition-colors group">
                        <span className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}><Icon name={KB_CATEGORY_META[a.category]?.icon ?? 'book'} className="w-4 h-4" /></span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-bx-text group-hover:text-blue-400 transition-colors">{highlight(a.title, search)}</p>
                          <p className="text-xs text-bx-muted mt-0.5 truncate">{excerpt(a.body)}</p>
                        </div>
                      </button>
                    );
                  })}
                  {filtered.length === 0 && <p className="text-sm text-bx-muted text-center py-10">Ничего не найдено. Попробуйте другой запрос.</p>}
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xs font-semibold text-bx-muted uppercase tracking-wide mb-3">Категории</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
                  {KB_CATEGORIES.slice(1).map(c => {
                    const meta = KB_CATEGORY_META[c]; const cc = catColor(c);
                    const count = articles.filter(a => a.category === c).length;
                    const first = articles.find(a => a.category === c);
                    return (
                      <button key={c} onClick={() => { if (first) open(first); }}
                        className={`text-left bg-bx-surface border border-bx-border ${cc.ring} rounded-2xl p-4 transition-colors group`}>
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cc.bg} ${cc.text}`}><Icon name={meta?.icon ?? 'book'} className="w-5 h-5" /></span>
                        <p className="text-sm font-semibold text-bx-text group-hover:text-blue-400 transition-colors">{c}</p>
                        <p className="text-[11px] text-bx-muted mt-1 leading-snug">{meta?.desc}</p>
                        <p className={`text-[10px] mt-2 ${cc.text}`}>{count} {count === 1 ? 'статья' : 'статей'}</p>
                      </button>
                    );
                  })}
                </div>

                <h3 className="text-xs font-semibold text-bx-muted uppercase tracking-wide mb-3">Популярное</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {popular.map((a, i) => {
                    const cc = catColor(a.category);
                    return (
                      <button key={a.id} onClick={() => open(a)} className="w-full text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors group">
                        <span className="text-base font-bold text-bx-muted w-5 flex-shrink-0">{i + 1}</span>
                        <span className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}><Icon name={KB_CATEGORY_META[a.category]?.icon ?? 'book'} className="w-4 h-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-bx-text group-hover:text-blue-400 transition-colors truncate">{a.title}</p>
                          <p className="text-[10px] text-bx-muted">{a.category} · {readMinutes(a.body)} мин</p>
                        </div>
                        <span className="text-bx-muted group-hover:text-blue-400 transition-colors flex-shrink-0"><Icon name="arrowR" className="w-4 h-4" /></span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

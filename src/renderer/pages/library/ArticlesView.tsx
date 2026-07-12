import React, { useState, useMemo, useRef, useEffect } from 'react';
import { KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, type KbArticle } from '../../data/knowledge';
import { Icon, catColor, readMinutes, excerpt, highlight } from './shared';
import ArticleReader from './ArticleReader';

interface Props {
  articles: KbArticle[];
  activeId: string | null;
  onOpen: (id: string | null) => void;
}

export default function ArticlesView({ articles, activeId, onOpen }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Extract all unique tags across all articles
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    articles.forEach(a => {
      if (a.tags) a.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter(a => {
      // 1. Tag filter
      if (selectedTag && !a.tags?.includes(selectedTag)) return false;

      // 2. Text search
      if (search.trim()) {
        const ql = search.toLowerCase().trim();
        const matchesTitle = a.title.toLowerCase().includes(ql);
        const matchesBody = a.body.toLowerCase().includes(ql);
        const matchesTags = a.tags?.some(t => t.toLowerCase().includes(ql));
        if (!matchesTitle && !matchesBody && !matchesTags) return false;
      }

      return true;
    });
  }, [articles, selectedTag, search]);

  const active: KbArticle | null = activeId ? (articles.find(a => a.id === activeId) ?? null) : null;
  const popular = useMemo(
    () => KB_POPULAR_IDS.map(id => articles.find(a => a.id === id)).filter(Boolean) as KbArticle[],
    [articles],
  );

  // Auto-expand folder of active article, or folders matching search
  useEffect(() => {
    if (active) {
      setOpenFolders(prev => ({ ...prev, [active.category]: true }));
    }
  }, [active]);

  useEffect(() => {
    if (search.trim() || selectedTag) {
      const autoExpand: Record<string, boolean> = {};
      filtered.forEach(a => {
        autoExpand[a.category] = true;
      });
      setOpenFolders(prev => ({ ...prev, ...autoExpand }));
    }
  }, [search, selectedTag, filtered]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [activeId]);

  const open = (a: KbArticle) => onOpen(a.id);

  const toggleFolder = (catName: string) => {
    setOpenFolders(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Group filtered articles by category (excluding 'Все' tag itself)
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, KbArticle[]> = {};
    KB_CATEGORIES.forEach(c => {
      if (c !== 'Все') groups[c] = [];
    });
    filtered.forEach(a => {
      if (groups[a.category]) {
        groups[a.category].push(a);
      } else {
        groups[a.category] = [a];
      }
    });
    return groups;
  }, [filtered]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Левая панель: папки и теги ── */}
      <aside className="w-72 flex-shrink-0 border-r border-bx-border flex flex-col bg-bx-surface/10 backdrop-blur-md">
        {/* Search */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted">
              <Icon name="search" className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по статьям..."
              className="w-full bg-bx-surface-2 text-bx-text placeholder-bx-muted pl-9 pr-3 py-2 rounded-xl border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-xs transition-colors"
            />
          </div>
        </div>

        {/* Tag chips */}
        <div className="px-4 pb-3 flex-shrink-0">
          <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider block mb-1.5">Фильтр по тегам</label>
          <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto custom-scrollbar pr-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                !selectedTag 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-bx-surface hover:bg-bx-surface-2 text-bx-muted hover:text-bx-text'
              }`}
            >
              Все
            </button>
            {allTags.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTag(t === selectedTag ? null : t)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  t === selectedTag 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-bx-surface hover:bg-bx-surface-2 text-bx-muted hover:text-bx-text'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>

        {/* Folder Tree */}
        <div className="px-3 pb-2 flex-shrink-0 border-b border-bx-border/40 flex items-center justify-between">
          <span className="text-[10px] font-bold text-bx-muted uppercase tracking-wider">Разделы (Папки)</span>
          {(search || selectedTag) && (
            <button 
              onClick={() => { setSearch(''); setSelectedTag(null); }}
              className="text-[10px] text-blue-400 hover:underline font-semibold"
            >
              Сбросить
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 custom-scrollbar">
          {KB_CATEGORIES.slice(1).map(catName => {
            const catArticles = groupedByCategory[catName] || [];
            const isOpen = !!openFolders[catName];
            const cc = catColor(catName);
            const meta = KB_CATEGORY_META[catName];

            // Hide empty folders if search/filter is active
            if ((search || selectedTag) && catArticles.length === 0) return null;

            return (
              <div key={catName} className="space-y-1">
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(catName)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                    isOpen ? 'bg-bx-surface/30' : 'hover:bg-bx-surface/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm flex-shrink-0">
                      {isOpen ? '📂' : '📁'}
                    </span>
                    <span className="text-xs font-semibold text-bx-text truncate">
                      {catName}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-bx-surface-2 text-bx-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {catArticles.length}
                  </span>
                </button>

                {/* Nested Articles List */}
                {isOpen && (
                  <div className="pl-4 pr-1 space-y-0.5 border-l border-bx-border/40 ml-4 transition-all">
                    {catArticles.map(a => (
                      <button
                        key={a.id}
                        onClick={() => open(a)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all flex items-start gap-2 ${
                          activeId === a.id 
                            ? 'bg-blue-600/15 text-blue-400 font-semibold' 
                            : 'text-bx-muted hover:text-bx-text hover:bg-bx-surface/10'
                        }`}
                      >
                        <span className="mt-0.5 flex-shrink-0">📄</span>
                        <span className="truncate leading-normal flex-1">
                          {a.title}
                        </span>
                      </button>
                    ))}
                    {catArticles.length === 0 && (
                      <div className="text-[10px] text-bx-muted italic px-2.5 py-1">Папка пуста</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-10">
              <span className="text-2xl block mb-1">🔍</span>
              <p className="text-xs text-bx-muted">Ничего не найдено</p>
            </div>
          )}
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
            onCategory={c => { toggleFolder(c); onOpen(null); }}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-8 py-8">
            {search.trim() || selectedTag ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-bx-border/40 pb-2">
                  <p className="text-xs text-bx-muted font-medium">
                    Найдено публикаций: <span className="text-white font-bold">{filtered.length}</span>
                  </p>
                  <button 
                    onClick={() => { setSearch(''); setSelectedTag(null); }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Сбросить
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {filtered.map(a => {
                    const cc = catColor(a.category);
                    return (
                      <button 
                        key={a.id} 
                        onClick={() => open(a)} 
                        className="w-full text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-2xl px-4 py-3.5 flex items-start gap-3.5 transition-all hover:bg-bx-surface-2 group"
                      >
                        <span className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}>
                          <Icon name={KB_CATEGORY_META[a.category]?.icon ?? 'book'} className="w-4.5 h-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${cc.bg} ${cc.text}`}>
                              {a.category}
                            </span>
                            <span className="text-[10px] text-bx-muted">{readMinutes(a.body)} мин</span>
                          </div>
                          <p className="text-sm font-semibold text-bx-text group-hover:text-blue-400 transition-colors leading-tight">
                            {highlight(a.title, search)}
                          </p>
                          <p className="text-xs text-bx-muted mt-1 truncate">{excerpt(a.body)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xs font-semibold text-bx-muted uppercase tracking-wide mb-3">Категории</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-10">
                  {KB_CATEGORIES.slice(1).map(c => {
                    const meta = KB_CATEGORY_META[c]; 
                    const cc = catColor(c);
                    const count = articles.filter(a => a.category === c).length;
                    return (
                      <button 
                        key={c} 
                        onClick={() => { toggleFolder(c); }}
                        className={`text-left bg-bx-surface border border-bx-border hover:border-blue-500/40 rounded-2xl p-4.5 transition-all hover:bg-bx-surface-2 group`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${cc.bg} ${cc.text}`}>
                            <Icon name={meta?.icon ?? 'book'} className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-mono text-bx-muted bg-bx-bg/50 px-1.5 py-0.5 rounded-full">
                            {count}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-bx-text group-hover:text-blue-400 transition-colors">{c}</p>
                        <p className="text-[11px] text-bx-muted mt-1 leading-snug">{meta?.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <h3 className="text-xs font-semibold text-bx-muted uppercase tracking-wide mb-3">Популярное</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {popular.map((a, i) => {
                    const cc = catColor(a.category);
                    return (
                      <button 
                        key={a.id} 
                        onClick={() => open(a)} 
                        className="w-full text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 hover:bg-bx-surface-2 rounded-2xl px-4 py-3.5 flex items-center gap-3.5 transition-all group"
                      >
                        <span className="text-base font-extrabold text-bx-muted/60 w-5 flex-shrink-0">{i + 1}</span>
                        <span className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}>
                          <Icon name={KB_CATEGORY_META[a.category]?.icon ?? 'book'} className="w-4 h-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-bx-text group-hover:text-blue-400 transition-colors truncate">{a.title}</p>
                          <p className="text-[9px] text-bx-muted mt-0.5">{a.category} · {readMinutes(a.body)} мин</p>
                        </div>
                        <span className="text-bx-muted group-hover:text-blue-400 transition-all flex-shrink-0 group-hover:translate-x-0.5">
                          <Icon name="arrowR" className="w-4 h-4" />
                        </span>
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

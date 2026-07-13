import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type KbArticle, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS } from '../../data/knowledge';
import { getAllArticlesSync, refreshArticles } from '../../lib/db/knowledgeRepo';
import { highlight, excerpt, readMinutes } from './shared';
import Icon from '../../lib/ui/Icon';
import ArticleReader from './ArticleReader';
import { usePlan } from '../../lib/plan';
import PaywallModal from '../../components/PaywallModal';

export default function Library() {
  const { plan } = usePlan();
  const [paywall, setPaywall] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [articles, setArticles] = useState<KbArticle[]>(() => getAllArticlesSync());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Подтянуть облачные статьи при открытии
  useEffect(() => {
    if (plan === 'free') return;
    refreshArticles().then(setArticles).catch(() => { void 0 });
  }, [plan]);

  // Открыть статью по ссылке из глобального поиска (?article=id)
  useEffect(() => {
    const id = params.get('article');
    if (id) {
      setActiveId(id);
      params.delete('article');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  // Скролл вверх при смене активной статьи
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeId]);

  // Фильтрация статей
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      // 1. Фильтр по категории
      if (selectedCategory !== 'Все' && a.category !== selectedCategory) return false;

      // 2. Поиск по тексту
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesBody = a.body.toLowerCase().includes(q);
        const matchesTags = a.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesBody && !matchesTags) return false;
      }
      return true;
    });
  }, [articles, selectedCategory, search]);

  const activeArticle = useMemo(() => {
    if (!activeId) return null;
    return articles.find(a => a.id === activeId) || null;
  }, [articles, activeId]);

  const popularArticles = useMemo(() => {
    return KB_POPULAR_IDS.map(id => articles.find(a => a.id === id)).filter(Boolean) as KbArticle[];
  }, [articles]);

  const handleOpenArticle = (id: string) => {
    if (plan === 'free') {
      setPaywall(true);
      return;
    }
    setActiveId(id);
  };

  const handleCategorySelect = (category: string) => {
    if (plan === 'free') {
      setPaywall(true);
      return;
    }
    setSelectedCategory(category);
    setActiveId(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-bx-bg relative">
      
      {/* Левый Сайдбар Базы знаний */}
      <aside className="w-64 flex-shrink-0 border-r border-bx-border bg-bx-surface/20 flex flex-col z-10">
        
        {/* Шапка/Поиск */}
        <div className="p-4 border-b border-bx-border flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Icon name="knowledge" className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-bx-text leading-tight">База знаний</h2>
              <p className="text-[10px] text-bx-muted mt-0.5 truncate">{articles.length} полезных статей</p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted">
              <Icon name="search" className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => {
                if (plan === 'free') {
                  setPaywall(true);
                  return;
                }
                setSearch(e.target.value);
              }}
              placeholder="Поиск статей..."
              className="w-full bg-bx-surface/80 text-bx-text placeholder-bx-muted pl-9 pr-3 py-2 rounded-xl border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-xs transition-colors"
            />
          </div>
        </div>

        {/* Список Категорий */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          <p className="px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-bx-muted">Разделы</p>
          
          {/* Кнопка "Все" */}
          <button
            onClick={() => handleCategorySelect('Все')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all border ${
              selectedCategory === 'Все'
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 font-bold'
                : 'text-bx-muted border-transparent hover:bg-bx-surface/20 hover:text-bx-text'
            }`}
          >
            <span className="text-base leading-none">📚</span>
            <span className="flex-1 text-left">Все публикации</span>
            <span className="text-[10px] font-bold opacity-60 bg-bx-surface-2 px-2 py-0.5 rounded-full">{articles.length}</span>
          </button>

          {KB_CATEGORIES.slice(1).map(catName => {
            const isActive = selectedCategory === catName;
            const meta = KB_CATEGORY_META[catName];
            const count = articles.filter(a => a.category === catName).length;

            return (
              <button
                key={catName}
                onClick={() => handleCategorySelect(catName)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all border ${
                  isActive
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 font-bold'
                    : 'text-bx-muted border-transparent hover:bg-bx-surface/20 hover:text-bx-text'
                }`}
              >
                <span className="text-base leading-none">
                  {catName === 'Налоги и взносы' && '🪙'}
                  {catName === 'Трудовое право' && '👥'}
                  {catName === 'ВЭД и таможня' && '🌍'}
                  {catName === 'ЭДО и E-Imzo' && '🛡️'}
                  {catName === 'Работа с 1С' && '💾'}
                  {catName === 'Штрафы и санкции' && '⚠️'}
                </span>
                <span className="flex-1 text-left truncate">{catName}</span>
                <span className="text-[10px] font-bold opacity-60 bg-bx-surface-2 px-2 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Основная панель */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-bx-bg flex flex-col z-10">
        {activeArticle ? (
          <ArticleReader
            article={activeArticle}
            articles={articles}
            search={search}
            onOpen={a => handleOpenArticle(a.id)}
            onBack={() => setActiveId(null)}
            onCategory={c => { setSelectedCategory(c); setActiveId(null); }}
          />
        ) : (
          <div className="max-w-4xl mx-auto w-full px-6 py-6 space-y-6">
            
            {/* Поисковый режим или отфильтрованные карточки */}
            {search.trim() ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-bx-border/40 pb-2">
                  <p className="text-xs text-bx-muted">
                    Результаты поиска: найдено <span className="text-bx-text font-bold">{filteredArticles.length}</span>
                  </p>
                  <button 
                    onClick={() => setSearch('')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Очистить
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredArticles.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleOpenArticle(a.id)}
                      className="text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all hover:bg-bx-surface-2 group shadow-sm"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/15">
                            {a.category}
                          </span>
                          <span className="text-[10px] text-bx-muted font-mono">{readMinutes(a.body)} мин чтения</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-bx-text leading-snug group-hover:text-blue-400 transition-colors">
                          {highlight(a.title, search)}
                        </h4>
                        <p className="text-xs text-bx-muted leading-relaxed line-clamp-2">
                          {excerpt(a.body)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-bx-border/40 pt-3 mt-1.5 flex-shrink-0">
                        <span className="text-[10px] text-bx-muted truncate font-mono">Источник: {a.source}</span>
                        <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">➔</span>
                      </div>
                    </button>
                  ))}
                  {filteredArticles.length === 0 && (
                    <div className="col-span-2 text-center py-12">
                      <span className="text-3xl block mb-2">🔍</span>
                      <p className="text-xs text-bx-muted">Ничего не найдено. Попробуйте другой запрос.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Сетка всех статей для выбранной категории */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-extrabold text-bx-text uppercase tracking-wider">
                      {selectedCategory === 'Все' ? 'Все публикации' : selectedCategory}
                    </h3>
                    <span className="text-[10px] text-bx-muted font-mono">{filteredArticles.length} статей</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredArticles.map(a => (
                      <button
                        key={a.id}
                        onClick={() => handleOpenArticle(a.id)}
                        className="text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all hover:bg-bx-surface-2 group shadow-sm"
                      >
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/15">
                              {a.category}
                            </span>
                            <span className="text-[10px] text-bx-muted font-mono">{readMinutes(a.body)} мин чтения</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-bx-text leading-snug group-hover:text-blue-400 transition-colors">
                            {a.title}
                          </h4>
                          <p className="text-xs text-bx-muted leading-relaxed line-clamp-2">
                            {excerpt(a.body)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-t border-bx-border/40 pt-3 mt-1.5 flex-shrink-0">
                          <span className="text-[10px] text-bx-muted truncate font-mono">Источник: {a.source}</span>
                          <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">➔</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Популярные статьи на главной (только если выбрано "Все") */}
                {selectedCategory === 'Все' && popularArticles.length > 0 && (
                  <div>
                    <h3 className="text-xs font-extrabold text-bx-text uppercase tracking-wider mb-3">Популярное</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {popularArticles.map((a, i) => (
                        <button 
                          key={a.id} 
                          onClick={() => handleOpenArticle(a.id)} 
                          className="w-full text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 hover:bg-bx-surface-2 rounded-2xl p-4 flex items-center gap-3.5 transition-all group"
                        >
                          <span className="text-sm font-black text-bx-muted/50 w-5 flex-shrink-0">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-bx-text group-hover:text-blue-400 transition-colors truncate">{a.title}</p>
                            <p className="text-[9px] text-bx-muted mt-0.5">{a.category} · {readMinutes(a.body)} мин</p>
                          </div>
                          <span className="text-bx-muted group-hover:text-blue-400 transition-all flex-shrink-0 group-hover:translate-x-0.5">➔</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {paywall && <PaywallModal feature="Доступ к Базе знаний РУз" onClose={() => setPaywall(false)} />}
    </div>
  );
}

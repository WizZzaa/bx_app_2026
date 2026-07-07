import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type KbArticle } from '../../data/knowledge';
import { getAllArticlesSync, refreshArticles } from '../../lib/db/knowledgeRepo';
import { buildIndex, type SearchItem } from '../../lib/searchIndex';
import { Icon, catColor, excerpt, highlight } from './shared';
import ArticlesView from './ArticlesView';
import ReferenceView, { type RefTabId } from './ReferenceView';
import { usePlan } from '../../lib/plan';
import PaywallModal from '../../components/PaywallModal';

// Объединённая «База знаний»: статьи + справочные данные под единым поиском.
// Заменяет прежние /knowledge и /reference (v1.47).

type Zone = 'articles' | 'reference';

// Категория справочной позиции из глобального индекса → вкладка Справочных данных
const REF_TAB_BY_CATEGORY: Record<string, RefTabId> = {
  'Налог': 'finance',
  'Показатель': 'finance',
  'Счёт': 'accounting',
  'Стандарт': 'accounting',
};
const REF_CATEGORIES = new Set(Object.keys(REF_TAB_BY_CATEGORY));

export default function Library({ initialZone }: { initialZone?: Zone }) {
  const { plan } = usePlan();
  const [paywall, setPaywall] = useState(false);
  const [zone, setZone] = useState<Zone>(initialZone ?? 'articles');
  const [refTab, setRefTab] = useState<RefTabId | undefined>();
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState<KbArticle[]>(() => getAllArticlesSync());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refItems, setRefItems] = useState<SearchItem[]>([]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Подтянуть облачные статьи и справочный индекс при открытии
  useEffect(() => {
    if (plan === 'free') return;
    refreshArticles().then(setArticles).catch(() => { void 0 });
    buildIndex().then(items => setRefItems(items.filter(i => REF_CATEGORIES.has(i.category)))).catch(() => { void 0 });
  }, [plan]);

  // Открыть статью по ссылке из ⌘K (?article=id)
  useEffect(() => {
    const id = params.get('article');
    if (id) {
      setZone('articles');
      setActiveId(id);
      params.delete('article');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const foundArticles = useMemo(() => {
    const ql = search.trim().toLowerCase();
    if (!ql) return [];
    return articles.filter(a =>
      a.title.toLowerCase().includes(ql) ||
      a.body.toLowerCase().includes(ql) ||
      a.tags.some(t => t.toLowerCase().includes(ql)),
    ).slice(0, 8);
  }, [articles, search]);

  const foundRef = useMemo(() => {
    const ql = search.trim().toLowerCase();
    if (!ql) return [];
    return refItems.filter(i =>
      i.title.toLowerCase().includes(ql) || i.subtitle.toLowerCase().includes(ql),
    ).slice(0, 8);
  }, [refItems, search]);

  function openArticle(id: string) {
    setZone('articles');
    setActiveId(id);
    setSearch('');
  }
  function openRef(item: SearchItem) {
    setZone('reference');
    setRefTab(REF_TAB_BY_CATEGORY[item.category] ?? 'finance');
    setSearch('');
  }

  if (plan === 'free') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#07090e] relative overflow-hidden">
        {/* Декоративное свечение */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-md w-full bg-[#0b0e17] border border-bx-border rounded-3xl p-8 text-center relative z-10 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-purple-500/10 mb-6">
            🔒
          </div>
          
          <h2 className="text-xl font-extrabold text-white mb-3 tracking-tight">База знаний недоступна</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Доступ к статьям, нормативным справочникам НК РУз, шаблонам документов и умному поиску входит в тарифные планы <span className="text-purple-400 font-bold">Standard</span> и <span className="text-purple-400 font-bold">Premium</span>.
          </p>

          <div className="space-y-3.5 text-left bg-[#121624] border border-bx-border/40 rounded-2xl p-4.5 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Детальный анализ Налогового Кодекса РУз</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Готовые шаблоны договоров, актов и отчетов</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Справочные данные: ставки налогов, БРВ, МРОТ</span>
            </div>
          </div>

          <button
            onClick={() => setPaywall(true)}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-500/10 hover:scale-[1.02]"
          >
            Активировать тариф
          </button>
        </div>

        {paywall && <PaywallModal feature="Доступ к Базе знаний РУз" onClose={() => setPaywall(false)} />}
      </div>
    );
  }
  const showSearchResults = search.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Hero-шапка с единым поиском ── */}
      <div className="flex-shrink-0 border-b border-bx-border px-6 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center flex-shrink-0"><Icon name="book" className="w-5 h-5" /></span>
          <div>
            <h1 className="text-lg font-bold text-bx-text leading-tight">База знаний</h1>
            <p className="text-[11px] text-bx-muted">{articles.length} статей и нормативные справочники РУз</p>
          </div>
        </div>

        <div className="relative max-w-2xl">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bx-muted"><Icon name="search" className="w-4 h-4" /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
            placeholder="Искать по статьям и справочникам: НДС, БРВ, отпускные, счёт 6410…"
            className="w-full bg-bx-surface text-bx-text pl-10 pr-9 py-2.5 rounded-xl border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm shadow-sm transition-colors" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-bx-muted hover:text-bx-text text-lg leading-none">×</button>
          )}
        </div>

        {!showSearchResults && (
          <div className="flex gap-1.5 mt-3">
            {([['articles', 'Статьи'], ['reference', 'Справочные данные']] as const).map(([z, label]) => (
              <button key={z} onClick={() => { setZone(z); setActiveId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${zone === z ? 'bg-blue-600 text-white' : 'bg-bx-border text-bx-muted hover:text-bx-text hover:bg-bx-border-2'}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Тело ── */}
      {showSearchResults ? (
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="max-w-2xl">
            {foundArticles.length === 0 && foundRef.length === 0 && (
              <p className="text-sm text-bx-muted text-center py-12">Ничего не найдено. Попробуйте другой запрос.</p>
            )}

            {foundArticles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[11px] font-semibold text-bx-muted uppercase tracking-wide mb-2">Статьи · {foundArticles.length}</h3>
                <div className="space-y-2">
                  {foundArticles.map(a => {
                    const cc = catColor(a.category);
                    return (
                      <button key={a.id} onClick={() => openArticle(a.id)} className="w-full text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-xl px-4 py-3 flex items-start gap-3 transition-colors group">
                        <span className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}><Icon name="book" className="w-4 h-4" /></span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-bx-text group-hover:text-blue-400 transition-colors">{highlight(a.title, search)}</p>
                          <p className="text-xs text-bx-muted mt-0.5 truncate">{excerpt(a.body)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {foundRef.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold text-bx-muted uppercase tracking-wide mb-2">Справочные данные · {foundRef.length}</h3>
                <div className="space-y-1.5">
                  {foundRef.map((it, i) => (
                    <button key={it.title + i} onClick={() => openRef(it)} className="w-full text-left bg-bx-surface border border-bx-border hover:border-emerald-500/30 rounded-lg px-4 py-2.5 flex items-center gap-3 transition-colors group">
                      <span className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center bg-emerald-500/10 text-emerald-400"><Icon name="table" className="w-3.5 h-3.5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-bx-text group-hover:text-emerald-400 transition-colors truncate">{highlight(it.title, search)}</p>
                        <p className="text-[11px] text-bx-muted truncate">{it.category} · {it.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : zone === 'articles' ? (
        <ArticlesView articles={articles} activeId={activeId} onOpen={setActiveId} />
      ) : (
        <ReferenceView initialTab={refTab} />
      )}
    </div>
  );
}

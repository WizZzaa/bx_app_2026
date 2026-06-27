import React, { useState, useMemo, useRef, useEffect } from 'react';
import { KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, type KbArticle } from '../data/knowledge';

// ── SVG-иконки (Lucide-подобные, без эмодзи) ────────────────────────────────
const PATHS: Record<string, React.ReactNode> = {
  coins: <><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
  alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  arrowR: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
  arrowL: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
};
function Icon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{PATHS[name] ?? null}</svg>;
}

// Цветовые схемы категорий
const COLOR: Record<string, { text: string; bg: string; ring: string }> = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    ring: 'hover:border-blue-500/40' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'hover:border-emerald-500/40' },
  cyan:    { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    ring: 'hover:border-cyan-500/40' },
  purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  ring: 'hover:border-purple-500/40' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'hover:border-amber-500/40' },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/10',     ring: 'hover:border-red-500/40' },
};
const catColor = (cat: string) => COLOR[KB_CATEGORY_META[cat]?.color ?? 'blue'] ?? COLOR.blue;

function readMinutes(body: string): number {
  const words = body.replace(/[#*`>|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 150));
}
function excerpt(body: string): string {
  for (const raw of body.split('\n')) {
    const l = raw.trim();
    if (l && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('-')) {
      return l.replace(/\*\*/g, '').replace(/`/g, '').slice(0, 120);
    }
  }
  return '';
}
function slug(s: string): string { return s.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-|-$/g, ''); }

// ── Рендер тела статьи (с id у заголовков для оглавления) ───────────────────
function renderBody(body: string, q: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let key = 0;
  for (const raw of body.split('\n')) {
    const line = raw.trimEnd();
    if (!line) { nodes.push(<div key={key++} className="h-2.5" />); continue; }
    if (line.startsWith('## ')) {
      const t = line.slice(3);
      nodes.push(<h3 key={key++} id={'h-' + slug(t)} className="scroll-mt-4 text-base font-semibold text-white mt-7 mb-2.5 flex items-center gap-2"><span className="w-1 h-4 bg-blue-500 rounded-full" />{t}</h3>);
      continue;
    }
    if (line.startsWith('> ')) {
      nodes.push(<div key={key++} className="border-l-2 border-amber-500/50 bg-amber-500/5 pl-3 pr-3 py-2 my-2 rounded-r-lg text-[13px] text-amber-200/80 leading-relaxed">{inline(line.slice(2), q)}</div>);
      continue;
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
      if (cells.every(c => /^[-: ]+$/.test(c))) continue;
      const prev = nodes[nodes.length - 1] as any;
      const isHeader = !prev || prev?.props?.['data-row'] !== 'true';
      nodes.push(
        <div key={key++} data-row="true" className={`grid text-[13px] py-2 px-3 ${isHeader ? 'font-semibold text-slate-300 bg-[#0f1117] rounded-t-lg' : 'text-slate-400 border-t border-[#1e2535]'}`} style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
          {cells.map((c, i) => <span key={i} className="pr-2">{inline(c.trim(), q)}</span>)}
        </div>
      );
      continue;
    }
    if (line.startsWith('- ')) {
      nodes.push(<div key={key++} className="flex gap-2.5 text-[13px] text-slate-300 leading-relaxed my-1"><span className="text-blue-500 flex-shrink-0 mt-0.5">•</span><span>{inline(line.slice(2), q)}</span></div>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const n = line.match(/^\d+/)?.[0];
      nodes.push(<div key={key++} className="flex gap-2.5 text-[13px] text-slate-300 leading-relaxed my-1"><span className="text-blue-400 flex-shrink-0 font-medium">{n}.</span><span>{inline(line.replace(/^\d+\.\s/, ''), q)}</span></div>);
      continue;
    }
    if (line.startsWith('`') && line.endsWith('`') && line.length > 2) {
      nodes.push(<code key={key++} className="block bg-[#0f1117] border border-[#1e2535] rounded-lg px-3 py-2 text-[12.5px] text-emerald-400 font-mono my-2 whitespace-pre-wrap">{line.slice(1, -1)}</code>);
      continue;
    }
    nodes.push(<p key={key++} className="text-[13.5px] text-slate-300 leading-[1.7] my-1.5">{inline(line, q)}</p>);
  }
  return nodes;
}
function inline(text: string, q: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-white font-semibold">{highlight(p.slice(2,-2), q)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-[#0f1117] text-emerald-400 font-mono px-1.5 py-0.5 rounded text-[12px]">{p.slice(1,-1)}</code>;
    return highlight(p, q);
  });
}
function highlight(text: string, q: string): React.ReactNode {
  if (!q || q.length < 2) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark className="bg-amber-400/30 text-amber-200 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
}

export default function Knowledge() {
  const [category, setCategory] = useState('Все');
  const [search,   setSearch]   = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let list = category === 'Все' ? KB_ARTICLES : KB_ARTICLES.filter(a => a.category === category);
    if (search.trim()) {
      const ql = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(ql) || a.body.toLowerCase().includes(ql) || a.tags.some(t => t.toLowerCase().includes(ql)));
    }
    return list;
  }, [category, search]);

  const active: KbArticle | null = activeId ? (KB_ARTICLES.find(a => a.id === activeId) ?? null) : null;
  const toc = useMemo(() => active ? active.body.split('\n').filter(l => l.startsWith('## ')).map(l => l.slice(3)) : [], [active]);
  const related = useMemo(() => active ? KB_ARTICLES.filter(a => a.category === active.category && a.id !== active.id).slice(0, 4) : [], [active]);
  const popular = useMemo(() => KB_POPULAR_IDS.map(id => KB_ARTICLES.find(a => a.id === id)).filter(Boolean) as KbArticle[], []);

  function open(a: KbArticle) { setActiveId(a.id); setCopied(false); }
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [activeId]);

  function copyArticle() {
    if (!active) return;
    navigator.clipboard.writeText(active.body).catch(() => { void 0 })
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  function scrollToHeading(t: string) {
    document.getElementById('h-' + slug(t))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Левая панель ── */}
      <aside className="w-64 flex-shrink-0 border-r border-[#1e2535] flex flex-col">
        <button onClick={() => { setActiveId(null); setCategory('Все'); setSearch(''); }}
          className="px-4 pt-5 pb-3 flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
          <span className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center"><Icon name="book" className="w-4 h-4" /></span>
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">База знаний</h1>
            <p className="text-[10px] text-slate-500">{KB_ARTICLES.length} статей · РУз</p>
          </div>
        </button>

        <div className="px-3 pb-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600"><Icon name="search" className="w-3.5 h-3.5" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по статьям…"
              className="w-full bg-[#0f1117] text-slate-200 pl-8 pr-3 py-2 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-xs transition-colors" />
          </div>
        </div>

        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {KB_CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setSearch(''); }}
              className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${category === c && !search ? 'bg-blue-600/30 text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>{c}</button>
          ))}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {filtered.map(a => {
            const cc = catColor(a.category);
            return (
              <button key={a.id} onClick={() => open(a)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${activeId === a.id ? 'bg-blue-600/20' : 'hover:bg-[#1e2535]'}`}>
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}><Icon name={KB_CATEGORY_META[a.category]?.icon ?? 'book'} className="w-3 h-3" /></span>
                  <p className={`text-xs font-medium leading-tight ${activeId === a.id ? 'text-blue-400' : 'text-slate-300'}`}>{a.title}</p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-slate-600 text-center py-6 px-2">Ничего не найдено</p>}
        </nav>
      </aside>

      {/* ── Главная часть ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {active ? (
          <div className="flex max-w-5xl mx-auto">
            {/* Статья */}
            <article className="flex-1 min-w-0 px-8 py-6">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-4">
                <button onClick={() => setActiveId(null)} className="hover:text-slate-400">База знаний</button>
                <Icon name="arrowR" className="w-3 h-3" />
                <button onClick={() => { setCategory(active.category); setActiveId(null); }} className="hover:text-slate-400">{active.category}</button>
              </div>

              <h2 className="text-2xl font-bold text-white leading-tight mb-3">{active.title}</h2>

              <div className="flex items-center gap-3 flex-wrap mb-5 text-[11px]">
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${catColor(active.category).bg} ${catColor(active.category).text}`}>
                  <Icon name={KB_CATEGORY_META[active.category]?.icon ?? 'book'} className="w-3 h-3" />{active.category}
                </span>
                <span className="flex items-center gap-1 text-slate-500"><Icon name="clock" className="w-3 h-3" />{readMinutes(active.body)} мин</span>
                <span className="text-slate-600">Источник: <span className="text-slate-500">{active.source}</span></span>
                <button onClick={copyArticle} className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>
                  <Icon name={copied ? 'check' : 'copy'} className="w-3 h-3" />{copied ? 'Скопировано' : 'Копировать'}
                </button>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5 mb-5 flex gap-2">
                <Icon name="alert" className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300/70 leading-relaxed">Справочный материал. Сверяйтесь с актуальными редакциями НК РУз на lex.uz и разъяснениями soliq.uz.</p>
              </div>

              <div>{renderBody(active.body, search)}</div>

              {related.length > 0 && (
                <div className="mt-10 pt-5 border-t border-[#1e2535]">
                  <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Похожие статьи</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {related.map(r => (
                      <button key={r.id} onClick={() => open(r)} className="text-left bg-[#141820] border border-[#1e2535] hover:border-blue-500/30 rounded-lg px-3 py-2.5 transition-colors group">
                        <p className="text-xs font-medium text-slate-300 group-hover:text-blue-400 transition-colors leading-tight">{r.title}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{readMinutes(r.body)} мин чтения</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Оглавление */}
            {toc.length > 1 && (
              <aside className="w-48 flex-shrink-0 py-6 pr-6 hidden lg:block">
                <div className="sticky top-0">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Содержание</p>
                  <nav className="space-y-1 border-l border-[#1e2535]">
                    {toc.map(t => (
                      <button key={t} onClick={() => scrollToHeading(t)} className="block w-full text-left text-[11px] text-slate-500 hover:text-blue-400 transition-colors pl-3 -ml-px border-l border-transparent hover:border-blue-500 leading-snug py-0.5">{t}</button>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        ) : (
          /* ── Лендинг ── */
          <div className="max-w-4xl mx-auto px-8 py-10">
            <div className="text-center mb-10">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-blue-600/15 text-blue-400 items-center justify-center mb-4"><Icon name="book" className="w-7 h-7" /></span>
              <h1 className="text-2xl font-bold text-white mb-2">База знаний для бухгалтера РУз</h1>
              <p className="text-sm text-slate-500 max-w-lg mx-auto mb-6">Практические гайды по налогам, труду, ВЭД, E-Imzo и 1С. Коротко, по делу, со ссылками на источники.</p>
              <div className="relative max-w-xl mx-auto">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="search" className="w-5 h-5" /></span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Что хотите узнать? Напр.: НДС, отпускные, ЭСФ…"
                  className="w-full bg-[#141820] text-slate-200 pl-12 pr-4 py-3.5 rounded-2xl border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm shadow-lg transition-colors" />
              </div>
            </div>

            {search.trim() ? (
              <div>
                <p className="text-xs text-slate-500 mb-3">Найдено: {filtered.length}</p>
                <div className="space-y-2">
                  {filtered.map(a => {
                    const cc = catColor(a.category);
                    return (
                      <button key={a.id} onClick={() => open(a)} className="w-full text-left bg-[#141820] border border-[#1e2535] hover:border-blue-500/30 rounded-xl px-4 py-3 flex items-start gap-3 transition-colors group">
                        <span className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}><Icon name={KB_CATEGORY_META[a.category]?.icon ?? 'book'} className="w-4 h-4" /></span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{highlight(a.title, search)}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{excerpt(a.body)}</p>
                        </div>
                      </button>
                    );
                  })}
                  {filtered.length === 0 && <p className="text-sm text-slate-600 text-center py-10">Ничего не найдено. Попробуйте другой запрос.</p>}
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Категории</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
                  {KB_CATEGORIES.slice(1).map(c => {
                    const meta = KB_CATEGORY_META[c]; const cc = catColor(c);
                    const count = KB_ARTICLES.filter(a => a.category === c).length;
                    const first = KB_ARTICLES.find(a => a.category === c);
                    return (
                      <button key={c} onClick={() => { if (first) open(first); }}
                        className={`text-left bg-[#141820] border border-[#1e2535] ${cc.ring} rounded-2xl p-4 transition-colors group`}>
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cc.bg} ${cc.text}`}><Icon name={meta?.icon ?? 'book'} className="w-5 h-5" /></span>
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{c}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{meta?.desc}</p>
                        <p className={`text-[10px] mt-2 ${cc.text}`}>{count} {count === 1 ? 'статья' : 'статей'}</p>
                      </button>
                    );
                  })}
                </div>

                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Популярное</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {popular.map((a, i) => {
                    const cc = catColor(a.category);
                    return (
                      <button key={a.id} onClick={() => open(a)} className="w-full text-left bg-[#141820] border border-[#1e2535] hover:border-blue-500/30 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors group">
                        <span className="text-base font-bold text-slate-700 w-5 flex-shrink-0">{i + 1}</span>
                        <span className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${cc.bg} ${cc.text}`}><Icon name={KB_CATEGORY_META[a.category]?.icon ?? 'book'} className="w-4 h-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">{a.title}</p>
                          <p className="text-[10px] text-slate-600">{a.category} · {readMinutes(a.body)} мин</p>
                        </div>
                        <span className="text-slate-700 group-hover:text-blue-400 transition-colors flex-shrink-0"><Icon name="arrowR" className="w-4 h-4" /></span>
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

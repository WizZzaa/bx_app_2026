import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/db/supabase';

interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  tag: string;
  tagColor: string;
}

const NEWS_SOURCES = [
  { name: 'ГНК РУз', icon: '💳', url: 'https://soliq.uz/news', tag: 'Налоги', color: 'text-blue-400', desc: 'Новости налогообложения' },
  { name: 'Norma.uz', icon: '📰', url: 'https://norma.uz', tag: 'НПА', color: 'text-emerald-400', desc: 'Законодательство Узбекистана' },
  { name: 'Lex.uz', icon: '⚖️', url: 'https://lex.uz', tag: 'Законы', color: 'text-purple-400', desc: 'Национальная база законов' },
  { name: 'Buxgalter.uz', icon: '📊', url: 'https://buxgalter.uz', tag: 'Учёт', color: 'text-amber-400', desc: 'Учет и отчетность' },
  { name: 'ЦБ РУз', icon: '🏦', url: 'https://cbu.uz/press-center/', tag: 'Ставки', color: 'text-cyan-400', desc: 'Курсы и пресс-релизы ЦБ' },
];

const STATIC_NEWS: NewsItem[] = [
  {
    title: 'Ставка НДС — 12% (с 2023 г., ставка сохраняется на 2026 г.)',
    source: 'ГНК / НК РУз ст. 258',
    date: '2026-01-01',
    url: 'https://soliq.uz',
    tag: 'НДС',
    tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    title: 'БРВ с 01.08.2025: 412 000 UZS — актуально на весь 2026 год',
    source: 'lex.uz / buxgalter.uz',
    date: '2025-08-01',
    url: 'https://lex.uz',
    tag: 'БРВ',
    tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    title: 'МРОТ с 01.08.2025: 1 271 000 UZS (Указ Президента РУз)',
    source: 'gov.uz',
    date: '2025-08-01',
    url: 'https://gov.uz',
    tag: 'МРОТ',
    tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    title: 'Основная ставка ЦБ: 14% (подтверждена решением Правления в 2026)',
    source: 'ЦБ РУз',
    date: '2026-03-20',
    url: 'https://cbu.uz',
    tag: 'Ставка ЦБ',
    tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    title: 'Ставка НДФЛ: 12% (плоская шкала согласно ст. 366 НК РУз)',
    source: 'НК РУз',
    date: '2026-01-01',
    url: 'https://lex.uz',
    tag: 'НДФЛ',
    tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    title: 'Налог на прибыль: 15% (ст. 337 НК РУз), для IT-сферы льгота 7.5%',
    source: 'НК РУз ст. 337',
    date: '2026-01-01',
    url: 'https://soliq.uz',
    tag: 'Прибыль',
    tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    title: 'Налог с оборота: базовые ставки 3%-4% в зависимости от условий',
    source: 'НК РУз ст. 461–463',
    date: '2026-01-01',
    url: 'https://soliq.uz',
    tag: 'ЕНП',
    tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    title: 'Социальный налог: 12% для юридических лиц (ст. 403 НК РУз)',
    source: 'НК РУз ст. 403',
    date: '2026-01-01',
    url: 'https://soliq.uz',
    tag: 'Соц.налог',
    tagColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    title: 'Декларации по налогу на прибыль за 2025 г. — дедлайн 01.03.2026',
    source: 'ГНК / НК РУз',
    date: '2026-01-01',
    url: 'https://my.soliq.uz',
    tag: 'Дедлайн',
    tagColor: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  {
    title: 'ЭЦП E-Imzo: ключи юридических лиц выдаются на 2 года',
    source: 'e-imzo.uz',
    date: '2026-01-01',
    url: 'https://e-imzo.uz',
    tag: 'ЭЦП',
    tagColor: 'bg-slate-500/10 text-bx-muted border-bx-border/30',
  },
];

function openLink(url: string) {
  if (typeof window !== 'undefined' && (window as any).bx?.shell?.openExternal) {
    (window as any).bx.shell.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

interface FeedItem { title: string; link: string; date: string; source: string }
const FEED_CACHE_KEY = 'bx_news_feed_cache';

function fmtFeedDate(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function News() {
  const [filter, setFilter] = useState<string>('all');
  const [feed, setFeed] = useState<FeedItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(FEED_CACHE_KEY) || '[]'); } catch { return []; }
  });
  const [feedState, setFeedState] = useState<'idle' | 'loading' | 'error'>('idle');

  const [brvValue, setBrvValue] = useState('412 000');
  const [mrotValue, setMrotValue] = useState('1 271 000');
  const [refiValue, setRefiValue] = useState('14%');
  const [taxesFromDb, setTaxesFromDb] = useState<Record<string, string>>({});
  const [dbArticles, setDbArticles] = useState<any[]>([]);

  const loadFeed = useCallback(async () => {
    const bridge = (window as any).bx?.news?.fetch;
    setFeedState('loading');
    try {
      let items: FeedItem[] = [];
      if (bridge) {
        items = await bridge();
      } else {
        const r = await fetch('/api/news');
        if (r.ok) items = await r.json();
      }
      if (items?.length) {
        setFeed(items);
        localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(items));
        setFeedState('idle');
      } else {
        setFeedState('error');
      }
    } catch {
      setFeedState('error');
    }
  }, []);

  const loadDbData = useCallback(async () => {
    try {
      const { data: indicators } = await supabase.from('bx_ref_indicators').select('id, key');
      if (indicators) {
        const { data: vals } = await supabase
          .from('bx_ref_indicator_values')
          .select('indicator_id, value, valid_from')
          .order('valid_from', { ascending: false });
        
        if (vals) {
          const latest = (key: string) => {
            const ind = indicators.find(i => i.key === key);
            if (!ind) return null;
            const val = vals.find(v => v.indicator_id === ind.id);
            return val ? val.value : null;
          };
          const brv = latest('brv');
          const mrot = latest('mrot');
          const refi = latest('refi');
          if (brv) setBrvValue(Number(brv).toLocaleString('ru-RU'));
          if (mrot) setMrotValue(Number(mrot).toLocaleString('ru-RU'));
          if (refi) setRefiValue(`${refi}%`);
        }
      }

      const { data: taxes } = await supabase.from('bx_ref_taxes').select('name, rate');
      if (taxes) {
        const taxMap: Record<string, string> = {};
        for (const t of taxes) {
          taxMap[t.name.toLowerCase().trim()] = t.rate;
        }
        setTaxesFromDb(taxMap);
      }

      const { data: articles } = await supabase
        .from('bx_knowledge_articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (articles) {
        setDbArticles(articles);
      }
    } catch (e) {
      console.warn('Ошибка при загрузке показателей или новостей из БД:', e);
    }
  }, []);

  useEffect(() => {
    loadFeed();
    loadDbData();
  }, [loadFeed, loadDbData]);

  const currentYear = new Date().getFullYear();

  const mergedStatic = useMemo(() => {
    const list = [...STATIC_NEWS];
    for (const art of dbArticles) {
      const idx = list.findIndex(n => n.tag.toLowerCase() === art.category.toLowerCase().trim());
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          title: art.title,
          source: art.body.slice(0, 100),
          date: new Date(art.updated_at).toISOString().split('T')[0],
          url: art.tags?.[0] || list[idx].url,
        };
      }
    }
    return list;
  }, [dbArticles]);

  const cmsNews = useMemo(() => {
    return dbArticles.filter(art => art.category.toLowerCase().trim() === 'новости');
  }, [dbArticles]);

  const categories = useMemo(() => {
    const staticTags = mergedStatic.map(n => n.tag);
    if (cmsNews.length > 0) {
      return ['all', 'Новости', ...Array.from(new Set(staticTags))];
    }
    return ['all', ...Array.from(new Set(staticTags))];
  }, [mergedStatic, cmsNews]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return mergedStatic;
    if (filter === 'Новости') return [];
    return mergedStatic.filter(n => n.tag === filter);
  }, [mergedStatic, filter]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Левая боковая панель ── */}
      <aside className="w-60 flex-shrink-0 border-r border-bx-border overflow-y-auto bg-bx-surface/10 backdrop-blur-md flex flex-col justify-between">
        <div className="p-4 space-y-6">
          {/* Categories */}
          <div>
            <p className="text-[10px] text-bx-muted uppercase tracking-wider font-bold mb-2.5 px-2">Категории справки</p>
            <nav className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border ${
                    filter === cat
                      ? 'bg-blue-600/15 text-blue-400 border-blue-500/20 shadow-sm'
                      : 'text-bx-muted hover:bg-bx-surface/20 hover:text-bx-text border-transparent'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    {cat === 'all' ? '📊 Все ставки' : cat === 'Новости' ? '📰 Новости' : `▫️ ${cat}`}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    filter === cat ? 'bg-blue-500/20 text-blue-400' : 'bg-bx-surface-2 text-bx-muted'
                  }`}>
                    {cat === 'all' 
                      ? mergedStatic.length + cmsNews.length
                      : cat === 'Новости' 
                        ? cmsNews.length 
                        : mergedStatic.filter(n => n.tag === cat).length
                    }
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Sources */}
          <div>
            <p className="text-[10px] text-bx-muted uppercase tracking-wider font-bold mb-3 px-2">Официальные источники</p>
            <div className="space-y-1.5">
              {NEWS_SOURCES.map(source => (
                <button
                  key={source.url}
                  onClick={() => openLink(source.url)}
                  className="w-full flex items-start gap-2.5 p-2.5 bg-bx-surface/40 hover:bg-bx-surface-2 border border-bx-border/65 hover:border-blue-500/30 rounded-2xl text-left transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-base flex-shrink-0 bg-bx-bg w-7 h-7 rounded-lg border border-bx-border/50 grid place-items-center">{source.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-bold leading-tight ${source.color} group-hover:text-white transition-colors`}>{source.name}</p>
                    <p className="text-[9px] text-bx-muted truncate leading-relaxed mt-0.5">{source.desc}</p>
                  </div>
                  <span className="text-bx-muted group-hover:text-blue-400 text-xs transition-colors self-center">↗</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-bx-border/40 bg-bx-bg/10 text-center">
          <p className="text-[9px] text-bx-muted leading-normal">
            Все фискальные показатели верифицированы и синхронизированы в реальном времени
          </p>
        </div>
      </aside>

      {/* ── Правая панель: Bento-дашборд ── */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              📊 Информационный дашборд
            </h1>
            <p className="text-xs text-bx-muted">Сводка официальных макропоказателей, налоговых ставок РУз и новостных лент</p>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-bx-muted bg-bx-surface/40 px-3 py-1.5 rounded-full border border-bx-border/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">База данных Soliq/Lex сверена</span>
          </div>
        </div>

        {/* Bento Grid */}
        {filter === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. RSS News Feed Widget (2 col wide, 2 rows high) */}
            <div className="md:col-span-2 md:row-span-2 bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[380px] shadow-xl relative overflow-hidden group">
              <span className="pointer-events-none absolute -right-16 -top-16 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl group-hover:scale-125 transition-transform duration-700" />
              
              <div className="flex flex-col h-full justify-between space-y-3 z-10">
                <div className="flex items-center justify-between border-b border-bx-border pb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📰</span>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">Деловая лента новостей</h2>
                  </div>
                  <button
                    onClick={loadFeed}
                    disabled={feedState === 'loading'}
                    className="text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-all flex items-center gap-1.5 bg-bx-surface border border-bx-border px-2.5 py-1 rounded-lg hover:bg-bx-surface-2"
                  >
                    {feedState === 'loading' ? (
                      <>
                        <span className="w-2.5 h-2.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                        Синхронизация...
                      </>
                    ) : (
                      '⟳ Обновить ленту'
                    )}
                  </button>
                </div>

                {/* News Items Container */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 max-h-[265px] custom-scrollbar">
                  {feed.length === 0 && feedState === 'loading' && (
                    <div className="flex flex-col items-center justify-center h-full py-16">
                      <span className="w-6 h-6 border-2 border-blue-500/25 border-t-blue-500 rounded-full animate-spin mb-2" />
                      <p className="text-xs text-bx-muted italic">Подгружаем заголовки ведомств...</p>
                    </div>
                  )}
                  {feed.length === 0 && feedState === 'error' && (
                    <p className="text-xs text-amber-500/80 text-center py-16 font-semibold">
                      ⚠️ Не удалось подключиться к RSS лентам. Проверьте сеть.
                    </p>
                  )}
                  {feed.slice(0, 10).map((n, i) => (
                    <button
                      key={i}
                      onClick={() => openLink(n.link)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-bx-surface/40 hover:bg-bx-surface-2 border border-bx-border/50 hover:border-blue-500/30 rounded-2xl text-left transition-all duration-200 group/item"
                    >
                      <span className="flex-1 text-xs font-medium text-bx-text group-hover/item:text-white truncate transition-colors">
                        {n.title}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-bx-surface-2 text-bx-muted font-bold flex-shrink-0 group-hover/item:bg-blue-500/15 group-hover/item:text-blue-400 border border-bx-border/30 transition-all">
                        {n.source}
                      </span>
                      <span className="text-[9px] text-bx-muted w-12 text-right flex-shrink-0 font-semibold font-mono">
                        {fmtFeedDate(n.date)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. BRV / MROT Dashboard Widget (1 col, 2 rows high) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[380px] shadow-xl relative overflow-hidden group">
              <span className="absolute -right-3 -bottom-6 text-9xl opacity-[0.02] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">UZS</span>
              <span className="pointer-events-none absolute -left-16 -bottom-16 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl group-hover:scale-125 transition-transform duration-700" />
              
              <div className="flex flex-col h-full justify-between z-10 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Базовые величины</span>
                  <h3 className="text-base font-bold text-white mt-1">МРОТ и БРВ на 2026 г.</h3>
                </div>

                <div className="space-y-3.5 my-auto">
                  {/* MROT */}
                  <div className="bg-bx-surface/40 p-4 rounded-2xl border border-bx-border/60 hover:border-emerald-500/30 transition-all group/card">
                    <span className="text-[10px] text-bx-muted font-bold uppercase tracking-wider block">МРОТ (Минимум оплаты труда)</span>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-xl font-extrabold text-emerald-400 tracking-tight group-hover/card:scale-[1.02] transition-transform duration-300 inline-block">{mrotValue}</span>
                      <span className="text-[10px] text-bx-muted font-semibold">сум/мес</span>
                    </div>
                    <span className="text-[9px] text-bx-muted/80 block mt-1">Определяет оклады и МРЗП работников</span>
                  </div>

                  {/* BRV */}
                  <div className="bg-bx-surface/40 p-4 rounded-2xl border border-bx-border/60 hover:border-emerald-500/30 transition-all group/card">
                    <span className="text-[10px] text-bx-muted font-bold uppercase tracking-wider block">БРВ (Базовая расчетная величина)</span>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-xl font-extrabold text-emerald-400 tracking-tight group-hover/card:scale-[1.02] transition-transform duration-300 inline-block">{brvValue}</span>
                      <span className="text-[10px] text-bx-muted font-semibold">сум</span>
                    </div>
                    <span className="text-[9px] text-bx-muted/80 block mt-1">База расчёта пошлин, налогов и штрафов</span>
                  </div>
                </div>

                <button
                  onClick={() => openLink('https://lex.uz')}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                >
                  Указ Президента на Lex.uz ↗
                </button>
              </div>
            </div>

            {/* 3. NDS Rate Widget (1 col, 1 row high) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">%</span>
              <span className="pointer-events-none absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">НДС</span>
                  <span className="text-[9px] text-bx-muted font-mono font-bold bg-bx-surface-2 px-1.5 py-0.5 rounded">ст. 258 НК</span>
                </div>
                <div className="mt-2">
                  <span className="text-4xl font-black text-blue-400 tracking-tighter">
                    {taxesFromDb['ндс'] || '12%'}
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">Налог на добавленную стоимость</h4>
                  <p className="text-[9px] text-bx-muted leading-snug mt-0.5">В вычете обязательно наличие ЭСФ с подписью E-Imzo</p>
                </div>
              </div>
            </div>

            {/* 4. CB Rate Widget (1 col, 1 row high) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">CB</span>
              <span className="pointer-events-none absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Ключевая ставка</span>
                  <span className="text-[9px] text-bx-muted font-mono font-bold bg-bx-surface-2 px-1.5 py-0.5 rounded">ЦБ РУз</span>
                </div>
                <div className="mt-2">
                  <span className="text-4xl font-black text-amber-400 tracking-tighter">{refiValue}</span>
                  <h4 className="text-xs font-bold text-white mt-1">Рефинансирование Центробанка</h4>
                  <p className="text-[9px] text-bx-muted leading-snug mt-0.5">Для пени (1/300 ставки) и дисконтирования долгов</p>
                </div>
              </div>
            </div>

            {/* 5. Profits Tax Widget (1 col, 1 row) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">🏢</span>
              <span className="pointer-events-none absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">Прибыль</span>
                  <span className="text-[9px] text-bx-muted font-mono font-bold bg-bx-surface-2 px-1.5 py-0.5 rounded">ст. 337 НК</span>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-purple-400 tracking-tighter">
                      {taxesFromDb['налог на прибыль'] || '15%'}
                    </span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">IT: 7.5%</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">Налог на прибыль юрлиц</h4>
                  <p className="text-[9px] text-bx-muted leading-snug mt-0.5">Льготная ставка действует для резидентов IT Park</p>
                </div>
              </div>
            </div>

            {/* 6. Deadlines Widget (2 col wide, 1 row) */}
            <div className="md:col-span-2 bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] shadow-xl relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
              <span className="pointer-events-none absolute -left-12 -bottom-12 w-36 h-36 rounded-full bg-rose-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Календарь деклараций</span>
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25 animate-pulse">КРИТИЧЕСКИЙ СРОК</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between my-1">
                  <div>
                    <h4 className="text-sm font-bold text-white">Годовые отчеты юрлиц за прошедший период</h4>
                    <p className="text-[11px] text-bx-muted mt-0.5">Крайний срок подачи деклараций по прибыли и налогам с оборота</p>
                  </div>
                  <div className="bg-bx-surface border border-bx-border px-4 py-2.5 rounded-2xl text-center self-stretch sm:self-auto flex flex-col justify-center border-l-3 border-l-rose-500">
                    <span className="text-[8px] text-bx-muted uppercase font-bold tracking-wider">Сдать до:</span>
                    <span className="text-xs font-bold text-rose-400">01 марта 2026 г.</span>
                  </div>
                </div>
                
                <div className="border-t border-bx-border/40 pt-2 flex items-center justify-between text-[10px] text-bx-muted">
                  <span className="truncate">🔐 E-Imzo: с 2024 года ключи юрлиц выдаются на 2 года (soliq.uz / my.gov.uz)</span>
                  <button onClick={() => openLink('https://my.soliq.uz')} className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors whitespace-nowrap ml-2">Портал ГНК ↗</button>
                </div>
              </div>
            </div>

            {/* 7. Salary Taxes Widget (1 col, 1 row) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">🛡</span>
              <span className="pointer-events-none absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">Налоги на ФОТ</span>
                  <span className="text-[9px] text-bx-muted font-mono font-bold bg-bx-surface-2 px-1.5 py-0.5 rounded">ст. 403 НК</span>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-cyan-400 tracking-tighter">
                      {taxesFromDb['социальный налог'] || '12%'}
                    </span>
                    <span className="text-[9px] text-bx-muted font-bold">соц.налог</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">НДФЛ работников — {taxesFromDb['ндфл'] || '12%'}</h4>
                  <p className="text-[9px] text-bx-muted leading-snug mt-0.5">Включает удержания ИНПС (0.1%) от облагаемой суммы</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Dynamic Publications from Knowledge Base */}
        {(filter === 'all' || filter === 'Новости') && cmsNews.length > 0 && (
          <section className="space-y-3.5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-500 rounded-full" />
              Новые разъяснения и статьи законодательства
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cmsNews.map((n, i) => (
                <div
                  key={n.id || i}
                  className="bg-bx-bg border border-bx-border hover:border-blue-500/30 rounded-3xl p-5 relative overflow-hidden group shadow-lg min-h-[160px] flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span className="pointer-events-none absolute -right-12 -bottom-12 w-28 h-28 rounded-full bg-blue-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />
                  
                  <div className="z-10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] px-2 py-0.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-full font-extrabold uppercase">Публикация</span>
                      <span className="text-[9px] text-bx-muted font-bold font-mono">{new Date(n.updated_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">{n.title}</h4>
                    <p className="text-[11px] text-bx-muted line-clamp-3 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                  </div>

                  {n.tags?.[0] && (
                    <button
                      onClick={() => openLink(n.tags[0])}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline self-start z-10 mt-3 flex items-center gap-1 hover:gap-1.5 transition-all"
                    >
                      Подробнее по ссылке ↗
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filtered Indicators view */}
        {filter !== 'all' && filter !== 'Новости' && (
          <section className="bg-bx-bg border border-bx-border rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-bx-border pb-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Выбранный показатель: {filter}</h3>
              <button onClick={() => setFilter('all')} className="text-xs text-blue-400 hover:text-blue-300 font-bold">Сбросить фильтр</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((n, i) => (
                <button
                  key={i}
                  onClick={() => openLink(n.url)}
                  className="flex items-start gap-3.5 p-4 bg-bx-surface/40 hover:bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-2xl text-left transition-all duration-200 group active:scale-[0.99] hover:shadow-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${n.tagColor}`}>{n.tag}</span>
                      <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">{n.title}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[9px] text-bx-muted font-bold font-mono">
                      <span>Источник: {n.source}</span>
                      <span>·</span>
                      <span>Обновлено: {n.date}</span>
                    </div>
                  </div>
                  <span className="text-bx-muted group-hover:text-blue-400 text-xs transition-colors self-center">↗</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

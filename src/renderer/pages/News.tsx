import React, { useState, useEffect } from 'react';

interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  tag: string;
  tagColor: string;
}

// Актуальные ссылки на разделы с новостями законодательства
// (Реального парсинга нет — показываем быстрый переход на источники)
const NEWS_SOURCES = [
  { name: 'ГНК РУз', icon: '💳', url: 'https://soliq.uz/news', tag: 'Налоги', color: 'text-blue-400' },
  { name: 'Norma.uz', icon: '📰', url: 'https://norma.uz', tag: 'НПА', color: 'text-emerald-400' },
  { name: 'Lex.uz', icon: '⚖️', url: 'https://lex.uz', tag: 'Законы', color: 'text-purple-400' },
  { name: 'Buxgalter.uz', icon: '📊', url: 'https://buxgalter.uz', tag: 'Учёт', color: 'text-amber-400' },
  { name: 'ЦБ РУз', icon: '🏦', url: 'https://cbu.uz/press-center/', tag: 'Ставки', color: 'text-cyan-400' },
];

// Статические карточки актуальных изменений 2025–2026
const STATIC_NEWS: NewsItem[] = [
  {
    title: 'Ставка НДС — 12% (с 2023 г., актуально на 2025–2026)',
    source: 'ГНК / НК РУз ст. 258',
    date: '2025-01-01',
    url: 'https://soliq.uz',
    tag: 'НДС',
    tagColor: 'bg-blue-500/10 text-blue-400',
  },
  {
    title: 'БРВ с 01.08.2025: 412 000 UZS — действует на весь 2026',
    source: 'lex.uz / buxgalter.uz (сверено 03.07.2026)',
    date: '2025-08-01',
    url: 'https://lex.uz',
    tag: 'БРВ',
    tagColor: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    title: 'МРОТ с 01.08.2025: 1 271 000 UZS (Указ Президента)',
    source: 'gov.uz (сверено 03.07.2026)',
    date: '2025-08-01',
    url: 'https://gov.uz',
    tag: 'МРОТ',
    tagColor: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    title: 'Основная ставка ЦБ: 14% (с 20.03.2025, подтверждена в 2026)',
    source: 'ЦБ РУз (сверено 03.07.2026)',
    date: '2025-03-20',
    url: 'https://cbu.uz',
    tag: 'Ставка ЦБ',
    tagColor: 'bg-amber-500/10 text-amber-400',
  },
  {
    title: 'Ставка НДФЛ: 12% (плоская, с 2019 г., ст. 366 НК РУз)',
    source: 'НК РУз',
    date: '2025-01-01',
    url: 'https://lex.uz',
    tag: 'НДФЛ',
    tagColor: 'bg-purple-500/10 text-purple-400',
  },
  {
    title: 'Налог на прибыль: 15% (ст. 337 НК РУз), льготы для IT — 7.5%',
    source: 'НК РУз ст. 337',
    date: '2025-01-01',
    url: 'https://soliq.uz',
    tag: 'НнП',
    tagColor: 'bg-blue-500/10 text-blue-400',
  },
  {
    title: 'ЕНП (упрощённый режим): ставка зависит от вида деятельности и региона',
    source: 'НК РУз ст. 461–463',
    date: '2025-01-01',
    url: 'https://soliq.uz',
    tag: 'ЕНП',
    tagColor: 'bg-amber-500/10 text-amber-400',
  },
  {
    title: 'Социальный налог: 12% для юрлиц (ст. 403 НК РУз)',
    source: 'НК РУз ст. 403',
    date: '2025-01-01',
    url: 'https://soliq.uz',
    tag: 'Соц.нал.',
    tagColor: 'bg-cyan-500/10 text-cyan-400',
  },
  {
    title: 'Декларации ЮЛ за 2025 г. — срок сдачи: 01.03.2026',
    source: 'ГНК / НК РУз',
    date: '2026-01-01',
    url: 'https://my.soliq.uz',
    tag: 'Дедлайн',
    tagColor: 'bg-red-500/10 text-red-400',
  },
  {
    title: 'E-Imzo: ключи обновляются через my.gov.uz (с 2024 г. — 2 года)',
    source: 'e-imzo.uz',
    date: '2024-01-01',
    url: 'https://e-imzo.uz',
    tag: 'ЭЦП',
    tagColor: 'bg-slate-500/10 text-slate-400',
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
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function News() {
  const [filter, setFilter] = useState<string>('all');
  const [feed, setFeed] = useState<FeedItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(FEED_CACHE_KEY) || '[]'); } catch { return []; }
  });
  const [feedState, setFeedState] = useState<'idle' | 'loading' | 'error'>('idle');

  const loadFeed = React.useCallback(async () => {
    const bridge = (window as any).bx?.news?.fetch;
    setFeedState('loading');
    try {
      let items: FeedItem[] = [];
      if (bridge) {
        items = await bridge();
      } else {
        // Веб-версия: запрос через Vercel Serverless Proxy
        const r = await fetch('/api/news');
        if (r.ok) {
          items = await r.json();
        }
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

  React.useEffect(() => { loadFeed(); }, [loadFeed]);

  const currentYear = new Date().getFullYear();
  const tags = ['all', ...Array.from(new Set(STATIC_NEWS.map(n => n.tag)))];
  const filtered = filter === 'all' ? STATIC_NEWS : STATIC_NEWS.filter(n => n.tag === filter);
  const hasBridge = true; // Отображаем ленту новостей и в Electron, и в вебе

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Новости и изменения</h1>
        <p className="text-sm text-slate-500 mt-0.5">Деловая лента РУз и ключевые ставки на {currentYear}</p>
      </div>

      {/* Живая лента */}
      {(hasBridge || feed.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">📰 Деловая лента <span className="text-slate-600 font-normal">spot.uz · gazeta.uz</span></h2>
            <button onClick={loadFeed} disabled={feedState === 'loading'}
              className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors">
              {feedState === 'loading' ? 'Обновление…' : '⟳ Обновить'}
            </button>
          </div>
          {feed.length === 0 && feedState === 'loading' && (
            <p className="text-xs text-slate-600 py-3">Загрузка ленты…</p>
          )}
          {feed.length === 0 && feedState === 'error' && (
            <p className="text-xs text-amber-400/80 py-3">Не удалось загрузить ленту — проверьте соединение и нажмите «Обновить».</p>
          )}
          <div className="space-y-1">
            {feed.slice(0, 12).map((n, i) => (
              <button key={i} onClick={() => openLink(n.link)}
                className="w-full flex items-center gap-3 px-3.5 py-2 bg-[#141820] hover:bg-[#1e2535] border border-[#1e2535] hover:border-[#2a3447] rounded-lg text-left transition-all group">
                <span className="flex-1 text-[13px] text-slate-300 group-hover:text-white truncate transition-colors">{n.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 flex-shrink-0">{n.source}</span>
                <span className="text-[10px] text-slate-600 w-12 text-right flex-shrink-0">{fmtFeedDate(n.date)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Источники — быстрый переход */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">📡 Источники — читать онлайн</h2>
        <div className="flex flex-wrap gap-2">
          {NEWS_SOURCES.map(s => (
            <button
              key={s.url}
              onClick={() => openLink(s.url)}
              className="flex items-center gap-2 px-3 py-2 bg-[#141820] hover:bg-[#1e2535] border border-[#1e2535] hover:border-[#2a3447] rounded-lg text-sm text-slate-300 transition-all"
            >
              <span>{s.icon}</span>
              <span className={s.color}>{s.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{s.tag}</span>
              <span className="text-slate-600">↗</span>
            </button>
          ))}
        </div>
      </section>

      {/* Быстрая справка */}
      <section>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-300">📋 Быстрая справка</h2>
          <div className="flex gap-1.5 flex-wrap">
            {tags.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  filter === t ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'Все' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((n, i) => (
            <button
              key={i}
              onClick={() => openLink(n.url)}
              className="w-full flex items-start gap-3 p-3.5 bg-[#141820] hover:bg-[#1e2535] border border-[#1e2535] hover:border-[#2a3447] rounded-xl text-left transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${n.tagColor}`}>{n.tag}</span>
                  <span className="text-sm text-slate-200 group-hover:text-white transition-colors">{n.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>{n.source}</span>
                  <span>·</span>
                  <span>{n.date}</span>
                </div>
              </div>
              <span className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-1 transition-colors">↗</span>
            </button>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-slate-600 pb-2">
        Ключевые ставки в «Быстрой справке» сверены 03.07.2026 (см. Справочники). Всегда проверяйте актуальность на официальных источниках перед применением.
      </p>
    </div>
  );
}

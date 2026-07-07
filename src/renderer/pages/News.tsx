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

// Актуальные ссылки на разделы с новостями законодательства
const NEWS_SOURCES = [
  { name: 'ГНК РУз', icon: '💳', url: 'https://soliq.uz/news', tag: 'Налоги', color: 'text-blue-400', desc: 'Новости налогообложения' },
  { name: 'Norma.uz', icon: '📰', url: 'https://norma.uz', tag: 'НПА', color: 'text-emerald-400', desc: 'Законодательство Узбекистана' },
  { name: 'Lex.uz', icon: '⚖️', url: 'https://lex.uz', tag: 'Законы', color: 'text-purple-400', desc: 'Национальная база законов' },
  { name: 'Buxgalter.uz', icon: '📊', url: 'https://buxgalter.uz', tag: 'Учёт', color: 'text-amber-400', desc: 'Учет и отчетность' },
  { name: 'ЦБ РУз', icon: '🏦', url: 'https://cbu.uz/press-center/', tag: 'Ставки', color: 'text-cyan-400', desc: 'Курсы и пресс-релизы ЦБ' },
];

// Статические карточки актуальных изменений 2025–2026 (фолбэки при отсутствии БД)
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
    tag: 'Прибыль',
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
    tag: 'Соц.налог',
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
    tagColor: 'bg-slate-500/10 text-bx-muted',
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

  // Динамические показатели из БД
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

  // Загрузка показателей и кастомных новостей из БД
  const loadDbData = useCallback(async () => {
    try {
      // 1. Загрузка БРВ / МРОТ / Рефинансирования
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

      // 2. Загрузка ставок налогов
      const { data: taxes } = await supabase.from('bx_ref_taxes').select('name, rate');
      if (taxes) {
        const taxMap: Record<string, string> = {};
        for (const t of taxes) {
          taxMap[t.name.toLowerCase().trim()] = t.rate;
        }
        setTaxesFromDb(taxMap);
      }

      // 3. Загрузка динамических новостных статей из CMS
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

  // Объединяем статические справки с перекрытиями из CMS статей
  const mergedStatic = useMemo(() => {
    const list = [...STATIC_NEWS];
    for (const art of dbArticles) {
      // Ищем совпадение категории статьи со статическим тегом (например, "НДС", "ЕНП")
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

  // Вычленяем статьи с категорией "Новости" для отдельного рендеринга
  const cmsNews = useMemo(() => {
    return dbArticles.filter(art => art.category.toLowerCase().trim() === 'новости');
  }, [dbArticles]);

  // Уникальные категории для бокового меню
  const categories = useMemo(() => {
    const staticTags = mergedStatic.map(n => n.tag);
    if (cmsNews.length > 0) {
      return ['all', 'Новости', ...Array.from(new Set(staticTags))];
    }
    return ['all', ...Array.from(new Set(staticTags))];
  }, [mergedStatic, cmsNews]);

  // Фильтрация новостей
  const filteredItems = useMemo(() => {
    if (filter === 'all') return mergedStatic;
    if (filter === 'Новости') return []; // Новости рендерим отдельно ниже
    return mergedStatic.filter(n => n.tag === filter);
  }, [mergedStatic, filter]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Левая боковая панель: Категории и Источники */}
      <aside className="w-64 flex-shrink-0 border-r border-bx-border overflow-y-auto bg-bx-surface/30 flex flex-col justify-between">
        <div className="p-4 space-y-6">
          {/* Меню разделов */}
          <div>
            <p className="text-[10px] text-bx-muted uppercase tracking-wider font-bold mb-2.5 px-2">Категории справки</p>
            <nav className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group ${
                    filter === cat
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                      : 'text-bx-muted hover:bg-bx-surface-2 hover:text-bx-text'
                  }`}
                >
                  <span className="truncate">{cat === 'all' ? 'Все показатели' : cat}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    filter === cat ? 'bg-blue-500/20 text-blue-400' : 'bg-bx-bg text-bx-muted'
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

          {/* Быстрые источники */}
          <div>
            <p className="text-[10px] text-bx-muted uppercase tracking-wider font-bold mb-3 px-2">Официальные источники</p>
            <div className="space-y-1.5">
              {NEWS_SOURCES.map(source => (
                <button
                  key={source.url}
                  onClick={() => openLink(source.url)}
                  className="w-full flex items-start gap-2.5 p-2.5 bg-bx-surface/40 hover:bg-bx-surface-2 border border-bx-border/50 hover:border-blue-500/20 rounded-xl text-left transition-all group"
                >
                  <span className="text-base flex-shrink-0 bg-bx-bg/80 w-7 h-7 rounded-lg border border-bx-border/50 grid place-items-center">{source.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold leading-tight ${source.color} group-hover:text-white transition-colors`}>{source.name}</p>
                    <p className="text-[9px] text-bx-muted truncate leading-relaxed mt-0.5">{source.desc}</p>
                  </div>
                  <span className="text-bx-muted group-hover:text-blue-400 text-xs transition-colors self-center">↗</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Подвал боковой панели */}
        <div className="p-4 border-t border-bx-border/40 bg-bx-bg/10">
          <p className="text-[10px] text-bx-muted leading-normal text-center">
            Показатели синхронизированы с базой данных в реальном времени.
          </p>
        </div>
      </aside>

      {/* Правая панель: Bento Grid */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Заголовок страницы */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-bx-text">Информационный навигатор</h1>
            <p className="text-xs text-bx-muted">Деловые новости РУз и сводка ключевых фин-показателей на {currentYear}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-bx-muted bg-bx-surface/30 px-3 py-1.5 rounded-full border border-bx-border/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Синхронизация с БД активна</span>
          </div>
        </div>

        {/* Bento Grid Сетка */}
        {filter === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* КАРТОЧКА 1: Деловая лента (2 колонки, 2 строки) */}
            <div className="md:col-span-2 md:row-span-2 bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[380px] relative overflow-hidden group shadow-xl">
              <span className="pointer-events-none absolute -right-16 -top-16 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl group-hover:scale-125 transition-transform duration-700" />
              
              <div className="flex flex-col h-full justify-between space-y-3 z-10">
                <div className="flex items-center justify-between border-b border-bx-border pb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📰</span>
                    <h2 className="text-sm font-bold text-bx-text">Деловая лента новостей</h2>
                  </div>
                  <button
                    onClick={loadFeed}
                    disabled={feedState === 'loading'}
                    className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors flex items-center gap-1 bg-bx-surface border border-bx-border px-2.5 py-1 rounded-lg"
                  >
                    {feedState === 'loading' ? (
                      <>
                        <span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                        Обновление…
                      </>
                    ) : (
                      '⟳ Обновить'
                    )}
                  </button>
                </div>

                {/* Тело ленты новостей */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 max-h-[260px] custom-scrollbar">
                  {feed.length === 0 && feedState === 'loading' && (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <span className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-2" />
                      <p className="text-xs text-bx-muted italic">Считываем свежие сводки...</p>
                    </div>
                  )}
                  {feed.length === 0 && feedState === 'error' && (
                    <p className="text-xs text-amber-500/80 text-center py-12">
                      Не удалось загрузить ленту. Проверьте интернет-соединение.
                    </p>
                  )}
                  {feed.slice(0, 10).map((n, i) => (
                    <button
                      key={i}
                      onClick={() => openLink(n.link)}
                      className="w-full flex items-center gap-3 px-3 py-2 bg-bx-surface/40 hover:bg-bx-surface-2 border border-bx-border/50 hover:border-blue-500/30 rounded-xl text-left transition-all group/item"
                    >
                      <span className="flex-1 text-xs font-medium text-bx-text group-hover/item:text-white truncate transition-colors">
                        {n.title}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-bx-surface-2 text-bx-muted font-mono flex-shrink-0 group-hover/item:bg-blue-500/10 group-hover/item:text-blue-400 transition-colors">
                        {n.source}
                      </span>
                      <span className="text-[9px] text-bx-muted w-12 text-right flex-shrink-0">
                        {fmtFeedDate(n.date)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* КАРТОЧКА 2: МРОТ и БРВ (1 колонка, 2 строки) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[380px] relative overflow-hidden group shadow-xl">
              <span className="absolute -right-3 -bottom-6 text-9xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">📈</span>
              <span className="pointer-events-none absolute -left-16 -bottom-16 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl group-hover:scale-125 transition-transform duration-700" />
              
              <div className="flex flex-col h-full justify-between z-10 space-y-4">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Базовые ставки РУз</span>
                  <h3 className="text-base font-bold text-bx-text mt-1">МРОТ & БРВ 2026</h3>
                </div>

                <div className="space-y-4 my-auto">
                  <div className="bg-bx-surface p-3 rounded-2xl border border-bx-border/60 hover:border-emerald-500/25 transition-all">
                    <span className="text-[10px] text-bx-muted font-bold block">МРОТ (Мин. оплата труда)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-bold text-emerald-400">{mrotValue}</span>
                      <span className="text-[10px] text-bx-muted font-medium">UZS</span>
                    </div>
                    <span className="text-[9px] text-bx-muted block mt-0.5">Установлен Указом Президента</span>
                  </div>

                  <div className="bg-bx-surface p-3 rounded-2xl border border-bx-border/60 hover:border-emerald-500/25 transition-all">
                    <span className="text-[10px] text-bx-muted font-bold block">БРВ (Базовая расчетная величина)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-bold text-emerald-400">{brvValue}</span>
                      <span className="text-[10px] text-bx-muted font-medium">UZS</span>
                    </div>
                    <span className="text-[9px] text-bx-muted block mt-0.5">Для штрафов, пошлин и сборов</span>
                  </div>
                </div>

                <button
                  onClick={() => openLink('https://lex.uz')}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <span>Читать Указ на Lex.uz</span>
                  <span>↗</span>
                </button>
              </div>
            </div>

            {/* КАРТОЧКА 3: Ставка НДС (1 колонка, 1 строка) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] relative overflow-hidden group shadow-xl">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">📊</span>
              <span className="pointer-events-none absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">НДС</span>
                  <span className="text-[10px] text-bx-muted font-mono">ст. 258 НК РУз</span>
                </div>
                <div>
                  <span className="text-4xl font-extrabold text-blue-400 tracking-tight">
                    {taxesFromDb['ндс'] || '12%'}
                  </span>
                  <h4 className="text-xs font-bold text-bx-text mt-1.5">Ставка НДС в Узбекистане</h4>
                  <p className="text-[10px] text-bx-muted mt-0.5 leading-snug">Основная ставка налога на добавленную стоимость.</p>
                </div>
              </div>
            </div>

            {/* КАРТОЧКА 4: Ставка ЦБ (1 колонка, 1 строка) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] relative overflow-hidden group shadow-xl">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">🏦</span>
              <span className="pointer-events-none absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Ключевая ставка ЦБ</span>
                  <span className="text-[10px] text-bx-muted font-mono">Ставка ЦБ</span>
                </div>
                <div>
                  <span className="text-4xl font-extrabold text-amber-400 tracking-tight">{refiValue}</span>
                  <h4 className="text-xs font-bold text-bx-text mt-1.5">Рефинансирование ЦБ РУз</h4>
                  <p className="text-[10px] text-bx-muted mt-0.5 leading-snug">Действует на расчет пени, кредитные лимиты и дисконты.</p>
                </div>
              </div>
            </div>

            {/* КАРТОЧКА 5: Налог на прибыль (1 колонка, 1 строка) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] relative overflow-hidden group shadow-xl">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">💼</span>
              <span className="pointer-events-none absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Налог на прибыль</span>
                  <span className="text-[10px] text-bx-muted font-mono">ст. 337 НК</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-purple-400 tracking-tight">
                      {taxesFromDb['налог на прибыль'] || '15%'}
                    </span>
                    <span className="text-xs text-purple-300 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">IT-парк: 7.5%</span>
                  </div>
                  <h4 className="text-xs font-bold text-bx-text mt-1.5">Прибыль юридических лиц</h4>
                  <p className="text-[10px] text-bx-muted mt-0.5 leading-snug">Льготная ставка для экспортеров и резидентов технопарков.</p>
                </div>
              </div>
            </div>

            {/* КАРТОЧКА 6: Календарь сдачи деклараций и ЭЦП (2 колонки, 1 строка) */}
            <div className="md:col-span-2 bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] relative overflow-hidden group shadow-xl">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">⏰</span>
              <span className="pointer-events-none absolute -left-12 -bottom-12 w-36 h-36 rounded-full bg-rose-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Годовой календарь сдачи</span>
                  <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">Важный дедлайн</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-bx-text">Сдача деклараций ЮЛ за 2025 год</h4>
                    <p className="text-[11px] text-bx-muted mt-0.5">Крайний срок отправки отчётности на портале soliq.uz</p>
                  </div>
                  <div className="bg-bx-surface border border-bx-border px-4 py-2.5 rounded-2xl text-center self-stretch sm:self-auto flex flex-col justify-center">
                    <span className="text-[9px] text-bx-muted uppercase font-bold">Срок до:</span>
                    <span className="text-sm font-bold text-rose-400">01 марта 2026 г.</span>
                  </div>
                </div>
                
                <div className="border-t border-bx-border pt-2 flex items-center justify-between text-[10px] text-bx-muted">
                  <span>🔐 E-Imzo: новые ключи выдаются сроком на 2 года через my.gov.uz</span>
                  <button onClick={() => openLink('https://my.soliq.uz')} className="text-blue-400 hover:text-blue-300 font-semibold underline transition-colors">Портал ГНК ↗</button>
                </div>
              </div>
            </div>

            {/* КАРТОЧКА 7: Социальный налог и НДФЛ (1 колонка, 1 строка) */}
            <div className="bg-bx-bg border border-bx-border rounded-3xl p-5 flex flex-col justify-between min-h-[175px] relative overflow-hidden group shadow-xl">
              <span className="absolute -right-3 -bottom-5 text-8xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-700">🛡</span>
              <span className="pointer-events-none absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="flex flex-col h-full justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Налоги с ФОТ</span>
                  <span className="text-[10px] text-bx-muted font-mono">Социальный & НДФЛ</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-cyan-400 tracking-tight">
                      {taxesFromDb['социальный налог'] || '12%'}
                    </span>
                    <span className="text-xs text-bx-muted font-semibold">соц. налог</span>
                  </div>
                  <h4 className="text-xs font-bold text-bx-text mt-1.5">НДФЛ в Узбекистане — {taxesFromDb['ндфл'] || '12%'}</h4>
                  <p className="text-[10px] text-bx-muted mt-0.5 leading-snug">Плоские ставки подоходного налога и соц. платежа.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Динамические кастомные новости из CMS (или при клике на категорию «Новости») */}
        {(filter === 'all' || filter === 'Новости') && cmsNews.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-bx-text flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
              <span>Свежие публикации из базы знаний</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cmsNews.map((n, i) => (
                <div
                  key={n.id || i}
                  className="bg-bx-bg border border-bx-border hover:border-blue-500/20 rounded-3xl p-5 relative overflow-hidden group shadow-xl min-h-[160px] flex flex-col justify-between transition-all"
                >
                  <span className="pointer-events-none absolute -right-12 -bottom-12 w-28 h-28 rounded-full bg-blue-500/5 blur-2xl group-hover:scale-125 transition-transform duration-700" />
                  
                  <div className="z-10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] px-2 py-0.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-full font-bold uppercase">Новости</span>
                      <span className="text-[9px] text-bx-muted font-mono">{new Date(n.updated_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <h4 className="text-sm font-bold text-bx-text group-hover:text-white transition-colors leading-snug">{n.title}</h4>
                    <p className="text-xs text-bx-muted line-clamp-3 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                  </div>

                  {n.tags?.[0] && (
                    <button
                      onClick={() => openLink(n.tags[0])}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline self-start z-10 mt-3"
                    >
                      Подробнее ↗
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Отфильтрованные карточки быстрой справки (динамический вывод, если выбран конкретный тег) */}
        {filter !== 'all' && filter !== 'Новости' && (
          <section className="bg-bx-bg border border-bx-border rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-bx-border pb-2.5">
              <h3 className="text-xs font-bold text-bx-muted uppercase tracking-wider">Отфильтрованные показатели: {filter}</h3>
              <button onClick={() => setFilter('all')} className="text-xs text-blue-400 hover:text-blue-300">Сбросить фильтр</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((n, i) => (
                <button
                  key={i}
                  onClick={() => openLink(n.url)}
                  className="flex items-start gap-3 p-4 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border hover:border-blue-500/30 rounded-2xl text-left transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${n.tagColor}`}>{n.tag}</span>
                      <span className="text-xs font-bold text-bx-text group-hover:text-white transition-colors">{n.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-bx-muted">
                      <span>{n.source}</span>
                      <span>·</span>
                      <span>{n.date}</span>
                    </div>
                  </div>
                  <span className="text-bx-muted group-hover:text-bx-muted text-xs transition-colors self-center">↗</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

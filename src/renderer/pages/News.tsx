import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/db/supabase';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  url: string;
  tag: string;
  tagColor: string;
  points: string[];
}

const NEWS_SOURCES = [
  { name: 'ГНК РУз', url: 'https://soliq.uz/news' },
  { name: 'Norma.uz', url: 'https://norma.uz' },
  { name: 'Lex.uz', url: 'https://lex.uz' },
  { name: 'Buxgalter.uz', url: 'https://buxgalter.uz' },
  { name: 'ЦБ РУз', url: 'https://cbu.uz/press-center/' },
];

const STATIC_LEGISLATION_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Изменения по НДС на 2026 год',
    source: 'ст. 258 Налогового Кодекса РУз',
    date: '2026-01-01',
    url: 'https://soliq.uz',
    tag: 'Налоги',
    tagColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    points: [
      'Ставка НДС сохраняется на уровне 12% на весь 2026 год.',
      'Для зачета НДС требуется обязательное наличие электронных односторонних актов и счетов-фактур.',
      'Усилен контроль цепочек поставок через фискальные модули ГНК.'
    ]
  },
  {
    id: '2',
    title: 'Ставки МРОТ и БРВ в Узбекистане',
    source: 'Указ Президента РУз',
    date: '2025-08-01',
    url: 'https://lex.uz',
    tag: 'Ставки',
    tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    points: [
      'МРОТ (Минимальный размер оплаты труда) равен 1 271 000 сум в месяц.',
      'БРВ (Базовая расчетная величина) составляет 412 000 сум.',
      'Все расчеты налогов, штрафов, госпошлин и патентов в 2026 году привязаны к БРВ 412 000 сум.'
    ]
  },
  {
    id: '3',
    title: 'Декларация по налогу на прибыль',
    source: 'ГНК / ст. 337 НК РУз',
    date: '2026-01-15',
    url: 'https://my.soliq.uz',
    tag: 'Отчетность',
    tagColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    points: [
      'Базовая ставка налога на прибыль составляет 15%.',
      'Для резидентов IT Park сохраняется льготная ставка налога 7.5%.',
      'Срок подачи годовой декларации за прошедший период — не позднее 1 марта 2026 года.'
    ]
  },
  {
    id: '4',
    title: 'Порядок работы с ЭЦП E-Imzo',
    source: 'e-imzo.uz / Единый реестр',
    date: '2026-02-01',
    url: 'https://e-imzo.uz',
    tag: 'ЭЦП',
    tagColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    points: [
      'Срок действия выпускаемых ключей ЭЦП для юридических лиц и ИП составляет 2 года.',
      'Продление возможно полностью онлайн через OneID на портале my.gov.uz с проверкой Face-ID.',
      'Локальный плагин E-Imzo версии 4.x является обязательным для авторизации на госпорталах.'
    ]
  },
  {
    id: '5',
    title: 'Удержание НДФЛ и ИНПС',
    source: 'НК РУз ст. 366 / ст. 403',
    date: '2026-01-01',
    url: 'https://lex.uz',
    tag: 'Налоги',
    tagColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    points: [
      'Ставка НДФЛ для резидентов сохраняется плоской — 12%.',
      'Размер обязательного социального налога для юридических лиц — 12%.',
      'Обязательные взносы на ИНПС (накопительную пенсию) удерживаются в размере 0.1% от фонда оплаты труда.'
    ]
  }
];

function openLink(url: string) {
  if (typeof window !== 'undefined' && (window as any).bx?.shell?.openExternal) {
    (window as any).bx.shell.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default function News() {
  const [filter, setFilter] = useState<string>('Все');
  const [brvValue, setBrvValue] = useState('412 000');
  const [mrotValue, setMrotValue] = useState('1 271 000');
  const [refiValue, setRefiValue] = useState('14%');
  const [ndsValue, setNdsValue] = useState('12%');

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
        const nds = taxes.find(t => t.name.toLowerCase().trim() === 'ндс');
        if (nds) setNdsValue(nds.rate);
      }
    } catch (e) {
      console.warn('Ошибка загрузки индикаторов из БД:', e);
    }
  }, []);

  useEffect(() => {
    loadDbData();
  }, [loadDbData]);

  const categories = ['Все', 'Налоги', 'Ставки', 'Отчетность', 'ЭЦП'];

  const filteredNews = useMemo(() => {
    if (filter === 'Все') return STATIC_LEGISLATION_NEWS;
    return STATIC_LEGISLATION_NEWS.filter(n => n.tag === filter);
  }, [filter]);

  return (
    <div className="flex-1 flex overflow-hidden bg-bx-bg font-sans text-bx-text">
      
      {/* Левый Сайдбар источников */}
      <aside className="w-64 flex-shrink-0 border-r border-bx-border bg-bx-surface-2/65 dark:bg-bx-surface flex flex-col justify-between overflow-hidden">
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <h2 className="text-xs font-black text-bx-text uppercase tracking-wider px-1">Фильтр по темам</h2>
            <nav className="space-y-1.5 mt-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    filter === cat
                      ? 'bg-blue-600 text-white border-transparent shadow-sm'
                      : 'text-bx-muted hover:bg-bx-surface/80 hover:text-bx-text border-transparent'
                  }`}
                >
                  <span>{cat === 'Все' ? '📚 Все темы' : `▫️ ${cat}`}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    filter === cat ? 'bg-white/20 text-white' : 'bg-bx-surface border border-bx-border text-bx-muted'
                  }`}>
                    {cat === 'Все' 
                      ? STATIC_LEGISLATION_NEWS.length
                      : STATIC_LEGISLATION_NEWS.filter(n => n.tag === cat).length
                    }
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-black text-bx-text uppercase tracking-wider px-1">Ссылки на ведомства</h2>
            <div className="space-y-2 mt-3">
              {NEWS_SOURCES.map(source => (
                <button
                  key={source.url}
                  onClick={() => openLink(source.url)}
                  className="w-full flex items-center justify-between p-3 bg-bx-surface border border-bx-border hover:border-blue-500/20 rounded-xl text-left transition-all hover:bg-bx-surface-2 cursor-pointer shadow-sm"
                >
                  <span className="text-xs font-bold text-bx-text">{source.name}</span>
                  <span className="text-[10px] text-blue-500 font-bold">Открыть ↗</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-bx-border bg-bx-surface-2/20 text-center">
          <p className="text-[9.5px] text-bx-muted leading-relaxed font-semibold">
            Показатели сверены с Налоговым Кодексом Республики Узбекистан на 2026 г.
          </p>
        </div>
      </aside>

      {/* Правая панель: Сетка и Хронология по пунктам */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Шапка новостей */}
        <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-base font-extrabold text-bx-text uppercase tracking-wider flex items-center gap-2">
              ⚖️ Изменения законодательства
            </h1>
            <p className="text-xs text-bx-muted">Ключевые макропоказатели и понятная лента изменений для бухгалтера по пунктам</p>
          </div>
        </div>

        {/* Горизонтальный ряд текущих ставок */}
        {filter === 'Все' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-bx-surface border border-bx-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">БРВ (Базовая величина)</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 leading-none">{brvValue} <span className="text-[10px] text-bx-muted font-bold">сум</span></p>
            </div>
            <div className="bg-bx-surface border border-bx-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">МРОТ (Мин. оплата труда)</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1.5 leading-none">{mrotValue} <span className="text-[10px] text-bx-muted font-bold">сум</span></p>
            </div>
            <div className="bg-bx-surface border border-bx-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">НДС ставка</span>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1.5 leading-none">{ndsValue}</p>
            </div>
            <div className="bg-bx-surface border border-bx-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">Ставка Центробанка</span>
              <p className="text-lg font-black text-amber-600 dark:text-amber-500 mt-1.5 leading-none">{refiValue}</p>
            </div>
          </div>
        )}

        {/* Сетка изменений — адаптивная, как в Шаблонах документов */}
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 items-stretch">
          {filteredNews.map(item => (
            <div
              key={item.id}
              className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-blue-500/30 transition-all relative overflow-hidden group h-full"
            >
              {/* Header карточки */}
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-bx-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                  <h3 className="text-xs font-black text-bx-text uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-bx-muted font-mono font-bold">
                  <span>Источник: {item.source}</span>
                  <span>·</span>
                  <span>{new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Маркированный список ПО ПУНКТАМ */}
              <div className="space-y-2.5">
                {item.points.map((pt, index) => (
                  <div key={index} className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-lg bg-bx-surface-2 border border-bx-border text-bx-text text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
                      {index + 1}
                    </span>
                    <p className="text-xs text-bx-muted leading-relaxed font-semibold">
                      {pt}
                    </p>
                  </div>
                ))}
              </div>

              {/* Ссылка на источник */}
              <div className="pt-2 mt-auto flex justify-end">
                <button
                  onClick={() => openLink(item.url)}
                  className="px-3.5 py-1.5 bg-bx-surface-2 hover:bg-bx-surface border border-bx-border text-bx-text hover:text-blue-600 text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Читать официальный документ ↗
                </button>
              </div>
            </div>
          ))}

          {filteredNews.length === 0 && (
            <div className="col-span-full text-center py-20 bg-bx-surface border border-bx-border border-dashed rounded-2xl text-bx-muted">
              <span className="text-3xl block mb-2">📅</span>
              <p className="text-xs font-bold">Изменений в выбранном разделе пока нет</p>
              <p className="text-[10px] mt-1">Попробуйте выбрать другую тему в меню слева</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

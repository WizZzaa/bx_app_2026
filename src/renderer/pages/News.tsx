import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db/supabase';
import Icon from '../lib/ui/Icon';
import { LEGISLATION_NEWS, type NewsItem } from '../data/newsItems';

const NEWS_SOURCES = [
  { name: 'ГНК РУз', url: 'https://soliq.uz/news' },
  { name: 'Norma.uz', url: 'https://norma.uz' },
  { name: 'Lex.uz', url: 'https://lex.uz' },
  { name: 'Buxgalter.uz', url: 'https://buxgalter.uz' },
  { name: 'ЦБ РУз', url: 'https://cbu.uz/press-center/' },
];

function openLink(url: string) {
  if (typeof window !== 'undefined' && window.bx?.shell?.openExternal) {
    window.bx.shell.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default function News() {
  const navigate = useNavigate();
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
    if (filter === 'Все') return LEGISLATION_NEWS;
    return LEGISLATION_NEWS.filter(n => n.tag === filter);
  }, [filter]);

  const askAiAbout = (item: NewsItem) => navigate('/ai', {
    state: {
      prompt: `Объясни простыми словами, как изменение «${item.title}» влияет на бухгалтера и компанию. Проверь применимость, риски и действия. Данные новости:\n${item.points.map(point => `- ${point}`).join('\n')}\nИсточник: ${item.source}`,
    },
  });

  const createTaskFromNews = (item: NewsItem) => navigate('/planner', {
    state: {
      newTask: {
        title: `Проверить изменение: ${item.title}`,
        note: `Источник: ${item.source}\nСсылка: ${item.url}\n\n${item.points.map((point, index) => `${index + 1}. ${point}`).join('\n')}`,
      },
    },
  });

  return (
    <main className="custom-scrollbar flex-1 overflow-y-auto bg-bx-bg px-5 py-5 text-bx-text sm:px-6">
      <div className="bx-page-container space-y-5">
        <header className="relative overflow-hidden rounded-[28px] border border-bx-border bg-bx-surface p-6 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.08] blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
                  <Icon name="news" className="h-5 w-5" />
                </span>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em]">Проверяемые изменения для бухгалтера</p>
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-bx-text sm:text-3xl">Законодательство без информационного шума</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bx-muted">Ключевые показатели, суть изменений и рабочие действия: открыть официальный источник, разобрать влияние с AI или поставить проверку в план.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate('/ai')} className="flex min-h-11 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-500/15 dark:text-violet-300">
                <Icon name="ai" className="h-4 w-4" />
                Спросить AI
              </button>
              <button onClick={() => navigate('/planner')} className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition-colors hover:bg-blue-500">
                <Icon name="planner" className="h-4 w-4" />
                План работ
              </button>
            </div>
          </div>
        </header>

        {filter === 'Все' && (
          <section aria-label="Ключевые показатели" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'БРВ', hint: 'Базовая величина', value: brvValue, unit: 'сум', tone: 'text-blue-600 dark:text-blue-400' },
              { label: 'МРОТ', hint: 'Минимальная оплата', value: mrotValue, unit: 'сум', tone: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'НДС', hint: 'Базовая ставка', value: ndsValue, unit: '', tone: 'text-violet-600 dark:text-violet-400' },
              { label: 'Ставка ЦБ', hint: 'Основная ставка', value: refiValue, unit: '', tone: 'text-amber-600 dark:text-amber-400' },
            ].map(indicator => (
              <div key={indicator.label} className="rounded-2xl border border-bx-border bg-bx-surface p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-bx-muted">{indicator.label}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" title="Актуальное значение" />
                </div>
                <p className={`mt-3 text-xl font-black tabular-nums ${indicator.tone}`}>{indicator.value} <span className="text-[10px] font-bold text-bx-muted">{indicator.unit}</span></p>
                <p className="mt-1 text-[10px] font-medium text-bx-muted">{indicator.hint}</p>
              </div>
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-bx-border bg-bx-surface p-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap gap-2" aria-label="Фильтр новостей">
              {categories.map(category => {
                const count = category === 'Все' ? LEGISLATION_NEWS.length : LEGISLATION_NEWS.filter(item => item.tag === category).length;
                return (
                  <button key={category} onClick={() => setFilter(category)} aria-pressed={filter === category} className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors ${filter === category ? 'border-blue-600 bg-blue-600 text-white' : 'border-bx-border bg-bx-bg text-bx-muted hover:text-bx-text'}`}>
                    {category}
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${filter === category ? 'bg-white/20' : 'bg-bx-surface-2'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5 xl:ml-auto" aria-label="Официальные источники">
              {NEWS_SOURCES.map(source => (
                <button key={source.url} onClick={() => openLink(source.url)} className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-blue-600 dark:hover:text-blue-400">
                  {source.name}
                  <Icon name="arrowR" className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Лента изменений" className="grid items-stretch gap-4 xl:grid-cols-2">
          {filteredNews.map((item, itemIndex) => (
            <article
              key={item.id}
              className={`group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm transition-colors hover:border-blue-500/30 sm:p-6 ${itemIndex === 0 && filter === 'Все' ? 'xl:col-span-2' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-bx-border pb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-lg border px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] ${item.tagColor}`}>{item.tag}</span>
                    {itemIndex === 0 && filter === 'Все' && <span className="rounded-lg bg-violet-500/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300">Главное</span>}
                  </div>
                  <h2 className="mt-3 text-lg font-black leading-tight tracking-tight text-bx-text transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 sm:text-xl">{item.title}</h2>
                </div>
                <div className="text-right text-[10px] font-semibold leading-relaxed text-bx-muted">
                  <span className="block">{new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="block">Источник: {item.source}</span>
                </div>
              </div>

              <div className={`mt-5 grid gap-3 ${itemIndex === 0 && filter === 'Все' ? 'lg:grid-cols-3' : ''}`}>
                {item.points.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-xl border border-bx-border/70 bg-bx-bg p-3">
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-blue-500/10 text-[10px] font-black text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                    <p className="text-xs font-medium leading-relaxed text-bx-muted">{point}</p>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                <button onClick={() => navigate(`/news/${item.id}`)} className="flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-[10px] font-extrabold text-white transition-colors hover:bg-blue-500">
                  <Icon name="news" className="h-3.5 w-3.5" />
                  Читать материал
                </button>
                <button onClick={() => askAiAbout(item)} className="flex min-h-10 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 text-[10px] font-bold text-violet-700 transition-colors hover:bg-violet-500/15 dark:text-violet-300">
                  <Icon name="ai" className="h-3.5 w-3.5" />
                  Разобрать с AI
                </button>
                <button onClick={() => createTaskFromNews(item)} className="flex min-h-10 items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400">
                  <Icon name="planner" className="h-3.5 w-3.5" />
                  В план работ
                </button>
                <button onClick={() => openLink(item.url)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-[10px] font-bold text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-bx-text xl:ml-auto">
                  Официальный источник
                  <Icon name="arrowR" className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}

          {filteredNews.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-bx-border bg-bx-surface py-16 text-center text-bx-muted">
              <Icon name="news" className="mx-auto h-7 w-7" />
              <p className="mt-3 text-sm font-bold text-bx-text">Изменений в выбранном разделе пока нет</p>
              <p className="mt-1 text-xs">Выберите другую тему.</p>
            </div>
          )}
        </section>

        <p className="pb-4 text-center text-[10px] font-medium leading-relaxed text-bx-muted">Показатели и формулировки требуют проверки по официальным источникам перед принятием решения.</p>
      </div>
    </main>
  );
}

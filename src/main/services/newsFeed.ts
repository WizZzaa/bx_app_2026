// Лента деловых новостей РУз: RSS spot.uz + gazeta.uz.
// Запросы из main-процесса (без CORS). Парсинг без зависимостей.

export interface NewsFeedItem {
  title: string;
  link: string;
  date: string;   // ISO
  source: string; // 'spot.uz' | 'gazeta.uz'
}

const FEEDS: { url: string; source: string; businessOnly?: boolean }[] = [
  { url: 'https://www.spot.uz/rss/', source: 'spot.uz' },
  { url: 'https://www.gazeta.uz/ru/rss/', source: 'gazeta.uz', businessOnly: true },
];

// Ключевые слова деловой тематики — для фильтрации общих лент (gazeta.uz)
const BUSINESS_RE = new RegExp(
  [
    'налог', 'ндс', 'ндфл', 'бюджет', 'банк', 'кредит', 'ставк', 'инфляц',
    'бизнес', 'предприним', 'эконом', 'финанс', 'валют', 'курс', 'сум',
    'тариф', 'штраф', 'мрот', 'брв', 'зарплат', 'пенси', 'таможен',
    'экспорт', 'импорт', 'инвест', 'лиценз', 'закон', 'постановлен', 'указ',
  ].join('|'),
  'i',
);

const UA = 'Mozilla/5.0 (compatible; BX-Accountant-App)';

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .trim();
}

function parseRss(xml: string, source: string): NewsFeedItem[] {
  const items: NewsFeedItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const title = it.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = it.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const pub = it.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    if (!title || !link) continue;
    const d = pub ? new Date(pub) : new Date();
    items.push({
      title: decodeEntities(title),
      link: decodeEntities(link),
      date: isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
      source,
    });
  }
  return items;
}

export async function fetchNewsFeed(): Promise<NewsFeedItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async f => {
      const res = await fetch(f.url, {
        headers: { 'User-Agent': UA },
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`${f.source} HTTP ${res.status}`);
      const items = parseRss(await res.text(), f.source);
      return f.businessOnly ? items.filter(i => BUSINESS_RE.test(i.title)) : items;
    }),
  );
  const all = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
  return all
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 25);
}

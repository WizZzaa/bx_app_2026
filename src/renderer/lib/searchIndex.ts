// Глобальный поиск по приложению: справочники + статьи БЗ + разделы + действия.
import { loadAccounts, loadNsbu, loadTaxes, loadIndicators } from './db/referenceRepo';
import { getAllArticlesSync } from './db/knowledgeRepo';
import { LEGISLATION_NEWS } from '../data/newsItems';
import { UTILITY_PROPOSALS } from '../data/workbenchCatalog';

export interface SearchItem {
  title: string;
  subtitle: string;
  category: string;
  route: string;       // hash-route для перехода
}

export const UTILITY_IDEA_SEARCH_ITEMS: SearchItem[] = UTILITY_PROPOSALS.map(item => ({
  title: item.title,
  subtitle: `${item.sector} · новая идея утилиты`,
  category: 'Идея',
  route: `/tools?tool=${encodeURIComponent(item.id)}`,
}));

// Статичные разделы и быстрые действия
const staticItems: SearchItem[] = [
  { title: 'Рабочий стол', subtitle: 'Главная сводка', category: 'Раздел', route: '/' },
  { title: 'Утилиты', subtitle: '1С, файлы, система, ЭЦП', category: 'Раздел', route: '/tools' },
  { title: 'Переводчик документов', subtitle: 'Узбекский, русский и английский', category: 'Раздел', route: '/translator' },
  { title: 'Очистка кэша 1С', subtitle: 'Утилиты', category: 'Действие', route: '/tools' },
  { title: 'Снятие зависших процессов 1С', subtitle: 'Утилиты', category: 'Действие', route: '/tools' },
  { title: 'Бэкап базы 1С', subtitle: 'Утилиты', category: 'Действие', route: '/tools' },
  { title: 'Конвертер валют на дату', subtitle: 'Утилиты', category: 'Действие', route: '/tools' },
  { title: 'База знаний', subtitle: 'Статьи и справочники', category: 'Раздел', route: '/knowledge' },
  { title: 'Справочники', subtitle: 'Нормативная база', category: 'Раздел', route: '/reference' },
  { title: 'Сервисы', subtitle: 'Госпорталы, ЭДО, банки', category: 'Раздел', route: '/services' },
  { title: 'Калькуляторы', subtitle: 'НДС, НДФЛ, пени', category: 'Раздел', route: '/calc' },
  { title: 'Проверка ИНН', subtitle: 'Контрагенты', category: 'Раздел', route: '/check-inn' },
  { title: 'AI-Консультант', subtitle: 'Налоговый помощник', category: 'Раздел', route: '/ai' },
  { title: 'E-Imzo', subtitle: 'Диагностика ЭЦП', category: 'Действие', route: '/tools' },
  ...UTILITY_IDEA_SEARCH_ITEMS,
];

let cache: SearchItem[] | null = null;

export async function buildIndex(): Promise<SearchItem[]> {
  if (cache) return cache;
  const items = [...staticItems];

  const [taxes, indicators, accounts, nsbu] = await Promise.all([
    loadTaxes(), loadIndicators(), loadAccounts(), loadNsbu(),
  ]);

  for (const t of taxes.data) items.push({ title: t.name, subtitle: `Ставка ${t.rate}`, category: 'Налог', route: '/reference' });
  for (const i of indicators.data) items.push({ title: i.name, subtitle: i.shortName, category: 'Показатель', route: '/reference' });
  for (const a of accounts) items.push({ title: `${a.code} — ${a.name}`, subtitle: a.account_class, category: 'Счёт', route: '/reference' });
  for (const n of nsbu) items.push({ title: `НСБУ №${n.number}`, subtitle: n.title, category: 'Стандарт', route: '/reference' });
  for (const a of getAllArticlesSync()) items.push({ title: a.title, subtitle: a.category, category: 'Статья', route: `/knowledge?article=${a.id}` });
  for (const item of LEGISLATION_NEWS) items.push({ title: item.title, subtitle: `${item.tag} · ${item.source}`, category: 'Новость', route: `/news/${item.id}` });

  cache = items;
  return items;
}

export function search(items: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items
    .filter(i => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    .slice(0, 12);
}

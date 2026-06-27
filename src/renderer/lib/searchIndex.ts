// Глобальный поиск по приложению: справочники + разделы + действия.
import { loadAccounts, loadNsbu, loadTaxes, loadIndicators } from './db/referenceRepo';

export interface SearchItem {
  title: string;
  subtitle: string;
  category: string;
  route: string;       // hash-route для перехода
}

// Статичные разделы и быстрые действия
const staticItems: SearchItem[] = [
  { title: 'Дашборд', subtitle: 'Рабочий стол', category: 'Раздел', route: '/' },
  { title: 'Утилиты', subtitle: '1С, файлы, система, ЭЦП', category: 'Раздел', route: '/tools' },
  { title: 'Очистка кэша 1С', subtitle: 'Утилиты', category: 'Действие', route: '/tools' },
  { title: 'Снятие зависших процессов 1С', subtitle: 'Утилиты', category: 'Действие', route: '/tools' },
  { title: 'Бэкап базы 1С', subtitle: 'Утилиты', category: 'Действие', route: '/tools' },
  { title: 'Конвертер валют на дату', subtitle: 'Утилиты', category: 'Действие', route: '/tools' },
  { title: 'Справочники', subtitle: 'Нормативная база', category: 'Раздел', route: '/reference' },
  { title: 'Сервисы', subtitle: 'Госпорталы, ЭДО, банки', category: 'Раздел', route: '/services' },
  { title: 'Калькуляторы', subtitle: 'НДС, НДФЛ, пени', category: 'Раздел', route: '/calc' },
  { title: 'Проверка ИНН', subtitle: 'Контрагенты', category: 'Раздел', route: '/check-inn' },
  { title: 'AI-Консультант', subtitle: 'Налоговый помощник', category: 'Раздел', route: '/ai' },
  { title: 'E-Imzo', subtitle: 'Диагностика ЭЦП', category: 'Действие', route: '/tools' },
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

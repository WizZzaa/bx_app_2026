// Шаблоны налогового календаря РУз (повторяющиеся дедлайны).
// ⚠ Сроки требуют сверки с soliq.uz/lex.uz. day = день месяца.
// month: null = ежемесячно; число = конкретный месяц (квартальные/годовые).

export interface TaxDeadline {
  id: string;
  title: string;
  taxType: string;
  kind: 'payment' | 'report';
  day: number;
  month: number | null; // null = каждый месяц
  regime: string;       // 'ОСН' | 'Налог с оборота' | 'все'
  note?: string;
  verified: boolean;
}

export const taxDeadlines: TaxDeadline[] = [
  { id: 'vat-report', title: 'НДС — расчёт (отчёт)', taxType: 'НДС', kind: 'report', day: 20, month: null, regime: 'ОСН', verified: false, note: 'Ежемесячно до 20 числа' },
  { id: 'vat-pay', title: 'НДС — уплата', taxType: 'НДС', kind: 'payment', day: 20, month: null, regime: 'ОСН', verified: false },
  { id: 'pit-report', title: 'НДФЛ и соцналог — расчёт', taxType: 'НДФЛ', kind: 'report', day: 15, month: null, regime: 'все', verified: false, note: 'Ежемесячно до 15 числа' },
  { id: 'pit-pay', title: 'НДФЛ и соцналог — уплата', taxType: 'НДФЛ', kind: 'payment', day: 15, month: null, regime: 'все', verified: false },
  { id: 'turnover-report', title: 'Налог с оборота — расчёт', taxType: 'Оборот', kind: 'report', day: 15, month: null, regime: 'Налог с оборота', verified: false },
  { id: 'turnover-pay', title: 'Налог с оборота — уплата', taxType: 'Оборот', kind: 'payment', day: 15, month: null, regime: 'Налог с оборота', verified: false },
  { id: 'profit-q-report', title: 'Налог на прибыль — расчёт (квартал)', taxType: 'Прибыль', kind: 'report', day: 20, month: 4, regime: 'ОСН', verified: false, note: 'Квартально' },
  { id: 'property-report', title: 'Налог на имущество — расчёт', taxType: 'Имущество', kind: 'report', day: 20, month: 1, regime: 'ОСН', verified: false, note: 'Годовой' },
];

/** Развернуть шаблоны в конкретные даты для заданного месяца (0-индексированный). */
export function deadlinesForMonth(year: number, month0: number, regime?: string): { date: string; deadline: TaxDeadline }[] {
  const month1 = month0 + 1;
  const out: { date: string; deadline: TaxDeadline }[] = [];
  for (const d of taxDeadlines) {
    if (regime && regime !== 'все' && d.regime !== 'все' && d.regime !== regime) continue;
    const matches = d.month === null || d.month === month1;
    if (!matches) continue;
    const day = String(d.day).padStart(2, '0');
    out.push({ date: `${year}-${String(month1).padStart(2, '0')}-${day}`, deadline: d });
  }
  return out;
}

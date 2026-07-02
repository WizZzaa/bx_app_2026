// Производственный календарь РУз: фиксированные праздники + рабочие дни.
// Единый источник для Калькулятора дат, умного календаря на дашбордах и др.
// ⚠ Плавающие праздники (Рамазан/Курбан хайит) зависят от лунного календаря
// и объявляются указом — их здесь нет, сверяйтесь с постановлениями.

export const UZ_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1,  day: 1,  name: 'Новый год' },
  { month: 3,  day: 8,  name: 'Международный женский день' },
  { month: 3,  day: 21, name: 'Навруз' },
  { month: 3,  day: 22, name: 'Навруз (2-й день)' },
  { month: 5,  day: 9,  name: 'День памяти и почестей' },
  { month: 9,  day: 1,  name: 'День независимости' },
  { month: 10, day: 1,  name: 'День учителя' },
  { month: 12, day: 8,  name: 'День Конституции' },
];

export function holidayName(d: Date): string | null {
  const h = UZ_HOLIDAYS.find(h => h.month === d.getMonth() + 1 && h.day === d.getDate());
  return h ? h.name : null;
}

export function isWorkday(d: Date): boolean {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  return !holidayName(d);
}

/** Рабочие дни месяца: всего и сколько осталось (включая сегодня). */
export function workdayStats(year: number, month0: number): { total: number; left: number } {
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month0;
  let total = 0
  let left = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month0, day);
    if (!isWorkday(d)) continue;
    total++;
    if (!isCurrentMonth || day >= now.getDate()) left++;
  }
  return { total, left };
}

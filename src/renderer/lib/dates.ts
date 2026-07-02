// Локальные даты в формате YYYY-MM-DD.
// ⚠ Не использовать new Date(...).toISOString().slice(0,10) для локальных дат:
// toISOString() отдаёт UTC, и в поясе Ташкента (UTC+5) дата уезжает на день назад
// (локальная полночь = 19:00 предыдущего дня по UTC).

/** Дата Date → 'YYYY-MM-DD' в локальном поясе. */
export function toLocalISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Сегодняшняя дата 'YYYY-MM-DD' в локальном поясе. */
export function todayISO(): string {
  return toLocalISO(new Date())
}

/** Дата через n дней (n может быть отрицательным), локальный пояс. */
export function daysFromNowISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toLocalISO(d)
}

/**
 * Следующая дата повторения от базовой 'YYYY-MM-DD'.
 * Месяц/квартал/год: тот же день следующего периода, с зажимом
 * до последнего дня месяца (31 янв + месяц → 28/29 фев).
 */
export function nextRecurrenceISO(baseISO: string, rec: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): string {
  const [y, m, d] = baseISO.split('-').map(Number)
  if (rec === 'weekly') {
    const dt = new Date(y, m - 1, d + 7)
    return toLocalISO(dt)
  }
  const addMonths = rec === 'monthly' ? 1 : rec === 'quarterly' ? 3 : 12
  const targetMonth0 = m - 1 + addMonths
  const lastDay = new Date(y, targetMonth0 + 1, 0).getDate()
  return toLocalISO(new Date(y, targetMonth0, Math.min(d, lastDay)))
}

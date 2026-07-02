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

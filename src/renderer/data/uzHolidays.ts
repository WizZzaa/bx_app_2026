// Производственный календарь Республики Узбекистан на 2026 год.
// Источник: Указ Президента №УП-257 от 24.12.2025 г.
// Постановление Президента (дата Рамазан Хайита = 20 марта 2026).
// Единый источник для Калькулятора дат, умного календаря, планировщика и др.

// ─── Типы ─────────────────────────────────────────────────────────────────────

export type DayType =
  | 'holiday'           // Официальный праздничный нерабочий день
  | 'additional_off'    // Дополнительный выходной день (по указу)
  | 'pre_holiday'       // Предпраздничный укороченный рабочий день (-1 час)
  | 'transferred_off'   // Перенесённый выходной (суббота → другой день)
  | 'transferred_work'  // Перенесённый рабочий день (суббота стала рабочей)

export interface SpecialDay {
  month: number   // 1-12
  day: number     // 1-31
  type: DayType
  name: string
  note?: string   // Дополнительное пояснение
}

export interface MonthNorms {
  month: number   // 1-12
  totalDays: number
  workdays5: number     // при 5-дневной рабочей неделе
  workdays6: number     // при 6-дневной рабочей неделе
  offDays5: number
  offDays6: number
  hours40_5: number     // 5-дневная 40-часовая
  hours40_6: number     // 6-дневная 40-часовая
  hours36_6: number     // 6-дневная 36-часовая
}

export const UZ_PRODUCTION_CALENDAR_YEAR = 2026

export const UZ_PRODUCTION_CALENDAR_2026_SOURCES = [
  {
    shortLabel: 'УП-257',
    label: 'Дополнительные нерабочие дни и переносы в 2026 году',
    url: 'https://president.uz/ru/lists/view/8832',
  },
  {
    shortLabel: 'Рамазан хайит',
    label: 'Постановление о праздновании Рамазан хайита 20 марта 2026 года',
    url: 'https://president.uz/ru/lists/view/9019',
  },
  {
    shortLabel: 'Курбан хайит',
    label: 'Постановление о праздновании Курбан хайита 27 мая 2026 года',
    url: 'https://president.uz/ru/lists/view/9233',
  },
] as const

// ─── Праздничные и особые дни 2026 ────────────────────────────────────────────

export const SPECIAL_DAYS_2026: SpecialDay[] = [
  // ── Январь ──
  { month: 1, day: 1,  type: 'holiday',        name: 'Новый год',                        note: 'Праздничный нерабочий день' },
  { month: 1, day: 2,  type: 'additional_off',  name: 'Дополнительный выходной',           note: 'Дополнительный выходной день для всех' },
  { month: 1, day: 3,  type: 'additional_off',  name: 'Дополнительный выходной',           note: 'Дополнительный выходной при 6-дн.; выходной при 5-дн.' },

  // ── Март ──
  { month: 3, day: 7,  type: 'pre_holiday',     name: 'Предпраздничный день (8 Марта)',    note: 'Укороченный рабочий день при 6-дневной неделе' },
  { month: 3, day: 8,  type: 'holiday',          name: 'Международный женский день',        note: 'Совпадает с воскресеньем → перенос на 9 марта' },
  { month: 3, day: 9,  type: 'transferred_off',  name: 'Перенесённый выходной (8 Марта)',   note: 'Понедельник — дополнительный выходной (ч.2 ст.208 ТК)' },
  { month: 3, day: 19, type: 'pre_holiday',      name: 'Предпраздничный день (Руза хайит)', note: 'Укороченный рабочий день' },
  { month: 3, day: 20, type: 'holiday',          name: 'Руза хайит (Рамазан хайит)',        note: 'Первый день Ийд-ал-Фитр — праздничный нерабочий' },
  { month: 3, day: 21, type: 'holiday',          name: 'Навруз',                            note: 'Совпадает с субботой → перенос на 23 марта для «пятидневки»' },
  { month: 3, day: 23, type: 'transferred_off',  name: 'Перенесённый выходной (Навруз)',    note: 'Понедельник — дополнительный выходной при 5-дневной неделе' },

  // ── Май ──
  { month: 5, day: 8,  type: 'pre_holiday',      name: 'Предпраздничный день (9 Мая)',      note: 'Укороченный рабочий день для всех' },
  { month: 5, day: 9,  type: 'holiday',           name: 'День памяти и почестей',            note: 'Суббота → «пятидневка» отдыхает также 11 мая' },
  { month: 5, day: 11, type: 'transferred_off',   name: 'Перенесённый выходной (9 Мая)',     note: 'Понедельник — дополнительный выходной при 5-дневной неделе' },
  { month: 5, day: 26, type: 'pre_holiday',       name: 'Предпраздничный день (Курбан хайит)', note: 'Укороченный рабочий день' },
  { month: 5, day: 27, type: 'holiday',           name: 'Курбан хайит (Ийд-ал-Адха)',       note: 'Праздничный нерабочий день для всех' },
  { month: 5, day: 28, type: 'additional_off',    name: 'Дополнительный выходной',           note: 'После Курбан хайита' },
  { month: 5, day: 29, type: 'additional_off',    name: 'Дополнительный выходной',           note: 'После Курбан хайита' },
  { month: 5, day: 30, type: 'additional_off',    name: 'Дополнительный выходной',           note: 'Дополнительный выходной при 6-дн.; выходной при 5-дн.' },

  // ── Август ──
  { month: 8, day: 31, type: 'additional_off',    name: 'Дополнительный выходной',           note: 'Перед Днём Независимости' },

  // ── Сентябрь ──
  { month: 9, day: 1,  type: 'holiday',           name: 'День Независимости',                note: 'Праздничный нерабочий день для всех' },
  { month: 9, day: 30, type: 'pre_holiday',        name: 'Предпраздничный день (День Учителя)', note: 'Укороченный рабочий день' },

  // ── Октябрь ──
  { month: 10, day: 1, type: 'holiday',           name: 'День учителя и наставника',         note: 'Праздничный нерабочий день для всех' },

  // ── Декабрь ──
  { month: 12, day: 7,  type: 'pre_holiday',      name: 'Предпраздничный день (День Конституции)', note: 'Укороченный рабочий день' },
  { month: 12, day: 8,  type: 'holiday',           name: 'День Конституции',                  note: 'Праздничный нерабочий день для всех' },
  { month: 12, day: 12, type: 'transferred_work',  name: 'Рабочая суббота (перенос)',          note: 'Суббота 12 декабря — рабочая (перенос выходного на 31 декабря)' },
  { month: 12, day: 31, type: 'transferred_off',   name: 'Перенесённый выходной (с 12 дек.)',  note: 'Дополнительный выходной при 6-дн. за счёт переноса суб. 12 дек.' },
]

// Быстрый lookup: ключ "M-D" → SpecialDay
const _specialDayMap = new Map<string, SpecialDay>()
for (const sd of SPECIAL_DAYS_2026) {
  _specialDayMap.set(`${sd.month}-${sd.day}`, sd)
}

// ─── Нормы рабочего времени по месяцам 2026 ──────────────────────────────────

export const MONTH_NORMS_2026: MonthNorms[] = [
  { month: 1,  totalDays: 31, workdays5: 20, workdays6: 24, offDays5: 11, offDays6: 7,  hours40_5: 160, hours40_6: 160, hours36_6: 144 },
  { month: 2,  totalDays: 28, workdays5: 20, workdays6: 24, offDays5: 8,  offDays6: 4,  hours40_5: 160, hours40_6: 160, hours36_6: 144 },
  { month: 3,  totalDays: 31, workdays5: 19, workdays6: 23, offDays5: 12, offDays6: 8,  hours40_5: 151, hours40_6: 153, hours36_6: 136 },
  { month: 4,  totalDays: 30, workdays5: 22, workdays6: 26, offDays5: 8,  offDays6: 4,  hours40_5: 176, hours40_6: 174, hours36_6: 156 },
  { month: 5,  totalDays: 31, workdays5: 17, workdays6: 21, offDays5: 14, offDays6: 10, hours40_5: 134, hours40_6: 139, hours36_6: 124 },
  { month: 6,  totalDays: 30, workdays5: 22, workdays6: 26, offDays5: 8,  offDays6: 4,  hours40_5: 176, hours40_6: 174, hours36_6: 156 },
  { month: 7,  totalDays: 31, workdays5: 23, workdays6: 27, offDays5: 8,  offDays6: 4,  hours40_5: 184, hours40_6: 181, hours36_6: 162 },
  { month: 8,  totalDays: 31, workdays5: 20, workdays6: 25, offDays5: 11, offDays6: 6,  hours40_5: 160, hours40_6: 165, hours36_6: 150 },
  { month: 9,  totalDays: 30, workdays5: 21, workdays6: 25, offDays5: 9,  offDays6: 5,  hours40_5: 167, hours40_6: 166, hours36_6: 149 },
  { month: 10, totalDays: 31, workdays5: 21, workdays6: 26, offDays5: 10, offDays6: 5,  hours40_5: 168, hours40_6: 172, hours36_6: 156 },
  { month: 11, totalDays: 30, workdays5: 21, workdays6: 25, offDays5: 9,  offDays6: 5,  hours40_5: 168, hours40_6: 167, hours36_6: 150 },
  { month: 12, totalDays: 31, workdays5: 22, workdays6: 25, offDays5: 9,  offDays6: 6,  hours40_5: 175, hours40_6: 166, hours36_6: 149 },
]

// Годовые итоги
export const YEAR_TOTALS_2026 = {
  workdays5: 248,
  workdays6: 297,
  hours40_5: 1979,
  hours40_6: 1977,
  hours36_6: 1776,
}

// ─── Список всех праздничных дат (только type === 'holiday') ──────────────────

export const UZ_HOLIDAYS_2026 = SPECIAL_DAYS_2026.filter(sd => sd.type === 'holiday')

// ─── Обратная совместимость: старый формат UZ_HOLIDAYS ────────────────────────

export const UZ_HOLIDAYS: { month: number; day: number; name: string }[] =
  UZ_HOLIDAYS_2026.map(sd => ({ month: sd.month, day: sd.day, name: sd.name }))

// ─── Публичные функции ────────────────────────────────────────────────────────

/** Возвращает SpecialDay для конкретной даты, если есть. */
export const getSpecialDay = (d: Date): SpecialDay | null => {
  if (d.getFullYear() !== UZ_PRODUCTION_CALENDAR_YEAR) return null
  const key = `${d.getMonth() + 1}-${d.getDate()}`
  return _specialDayMap.get(key) ?? null
}

/** Особые дни конкретного месяца. Данные не экстраполируются за пределы проверенного 2026 года. */
export const specialDaysForMonth = (year: number, month0: number): SpecialDay[] => {
  if (year !== UZ_PRODUCTION_CALENDAR_YEAR) return []
  return SPECIAL_DAYS_2026.filter(day => day.month === month0 + 1)
}

/** Название праздника (обратная совместимость). */
export const holidayName = (d: Date): string | null => {
  const sd = getSpecialDay(d)
  if (!sd) return null
  if (sd.type === 'holiday' || sd.type === 'additional_off' || sd.type === 'transferred_off') {
    return sd.name
  }
  return null
}

/** Полное описание дня для тултипа. */
export const dayTooltip = (d: Date): string | null => {
  const sd = getSpecialDay(d)
  if (!sd) return null

  const lines: string[] = []

  switch (sd.type) {
    case 'holiday':
      lines.push(`🎉 ${sd.name}`)
      break
    case 'additional_off':
      lines.push(`🔴 ${sd.name}`)
      break
    case 'transferred_off':
      lines.push(`🔄 ${sd.name}`)
      break
    case 'pre_holiday':
      lines.push(`⏰ ${sd.name}`)
      lines.push('Рабочий день укорочен на 1 час')
      break
    case 'transferred_work':
      lines.push(`🔧 ${sd.name}`)
      break
  }

  if (sd.note) lines.push(sd.note)

  return lines.join('\n')
}

/** Является ли дата нерабочим днём (праздник / доп. выходной / перенесённый выходной). */
export const isNonWorkingSpecialDay = (d: Date): boolean => {
  const sd = getSpecialDay(d)
  if (!sd) return false
  return sd.type === 'holiday' || sd.type === 'additional_off' || sd.type === 'transferred_off'
}

/** Является ли дата предпраздничным укороченным днём. */
export const isPreHoliday = (d: Date): boolean => {
  const sd = getSpecialDay(d)
  return sd ? sd.type === 'pre_holiday' : false
}

/** Является ли дата перенесённым рабочим днём (суббота-рабочая). */
export const isTransferredWorkday = (d: Date): boolean => {
  const sd = getSpecialDay(d)
  return sd ? sd.type === 'transferred_work' : false
}

/** Рабочий ли день (учитывает производственный календарь 2026). */
export const isWorkday = (d: Date): boolean => {
  // Если перенесённая рабочая суббота — это рабочий день
  if (isTransferredWorkday(d)) return true

  // Если праздник / доп. выходной / перенесённый выходной
  if (isNonWorkingSpecialDay(d)) return false

  // Обычные выходные (суббота/воскресенье для 5-дневки)
  const dow = d.getDay()
  if (dow === 0 || dow === 6) return false

  return true
}

/** Рабочие дни месяца: всего и сколько осталось (включая сегодня). */
export const workdayStats = (year: number, month0: number): { total: number; left: number } => {
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const now = new Date()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month0
  let total = 0
  let left = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month0, day)
    if (!isWorkday(d)) continue
    total++
    if (!isCurrentMonth || day >= now.getDate()) left++
  }
  return { total, left }
}

/** Нормы рабочего времени для месяца (1-based). Null если нет данных. */
export const getMonthNorms = (month1: number, year = UZ_PRODUCTION_CALENDAR_YEAR): MonthNorms | null => {
  if (year !== UZ_PRODUCTION_CALENDAR_YEAR) return null
  return MONTH_NORMS_2026.find(n => n.month === month1) ?? null
}

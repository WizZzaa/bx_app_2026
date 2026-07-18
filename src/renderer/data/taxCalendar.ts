// Налоговый календарь РУз на 2026 год — дедлайны для юридических лиц.
// Источник: План главбуха (Norma.uz) + Налоговый кодекс Республики Узбекистан.
// Содержит как ежемесячные шаблоны, так и конкретные даты для квартальных/разовых дедлайнов.

export interface TaxDeadline {
  id: string
  title: string
  taxType: string
  kind: 'payment' | 'report' | 'both'
  day: number
  month: number | null // null = ежемесячно, число = конкретный месяц (1-12)
  regime: string       // 'ОСН' | 'Налог с оборота' | 'все'
  note?: string
  law?: string         // ссылка на статью НК/ПКМ
  verified: boolean
  sourceUrl?: string
  verifiedAt?: string
  reviewedBy?: string
  editorialStatus?: 'draft' | 'review' | 'approved' | 'archived'
  selectionPolicy?: 'core' | 'vat' | 'employees' | 'conditional'
}

export const taxDeadlines: TaxDeadline[] = [
  // ─── Ежемесячные (до 5 числа) ──────────────────────────────────────────
  {
    id: 'bank-nonres-profit',
    title: 'Налог на прибыль по доходам нерезидентов (банки)',
    taxType: 'Прибыль', kind: 'payment', day: 5, month: null, regime: 'ОСН',
    note: 'Уплата банками налога с доходов нерезидентов (кроме дивидендов и процентов) за предыдущий месяц',
    law: 'п.1 ч.2 ст.355 НК', verified: true
  },

  // ─── Ежемесячные (до 7 числа) ──────────────────────────────────────────
  {
    id: 'ndfl-nat-pay',
    title: 'НДФЛ и ИНПС с натуральных доходов',
    taxType: 'НДФЛ', kind: 'payment', day: 7, month: null, regime: 'все',
    note: 'Уплата НДФЛ и взносов на ИНПС с доходов, выплаченных в натуральной форме в предыдущем месяце',
    law: 'ч.2 ст.390 НК', verified: true
  },

  // ─── Ежемесячные (до 9 числа) ──────────────────────────────────────────
  {
    id: 'alcohol-retail-fee',
    title: 'Сбор за реализацию алкогольной продукции',
    taxType: 'Сборы', kind: 'payment', day: 9, month: null, regime: 'все',
    note: 'Розничная торговля алкогольной продукцией, пивом, табачной продукцией',
    law: 'ч.6 ст.460 НК', verified: true
  },

  // ─── Ежемесячные (до 10 числа) ─────────────────────────────────────────
  {
    id: 'excise-report',
    title: 'Акцизный налог — отчётность и уплата',
    taxType: 'Акциз', kind: 'both', day: 10, month: null, regime: 'все',
    note: 'Отчётность и уплата за предыдущий месяц',
    law: 'ст.ст.292–293 НК', verified: true
  },
  {
    id: 'property-advance',
    title: 'Налог на имущество — авансовый платёж',
    taxType: 'Имущество', kind: 'payment', day: 10, month: null, regime: 'ОСН',
    note: '1/12 часть годовой суммы для неплательщиков налога с оборота',
    law: 'ч.6 ст.417 НК', verified: true
  },
  {
    id: 'land-tax-advance',
    title: 'Земельный налог — авансовый платёж',
    taxType: 'Земельный', kind: 'payment', day: 10, month: null, regime: 'ОСН',
    note: '1/12 часть годовой суммы для неплательщиков налога с оборота',
    law: 'ч.1 ст.432 НК', verified: true
  },
  {
    id: 'pension-fund-claim',
    title: 'Заявка на возмещение из Пенсионного фонда',
    taxType: 'Соц.страхование', kind: 'report', day: 10, month: null, regime: 'все',
    note: 'Пособие родителю ребёнка с инвалидностью (до 16 лет) за дополнительный выходной',
    law: 'пп.45,46 Положения, ПКМ №661', verified: true
  },

  // ─── Ежемесячные (до 15 числа) ─────────────────────────────────────────
  {
    id: 'inps-report',
    title: 'Взносы на ИНПС — реестры и уплата',
    taxType: 'ИНПС', kind: 'both', day: 15, month: null, regime: 'все',
    note: 'Представление реестров и уплата взносов за предыдущий месяц',
    law: 'пп.6,9 Положения, рег.МЮ №3577', verified: true,
    selectionPolicy: 'employees'
  },
  {
    id: 'pit-report',
    title: 'НДФЛ и соцналог — отчётность и уплата',
    taxType: 'НДФЛ', kind: 'both', day: 15, month: null, regime: 'все',
    note: 'Ежемесячно до 15 числа. НДФЛ уплачивается одновременно с выплатой доходов, но не позднее сроков представления отчётности',
    law: 'ст.389-390 НК, ч.ч.4-5 ст.407 НК', verified: true,
    selectionPolicy: 'employees'
  },
  {
    id: 'turnover-report',
    title: 'Налог с оборота — отчётность и уплата',
    taxType: 'Оборот', kind: 'both', day: 15, month: null, regime: 'Налог с оборота',
    note: 'Ежемесячно',
    law: 'чч.3,5 ст.470 НК', verified: true,
    selectionPolicy: 'core'
  },
  {
    id: 'turnover-agent',
    title: 'Налог с оборота — агентские (ИП и самозанятые)',
    taxType: 'Оборот', kind: 'both', day: 15, month: null, regime: 'все',
    note: 'По доходам ИП и самозанятых лиц до 12 000 БРВ',
    law: 'чч.3-5 ст.470 НК', verified: true
  },
  {
    id: 'kkt-errors-turnover',
    title: 'Исправление ошибок в чеках ККТ (нал. с оборота)',
    taxType: 'ККТ', kind: 'report', day: 15, month: null, regime: 'Налог с оборота',
    note: 'Исправление технических ошибок за предыдущий месяц',
    law: 'п.38-1, ПКМ №943', verified: true
  },

  // ─── Ежемесячные (до 20 числа) ─────────────────────────────────────────
  {
    id: 'vat-report',
    title: 'НДС — отчётность и уплата',
    taxType: 'НДС', kind: 'both', day: 20, month: null, regime: 'ОСН',
    note: 'Ежемесячно до 20 числа за предыдущий месяц',
    law: 'чч.1-4 ст.273 НК', verified: true,
    selectionPolicy: 'vat'
  },
  {
    id: 'vat-agent',
    title: 'НДС — агентская отчётность (нерезиденты, госимущество)',
    taxType: 'НДС', kind: 'both', day: 20, month: null, regime: 'ОСН',
    note: 'По товарам/услугам у иностранных лиц и операциям с госимуществом',
    law: 'ст.255-256 НК', verified: true
  },
  {
    id: 'water-advance',
    title: 'Налог за пользование водными ресурсами — аванс',
    taxType: 'Водные', kind: 'payment', day: 20, month: null, regime: 'ОСН',
    note: '1/12 часть годовой суммы для юрлиц-неплательщиков налога с оборота (если >200 БРВ)',
    law: 'ч.3 ст.448 НК', verified: true
  },
  {
    id: 'nonres-income-report',
    title: 'Доходы нерезидентов — отчётность',
    taxType: 'Прибыль', kind: 'report', day: 20, month: null, regime: 'ОСН',
    note: 'Налоговые агенты подают отчётность по суммам налога с доходов нерезидентов',
    law: 'чч.1-2 ст.355 НК', verified: true
  },
  {
    id: 'dividend-interest-report',
    title: 'Налог с дивидендов и процентов — отчётность',
    taxType: 'Прибыль', kind: 'report', day: 20, month: null, regime: 'все',
    note: 'Налоговые агенты подают ежемесячно. Налог уплачивается не позднее даты выплаты',
    law: 'ч.5 ст.345 НК', verified: true
  },
  {
    id: 'subsoil-report',
    title: 'Налог за пользование недрами — отчётность и уплата',
    taxType: 'Недра', kind: 'both', day: 20, month: null, regime: 'ОСН',
    note: 'Юрлица ежемесячно',
    law: 'чч.3-4 ст.454 НК', verified: true
  },
  {
    id: 'kkt-errors-vat',
    title: 'Исправление ошибок в чеках ККТ (НДС)',
    taxType: 'ККТ', kind: 'report', day: 20, month: null, regime: 'ОСН',
    note: 'Исправление технических ошибок за предыдущий месяц для плательщиков НДС',
    law: 'п.38-1, ПКМ №943', verified: true
  },

  // ─── Ежемесячные (до 23 числа) ─────────────────────────────────────────
  {
    id: 'profit-advance-monthly',
    title: 'Налог на прибыль — авансовый платёж',
    taxType: 'Прибыль', kind: 'payment', day: 23, month: null, regime: 'ОСН',
    note: 'Для компаний с совокупным доходом за 2025 г. >20 млрд сум',
    law: 'ч.2 ст.340 НК', verified: true
  },

  // ─── Ежемесячные (до 25 числа) ─────────────────────────────────────────
  {
    id: 'pension-fund-repay',
    title: 'Возмещение расходов Пенсионного фонда',
    taxType: 'Соц.страхование', kind: 'payment', day: 25, month: null, regime: 'все',
    note: 'За пенсии по случаю потери кормильца и по инвалидности вследствие трудового увечья',
    law: 'п.32 Положения, ПКМ №661', verified: true
  },

  // ═══ Квартальные ════════════════════════════════════════════════════════

  // I квартал → отчётность до 14/20 апреля
  {
    id: 'env-pollution-q1',
    title: 'Компенсация за загрязнение ОС — I квартал',
    taxType: 'Экология', kind: 'both', day: 14, month: 4, regime: 'все',
    note: 'Расчёт компенсационных выплат за загрязнение окружающей среды (субъекты I и II категорий)',
    law: 'п.22 прил.№1, ПКМ №202', verified: true
  },
  {
    id: 'profit-q1-report',
    title: 'Налог на прибыль — расчёт за I квартал',
    taxType: 'Прибыль', kind: 'both', day: 20, month: 4, regime: 'ОСН',
    note: 'Расчёт и уплата за I квартал 2026 года',
    law: 'ч.5 ст.339, ст.340 НК', verified: true,
    selectionPolicy: 'core'
  },
  {
    id: 'vat-foreign-q1',
    title: 'НДС иностранных юрлиц (электронные услуги) — I квартал',
    taxType: 'НДС', kind: 'both', day: 20, month: 4, regime: 'все',
    note: 'Иностранные юрлица, оказывающие электронные услуги физлицам',
    law: 'ст.280-281 НК', verified: true
  },
  {
    id: 'rent-tax-q1',
    title: 'Специальный рентный налог — I квартал',
    taxType: 'Рентный', kind: 'both', day: 20, month: 4, regime: 'ОСН',
    note: 'При наличии рентного дохода',
    law: 'ст.454-7 НК', verified: true
  },

  // II квартал → отчётность до 14/20 июля
  {
    id: 'env-pollution-q2',
    title: 'Компенсация за загрязнение ОС — II квартал',
    taxType: 'Экология', kind: 'both', day: 14, month: 7, regime: 'все',
    note: 'Расчёт за II квартал 2026 года (субъекты I и II категорий)',
    law: 'п.22 прил.№1, ПКМ №202', verified: true
  },
  {
    id: 'profit-advance-q3-справка',
    title: 'Справка авансов по прибыли — III квартал',
    taxType: 'Прибыль', kind: 'report', day: 15, month: 7, regime: 'ОСН',
    note: 'Справка об ожидаемой прибыли для компаний с доходом >20 млрд сум за 2025 г.',
    law: 'ч.11 ст.340 НК', verified: true
  },
  {
    id: 'profit-q2-report',
    title: 'Налог на прибыль — расчёт за II квартал',
    taxType: 'Прибыль', kind: 'both', day: 20, month: 7, regime: 'ОСН',
    note: 'Расчёт и уплата за II квартал 2026 года',
    law: 'ч.5 ст.339, ст.340 НК', verified: true,
    selectionPolicy: 'core'
  },
  {
    id: 'vat-foreign-q2',
    title: 'НДС иностранных юрлиц (электронные услуги) — II квартал',
    taxType: 'НДС', kind: 'both', day: 20, month: 7, regime: 'все',
    note: 'Иностранные юрлица, оказывающие электронные услуги физлицам',
    law: 'ст.280-281 НК', verified: true
  },
  {
    id: 'rent-tax-q2',
    title: 'Специальный рентный налог — II квартал',
    taxType: 'Рентный', kind: 'both', day: 20, month: 7, regime: 'ОСН',
    note: 'При наличии рентного дохода',
    law: 'ст.454-7 НК', verified: true
  },

  // III квартал → отчётность до 14/20 октября
  {
    id: 'env-pollution-q3',
    title: 'Компенсация за загрязнение ОС — III квартал',
    taxType: 'Экология', kind: 'both', day: 14, month: 10, regime: 'все',
    note: 'Расчёт за III квартал 2026 года (субъекты I и II категорий)',
    law: 'п.22 прил.№1, ПКМ №202', verified: true
  },
  {
    id: 'profit-q3-report',
    title: 'Налог на прибыль — расчёт за III квартал',
    taxType: 'Прибыль', kind: 'both', day: 20, month: 10, regime: 'ОСН',
    note: 'Расчёт и уплата за III квартал 2026 года',
    law: 'ч.5 ст.339, ст.340 НК', verified: true,
    selectionPolicy: 'core'
  },
  {
    id: 'vat-foreign-q3',
    title: 'НДС иностранных юрлиц (электронные услуги) — III квартал',
    taxType: 'НДС', kind: 'both', day: 20, month: 10, regime: 'все',
    note: 'Иностранные юрлица, оказывающие электронные услуги физлицам',
    law: 'ст.280-281 НК', verified: true
  },
  {
    id: 'rent-tax-q3',
    title: 'Специальный рентный налог — III квартал',
    taxType: 'Рентный', kind: 'both', day: 20, month: 10, regime: 'ОСН',
    note: 'При наличии рентного дохода',
    law: 'ст.454-7 НК', verified: true
  },

  // IV квартал → отчётность до 14/20 января следующего года
  {
    id: 'env-pollution-q4',
    title: 'Компенсация за загрязнение ОС — IV квартал',
    taxType: 'Экология', kind: 'both', day: 14, month: 1, regime: 'все',
    note: 'Расчёт за IV квартал предыдущего года (субъекты I и II категорий)',
    law: 'п.22 прил.№1, ПКМ №202', verified: true
  },
]

/** Развернуть шаблоны в конкретные даты для заданного месяца (0-индексированный). */
export const deadlinesForMonth = (year: number, month0: number, regime?: string): { date: string; deadline: TaxDeadline }[] => {
  const month1 = month0 + 1
  const out: { date: string; deadline: TaxDeadline }[] = []

  for (const d of taxDeadlines) {
    if (regime && regime !== 'все' && d.regime !== 'все' && d.regime !== regime) continue

    const matches = d.month === null || d.month === month1
    if (!matches) continue

    // Скорректировать день, если он выходит за количество дней в месяце
    const daysInMonth = new Date(year, month0 + 1, 0).getDate()
    const day = Math.min(d.day, daysInMonth)

    const dayStr = String(day).padStart(2, '0')
    const monthStr = String(month1).padStart(2, '0')
    out.push({ date: `${year}-${monthStr}-${dayStr}`, deadline: d })
  }

  // Сортировка по дате
  out.sort((a, b) => a.date.localeCompare(b.date))

  return out
}

/** Получить все уникальные дни с дедлайнами в указанном месяце. */
export const deadlineDaysInMonth = (year: number, month0: number, regime?: string): Set<number> => {
  const days = new Set<number>()
  for (const { date } of deadlinesForMonth(year, month0, regime)) {
    days.add(parseInt(date.split('-')[2], 10))
  }
  return days
}

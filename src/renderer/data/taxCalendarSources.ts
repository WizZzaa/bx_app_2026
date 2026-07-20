export type TaxDeadlineSourceFamily =
  | 'tax-code'
  | 'pkm-661'
  | 'minjust-3577'
  | 'pkm-943'
  | 'pkm-202'

export interface TaxDeadlineSourceCandidate {
  family: TaxDeadlineSourceFamily
  title: string
  url: string
  collectedAt: string
  reviewNote: string
}

/**
 * Официальные документы-кандидаты, найденные в Lex.uz. Наличие записи здесь
 * не означает редакционного одобрения правила: редактор обязан отдельно
 * сверить указанную статью/пункт, дату и применимость, а затем пройти workflow.
 */
export const taxDeadlineSourceDocuments: Readonly<Record<TaxDeadlineSourceFamily, TaxDeadlineSourceCandidate>> = {
  'tax-code': {
    family: 'tax-code',
    title: 'Налоговый кодекс Республики Узбекистан (ЗРУ-599, консолидированный текст)',
    url: 'https://lex.uz/ru/docs/4674902',
    collectedAt: '2026-07-20',
    reviewNote: 'Сверить редакцию и точную часть статьи, указанную в нормативном основании карточки.',
  },
  'pkm-661': {
    family: 'pkm-661',
    title: 'ПКМ №661 от 14.12.2023 — распределение социального налога и возмещение расходов',
    url: 'https://lex.uz/ru/docs/6698331',
    collectedAt: '2026-07-20',
    reviewNote: 'Сверить пункты 32, 45 и 46 Положения и применимость срока к конкретному виду выплаты.',
  },
  'minjust-3577': {
    family: 'minjust-3577',
    title: 'Рег. МЮ №3577 от 20.11.2024 — обязательные накопительные пенсионные взносы',
    url: 'https://lex.uz/ru/docs/7231789',
    collectedAt: '2026-07-20',
    reviewNote: 'Сверить пункты 6 и 9 по консолидированной редакции, включая изменение №3577-1 от 2025 года.',
  },
  'pkm-943': {
    family: 'pkm-943',
    title: 'ПКМ №943 от 23.11.2019 — онлайн-ККМ и виртуальная касса',
    url: 'https://lex.uz/ru/docs/4603340',
    collectedAt: '2026-07-20',
    reviewNote: 'Сверить действующую редакцию пункта 38-1 и различия сроков для НДС и налога с оборота.',
  },
  'pkm-202': {
    family: 'pkm-202',
    title: 'ПКМ №202 от 12.04.2021 — экономические механизмы охраны окружающей среды',
    url: 'https://lex.uz/ru/docs/5367873',
    collectedAt: '2026-07-20',
    reviewNote: 'Сверить пункт 22 приложения №1, категории плательщиков и квартальные сроки в текущей редакции.',
  },
}

const deadlineIdsBySourceFamily: Readonly<Record<TaxDeadlineSourceFamily, readonly string[]>> = {
  'tax-code': [
    'bank-nonres-profit',
    'ndfl-nat-pay',
    'alcohol-retail-fee',
    'excise-report',
    'property-advance',
    'land-tax-advance',
    'pit-report',
    'turnover-report',
    'turnover-agent',
    'vat-report',
    'vat-agent',
    'water-advance',
    'nonres-income-report',
    'dividend-interest-report',
    'subsoil-report',
    'profit-advance-monthly',
    'profit-q1-report',
    'vat-foreign-q1',
    'rent-tax-q1',
    'profit-advance-q3-справка',
    'profit-q2-report',
    'vat-foreign-q2',
    'rent-tax-q2',
    'profit-q3-report',
    'vat-foreign-q3',
    'rent-tax-q3',
  ],
  'pkm-661': ['pension-fund-claim', 'pension-fund-repay'],
  'minjust-3577': ['inps-report'],
  'pkm-943': ['kkt-errors-turnover', 'kkt-errors-vat'],
  'pkm-202': ['env-pollution-q1', 'env-pollution-q2', 'env-pollution-q3', 'env-pollution-q4'],
}

export const taxDeadlineSourceCandidates: Readonly<Record<string, TaxDeadlineSourceCandidate>> =
  Object.fromEntries(
    Object.entries(deadlineIdsBySourceFamily).flatMap(([family, ids]) =>
      ids.map(id => [id, taxDeadlineSourceDocuments[family as TaxDeadlineSourceFamily]]),
    ),
  )

export function taxDeadlineSourceCandidate(deadlineId: string): TaxDeadlineSourceCandidate | undefined {
  return taxDeadlineSourceCandidates[deadlineId]
}

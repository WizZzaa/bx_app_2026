export type CalculatorRegulatoryStatus = 'review' | 'approved' | 'archived'

export interface CalculatorRegulatoryValue {
  key: string
  label: string
  displayValue: string
  numericValue?: number
  version: string
  effectiveFrom: string
  effectiveTo?: string
  sourceTitle: string
  sourceUrl: string
  checkedAt?: string
  nextReviewAt?: string
  reviewedBy?: string
  editorialStatus: CalculatorRegulatoryStatus
}

export interface PublishedCalculatorRegulatoryRow {
  key: string
  label: string
  display_value: string
  numeric_value: number | string | null
  version_label: string
  effective_from: string
  effective_to: string | null
  source_title: string
  official_source_url: string | null
  source_checked_at: string | null
  next_review_at: string | null
  reviewed_by: string | null
  workflow_status: string
  source_status: string
}

const TAX_CODE_URL = 'https://lex.uz/ru/docs/4674902'
const LABOR_CODE_URL = 'https://lex.uz/ru/docs/6257288'
const CBU_POLICY_RATE_URL = 'https://cbu.uz/ru/monetary-policy/publications/press-releases/3997763/'
const LEX_UZ_URL = 'https://lex.uz/'

const reviewValue = (
  key: string,
  label: string,
  displayValue: string,
  sourceTitle: string,
  sourceUrl: string,
  effectiveFrom = '2025-01-01',
  numericValue?: number,
): CalculatorRegulatoryValue => ({
  key,
  label,
  displayValue,
  numericValue,
  version: 'bootstrap-review-2026-07-20',
  effectiveFrom,
  sourceTitle,
  sourceUrl,
  editorialStatus: 'review',
})

/**
 * Канонический каталог значений, от которых зависят автоматические расчёты.
 *
 * Записи bootstrap-review намеренно не считаются опубликованными: они отражают
 * существующую математику приложения и кандидата официального источника, но до
 * редакционной проверки требуют явного подтверждения пользователя.
 */
export const CALCULATOR_REGULATORY_VALUES: readonly CalculatorRegulatoryValue[] = [
  reviewValue('tax.vat.standard', 'НДС — стандартная ставка', '12%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 12),
  reviewValue('tax.vat.reduced', 'НДС — специальный сценарий', '6%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 6),
  reviewValue('tax.ndfl.standard', 'НДФЛ', '12%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 12),
  reviewValue('tax.social.standard', 'Социальный налог', '12%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 12),
  reviewValue('tax.turnover.standard', 'Налог с оборота — базовый сценарий', '4%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 4),
  reviewValue('tax.profit.standard', 'Налог на прибыль', '15%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 15),
  reviewValue('tax.dividend.resident', 'Дивиденды резидента', '5%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 5),
  reviewValue('tax.dividend.nonresident', 'Дивиденды нерезидента без подтверждённого СИДН', '10%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 10),
  reviewValue('tax.penalty.daily', 'Пеня за день просрочки', '0,033%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 0.033),
  reviewValue('payroll.inps', 'ИНПС', '0,1%', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 0.1),
  reviewValue('indicator.brv', 'БРВ', '412 000 сум', 'Lex.uz — акт об изменении размеров БРВ и МРОТ', LEX_UZ_URL, '2025-08-01', 412_000),
  reviewValue('indicator.mrot', 'МРОТ', '1 271 000 сум', 'Lex.uz — акт об изменении размеров БРВ и МРОТ', LEX_UZ_URL, '2025-08-01', 1_271_000),
  reviewValue('tax.regime.threshold', 'Справочный порог общего режима', '4 944 000 000 сум', 'Налоговый кодекс Республики Узбекистан', TAX_CODE_URL, '2025-01-01', 4_944_000_000),
  reviewValue('labor.vacation.formula', 'Формула среднего заработка для отпускных', 'доход / 365 или / 12 / 25,4', 'Трудовой кодекс Республики Узбекистан', LABOR_CODE_URL),
  reviewValue('labor.sick.formula', 'Пособие по временной нетрудоспособности', '60% / 80% / 100%; минимум по МРОТ', 'Трудовой кодекс и подзаконные акты Республики Узбекистан', LABOR_CODE_URL),
  reviewValue('vehicle.recycling.base', 'Базовая ставка утилизационного сбора', '3 300 000 сум', 'Lex.uz — акты об утилизационном сборе', LEX_UZ_URL, '2025-01-01', 3_300_000),
  reviewValue('vehicle.recycling.formula', 'Утилизационный сбор и коэффициенты', '3 300 000 сум × тип × возраст', 'Lex.uz — акты об утилизационном сборе', LEX_UZ_URL),
  {
    key: 'indicator.cbu.policy_rate',
    label: 'Основная ставка Центрального банка',
    displayValue: '14%',
    numericValue: 14,
    version: 'cbu-2026-06-17',
    effectiveFrom: '2025-03-24',
    sourceTitle: 'Решение Правления Центрального банка от 17.06.2026',
    sourceUrl: CBU_POLICY_RATE_URL,
    checkedAt: '2026-06-17',
    nextReviewAt: '2026-07-28',
    reviewedBy: 'official-cbu-release',
    editorialStatus: 'approved',
  },
] as const

export const CALCULATOR_REGULATORY_KEYS: Readonly<Record<string, readonly string[]>> = {
  vat: ['tax.vat.standard'],
  ndfl: ['tax.ndfl.standard', 'indicator.brv'],
  regime: ['tax.turnover.standard', 'tax.vat.reduced', 'tax.vat.standard', 'tax.profit.standard', 'tax.regime.threshold'],
  penalty: ['tax.penalty.daily', 'indicator.cbu.policy_rate'],
  dividend: ['tax.dividend.resident', 'tax.dividend.nonresident'],
  taxcalc: ['tax.turnover.standard', 'tax.profit.standard', 'tax.vat.standard', 'tax.ndfl.standard', 'tax.social.standard'],
  salary: ['tax.ndfl.standard', 'payroll.inps', 'tax.social.standard'],
  inps: ['tax.ndfl.standard', 'payroll.inps'],
  vacation: ['labor.vacation.formula', 'tax.ndfl.standard'],
  sick: ['labor.sick.formula', 'indicator.mrot', 'tax.ndfl.standard'],
  recycling: ['vehicle.recycling.base', 'vehicle.recycling.formula'],
}

const VALUE_BY_KEY = new Map(CALCULATOR_REGULATORY_VALUES.map(value => [value.key, value]))

export function unpublishedCalculatorRegulatoryValues(): CalculatorRegulatoryValue[] {
  return CALCULATOR_REGULATORY_VALUES.map(value => ({
    ...value,
    checkedAt: undefined,
    nextReviewAt: undefined,
    reviewedBy: undefined,
    editorialStatus: 'review',
  }))
}

function isOfficialRegulatoryUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['lex.uz', 'soliq.uz', 'gov.uz', 'cbu.uz']
      .some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

export function mergePublishedCalculatorRegulatoryValues(
  rows: readonly PublishedCalculatorRegulatoryRow[],
  asOf?: string,
): CalculatorRegulatoryValue[] {
  const base = unpublishedCalculatorRegulatoryValues()
  const known = new Set(base.map(value => value.key))
  const approved = new Map<string, CalculatorRegulatoryValue>()

  for (const row of rows) {
    const numeric = row.numeric_value === null ? undefined : Number(row.numeric_value)
    if (!known.has(row.key) || row.workflow_status !== 'published' || row.source_status !== 'verified') continue
    if (!row.official_source_url || !isOfficialRegulatoryUrl(row.official_source_url)) continue
    if (!row.source_checked_at || !row.next_review_at || !row.reviewed_by) continue
    if (numeric !== undefined && (!Number.isFinite(numeric) || numeric < 0)) continue
    const value: CalculatorRegulatoryValue = {
      key: row.key,
      label: row.label,
      displayValue: row.display_value,
      numericValue: numeric,
      version: row.version_label,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to ?? undefined,
      sourceTitle: row.source_title,
      sourceUrl: row.official_source_url,
      checkedAt: row.source_checked_at.slice(0, 10),
      nextReviewAt: row.next_review_at.slice(0, 10),
      reviewedBy: row.reviewed_by,
      editorialStatus: 'approved',
    }
    if (asOf && !isRegulatoryValueEligible(value, asOf)) continue
    approved.set(row.key, value)
  }

  return base.map(value => approved.get(value.key) ?? value)
}

export function regulatoryValuesForCalculator(
  calculatorId: string,
  catalog: readonly CalculatorRegulatoryValue[] = CALCULATOR_REGULATORY_VALUES,
): CalculatorRegulatoryValue[] {
  const values = new Map(catalog.map(value => [value.key, value]))
  return (CALCULATOR_REGULATORY_KEYS[calculatorId] ?? []).map(key => {
    const value = values.get(key)
    if (!value) throw new Error(`Unknown calculator regulatory value: ${key}`)
    return value
  })
}

export function regulatoryNumber(
  key: string,
  catalog: readonly CalculatorRegulatoryValue[] = CALCULATOR_REGULATORY_VALUES,
): number {
  const value = catalog === CALCULATOR_REGULATORY_VALUES
    ? VALUE_BY_KEY.get(key)
    : catalog.find(item => item.key === key)
  if (!value || value.numericValue === undefined) throw new Error(`Missing numeric calculator regulatory value: ${key}`)
  return value.numericValue
}

export function isRegulatoryValueEligible(value: CalculatorRegulatoryValue, asOf: string): boolean {
  if (value.editorialStatus !== 'approved') return false
  if (!value.checkedAt || !value.nextReviewAt || !value.reviewedBy || !value.sourceUrl) return false
  if (value.effectiveFrom > asOf) return false
  if (value.effectiveTo && value.effectiveTo < asOf) return false
  return value.nextReviewAt >= asOf
}

export function calculatorRequiresManualConfirmation(calculatorId: string, asOf: string): boolean {
  const values = regulatoryValuesForCalculator(calculatorId)
  return values.length > 0 && values.some(value => !isRegulatoryValueEligible(value, asOf))
}

export function regulatoryValuesFingerprint(values: readonly CalculatorRegulatoryValue[]): string {
  return values
    .map(value => [value.key, value.version, value.displayValue, value.numericValue ?? '', value.sourceUrl, value.checkedAt ?? '', value.nextReviewAt ?? ''].join(':'))
    .sort()
    .join('|')
}

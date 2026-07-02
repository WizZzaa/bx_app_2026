// Расчёт зарплаты для РУз. Ставки 2025–2026 (значения по умолчанию,
// бухгалтер может их менять — сверяйтесь с актуальной редакцией НК РУз на soliq.uz).

export interface PayrollRates {
  ndfl: number     // НДФЛ, % (по умолчанию 12)
  inps: number     // ИНПС — индивид. накопит. пенсия, % (по умолчанию 0.1)
  social: number   // Соцналог работодателя, % (по умолчанию 12; бюджет 25)
  brv: number      // Базовый расчётный показатель (БРП) — для минимальных выплат
  mrot: number     // Минимальный размер оплаты труда (МРОТ) РУз, сумов
}

export const DEFAULT_RATES: PayrollRates = { ndfl: 12, inps: 0.1, social: 12, brv: 395_000, mrot: 1_050_000 }

export interface PayrollResult {
  gross: number        // начислено (оклад + надбавки)
  ndfl: number         // НДФЛ (удержание с работника)
  inps: number         // ИНПС (удержание с работника)
  totalWithheld: number// всего удержано
  net: number          // на руки
  social: number       // соцналог (платит работодатель)
  employerCost: number // полная стоимость для работодателя
}

export function calcPayroll(gross: number, rates: PayrollRates = DEFAULT_RATES): PayrollResult {
  const g = Math.max(0, gross || 0)
  const inps = g * (rates.inps / 100)
  const ndflRaw = g * (rates.ndfl / 100)
  
  // В Узбекистане ИНПС (0.1%) вычитается из начисленного НДФЛ (12%)
  const ndfl = Math.max(0, ndflRaw - inps)
  
  const totalWithheld = ndfl + inps
  const net = g - totalWithheld
  const social = g * (rates.social / 100)
  return {
    gross: g,
    ndfl: round(ndfl),
    inps: round(inps),
    totalWithheld: round(totalWithheld),
    net: round(net),
    social: round(social),
    employerCost: round(g + social)
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export function fmtSum(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n) + ' сум'
}

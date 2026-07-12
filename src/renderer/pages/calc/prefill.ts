// Хендофф «открыть калькулятор с данными» из других разделов
// (например, из карточки сотрудника — отпускные/больничные с его доходом).
// Одноразовый: калькулятор читает и удаляет запись.

const KEY = 'bx_calc_prefill'

export interface CalcPrefill {
  calc: string          // id калькулятора (vacation, sick, ...)
  annual?: number       // годовой доход, UZS
}

export function setCalcPrefill(p: CalcPrefill) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function peekCalcPrefill(): CalcPrefill | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/** Забрать префилл для конкретного калькулятора (и удалить его). */
export function takeCalcPrefill(calcId: string): CalcPrefill | null {
  const p = peekCalcPrefill()
  if (!p || p.calc !== calcId) return null
  localStorage.removeItem(KEY)
  return p
}

/** Число → строка для MoneyInput: «61 200 000» */
export function toMoneyString(n: number): string {
  return Math.round(n).toLocaleString('ru-RU').replace(/[\u00a0\u202f]/g, ' ')
}

import React, { useState } from 'react'
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';
import { useEconomicIndicators } from '../../lib/useEconomicIndicators'

// НДФЛ РУз: плоская ставка 12% (с 2019 г., ст. 366 НК РУз)
const NDFL_RATE = 12

const fmt = (n: number) => {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
}

export default function NdflCalc() {
  const { brv } = useEconomicIndicators()
  const [gross, setGross] = useState('')
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [deduction, setDeduction] = useState(false)

  const val = parseFloat(gross.replace(/\s/g, '').replace(',', '.')) || 0

  const taxableBase = Math.max(0, val - (deduction ? brv * (period === 'year' ? 12 : 1) : 0))
  const ndfl = taxableBase * (NDFL_RATE / 100)
  const net = val - ndfl

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod('month')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Месяц
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${period === 'year' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Год
        </button>
      </div>

      <div>
        <label className="block text-xs text-bx-muted mb-1.5">Начисленная зарплата (UZS)</label>
        <MoneyInput value={gross} onChange={setGross} big autoFocus />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={deduction}
          onChange={e => setDeduction(e.target.checked)}
          className="w-4 h-4 rounded accent-blue-500"
        />
        <span className="text-sm text-bx-text">Льгота — необлагаемый минимум (1 БРВ/мес = {fmt(brv)} UZS)</span>
      </label>

      <CalcResult
        title={`НДФЛ ${NDFL_RATE}% (${period === 'month' ? 'месяц' : 'год'})`}
        rows={[
          { label: 'Ставка НДФЛ', value: `${NDFL_RATE}%` },
          ...(deduction ? [{ label: 'Вычет (необлагаемый)', value: `${fmt(brv * (period === 'year' ? 12 : 1))} UZS` }] : []),
          { label: 'Налогооблагаемая база', value: `${fmt(taxableBase)} UZS` },
          { label: 'НДФЛ к удержанию', value: `${fmt(ndfl)} UZS`, highlight: true },
          { label: 'Сумма «на руки»', value: `${fmt(net)} UZS` },
        ]}
      />

      <p className="text-[11px] text-bx-muted">Ставка 12% — плоская, ст. 366 НК РУз. Льготы: ст. 378–380 НК РУз.</p>
    </div>
  )
}

import React, { useState } from 'react'
import { Row } from './CalcRow';
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
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Месяц
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${period === 'year' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Год
        </button>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Начисленная зарплата (UZS)</label>
        <input
          type="text"
          inputMode="decimal"
          value={gross}
          onChange={e => setGross(e.target.value)}
          placeholder="0"
          className="w-full bg-[#0f1117] text-slate-200 text-lg px-4 py-3 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={deduction}
          onChange={e => setDeduction(e.target.checked)}
          className="w-4 h-4 rounded accent-blue-500"
        />
        <span className="text-sm text-slate-300">Льгота — необлагаемый минимум (1 БРВ/мес = {fmt(brv)} UZS)</span>
      </label>

      <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
        <div className="divide-y divide-[#1e2535]">
          <Row label="Ставка НДФЛ" value={`${NDFL_RATE}%`} />
          {deduction && <Row label="Вычет (необлагаемый)" value={`${fmt(brv * (period === 'year' ? 12 : 1))} UZS`} />}
          <Row label="Налогооблагаемая база" value={`${fmt(taxableBase)} UZS`} />
          <Row label="НДФЛ к удержанию" value={`${fmt(ndfl)} UZS`} highlight />
          <Row label="Сумма «на руки»" value={`${fmt(net)} UZS`} />
        </div>
      </div>

      <p className="text-[11px] text-slate-600">Ставка 12% — плоская, ст. 366 НК РУз. Льготы: ст. 378–380 НК РУз.</p>
    </div>
  )
}

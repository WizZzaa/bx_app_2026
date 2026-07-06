import React, { useState } from 'react'
import CalcResult from './CalcResult'
import MoneyInput from './MoneyInput'
import { DEFAULT_RATES, calcPayroll } from '../hr/payroll'

const fmt = (n: number) => {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
}

const InpsCalc = () => {
  const [direction, setDirection] = useState<'gross' | 'net'>('gross')
  const [amount, setAmount] = useState('')

  const val = parseFloat(amount.replace(/\s/g, '').replace(',', '.')) || 0

  // Расчет по формулам
  // gross: начисленная з/п.
  // ИНПС = gross * 0.1%.
  // Всего НДФЛ = gross * 12%.
  // В бюджет = Всего НДФЛ - ИНПС.
  // На руки (net) = gross - Всего НДФЛ.
  // Если direction === 'net', то:
  // gross = net / (1 - 12%) = net / 0.88.
  const gross = direction === 'gross' ? val : val / (1 - DEFAULT_RATES.ndfl / 100)
  const payroll = calcPayroll(gross)

  const handleDirectionChange = (dir: 'gross' | 'net') => {
    setDirection(dir)
    setAmount('')
  }

  return (
    <div className="space-y-5">
      {/* Направление расчета */}
      <div className="flex gap-2">
        <button
          onClick={() => handleDirectionChange('gross')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'gross' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Начислено → ИНПС
        </button>
        <button
          onClick={() => handleDirectionChange('net')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'net' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          На руки → ИНПС
        </button>
      </div>

      {/* Ввод суммы */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">
          {direction === 'gross' ? 'Начисленная зарплата (ФОТ) (UZS)' : 'Сумма к получению «на руки» (UZS)'}
        </label>
        <MoneyInput value={amount} onChange={setAmount} big autoFocus />
      </div>

      <CalcResult
        title={`Индивидуальный накопительный пенсионный счет (ИНПС)`}
        rows={[
          { label: 'Начислено (база для взносов)', value: `${fmt(gross)} UZS`, highlight: direction === 'net' },
          { label: 'Всего НДФЛ (12%)', value: `${fmt(payroll.ndfl)} UZS` },
          { label: 'Накопительная часть (ИНПС 0.1%)', value: `${fmt(payroll.inps)} UZS`, highlight: true },
          { label: 'Бюджетная часть НДФЛ (11.9% в ГНК)', value: `${fmt(payroll.ndfl - payroll.inps)} UZS` },
          { label: 'На руки сотруднику (net)', value: `${fmt(payroll.net)} UZS`, highlight: direction === 'gross' },
        ]}
      />

      <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] p-3.5 space-y-2">
        <h4 className="text-xs font-semibold text-slate-300">Памятка бухгалтеру по ИНПС в РУз:</h4>
        <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-1">
          <li>Ставка ИНПС составляет <b>0.1%</b> от фонда оплаты труда работников.</li>
          <li>Сумма взносов ИНПС вычитается из начисленного НДФЛ (12%). На руки работник получает сумму за вычетом полных 12%.</li>
          <li>Взносы перечисляются в Народный Банк (Халк Банк) через реестры ИНПС не позднее даты выплаты зарплаты.</li>
          <li>Налоговый агент уменьшает платеж по НДФЛ в бюджет на сумму перечисленных взносов ИНПС.</li>
        </ul>
      </div>
    </div>
  )
}

export default InpsCalc

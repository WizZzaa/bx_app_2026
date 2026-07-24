import React, { useState } from 'react'
import CalcResult from './CalcResult'
import MoneyInput from './MoneyInput'
import { DEFAULT_RATES, calcPayroll } from '../hr/payroll'
import { useRegulatoryNumber } from '../../lib/calculatorRegulatory'

const fmt = (n: number) => {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
}

const InpsCalc = () => {
  const rates = {
    ...DEFAULT_RATES,
    ndfl: useRegulatoryNumber('tax.ndfl.standard'),
    inps: useRegulatoryNumber('payroll.inps'),
  }
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
  const gross = direction === 'gross' ? val : val / (1 - rates.ndfl / 100)
  const payroll = calcPayroll(gross, rates)

  const handleDirectionChange = (dir: 'gross' | 'net') => {
    setDirection(dir)
    setAmount('')
  }

  return (
    <div className="bx-a7-calc-form space-y-5">
      {/* Направление расчета */}
      <div className="flex gap-2">
        <button
          onClick={() => handleDirectionChange('gross')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'gross' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Начислено → ИНПС
        </button>
        <button
          onClick={() => handleDirectionChange('net')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'net' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          На руки → ИНПС
        </button>
      </div>

      {/* Ввод суммы */}
      <MoneyInput
        label={direction === 'gross' ? 'Начисленная зарплата (ФОТ)' : 'Сумма к получению «на руки»'}
        value={amount}
        onChange={setAmount}
        big
        autoFocus
      />

      <CalcResult
        title={`Индивидуальный накопительный пенсионный счет (ИНПС)`}
        rows={[
          { label: 'Начислено (база для взносов)', value: `${fmt(gross)} UZS`, highlight: direction === 'net' },
          { label: `Всего НДФЛ (${rates.ndfl}%)`, value: `${fmt(payroll.ndfl)} UZS` },
          { label: `Накопительная часть (ИНПС ${rates.inps}%)`, value: `${fmt(payroll.inps)} UZS`, highlight: true },
          { label: `Бюджетная часть НДФЛ (${rates.ndfl - rates.inps}% в ГНК)`, value: `${fmt(payroll.ndfl - payroll.inps)} UZS` },
          { label: 'На руки сотруднику (net)', value: `${fmt(payroll.net)} UZS`, highlight: direction === 'gross' },
        ]}
      />

      <div className="bg-bx-bg rounded-xl border border-bx-border p-3.5 space-y-2">
        <h4 className="text-xs font-semibold text-bx-text">Памятка бухгалтеру по ИНПС в РУз:</h4>
        <ul className="list-disc list-inside text-[11px] text-bx-muted space-y-1">
          <li>Ставка ИНПС составляет <b>{rates.inps}%</b> от фонда оплаты труда работников.</li>
          <li>Сумма взносов ИНПС вычитается из начисленного НДФЛ ({rates.ndfl}%). На руки работник получает сумму за вычетом полных {rates.ndfl}%.</li>
          <li>Взносы перечисляются в Народный Банк (Халк Банк) через реестры ИНПС не позднее даты выплаты зарплаты.</li>
          <li>Налоговый агент уменьшает платеж по НДФЛ в бюджет на сумму перечисленных взносов ИНПС.</li>
        </ul>
      </div>
    </div>
  )
}

export default InpsCalc

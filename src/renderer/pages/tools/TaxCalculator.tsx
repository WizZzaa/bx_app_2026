import React, { useState, useMemo } from 'react'
import { useTransactions } from '../finance/useTransactions'
import { useCompany } from '../../lib/CompanyContext'
import { deadlinesForMonth, summarizeTaxDeadlineCatalog } from '../../data/taxCalendar'
import { todayISO, daysFromNowISO } from '../../lib/dates';
import { useRegulatoryNumber } from '../../lib/calculatorRegulatory'

const TAX_DEADLINE_CATALOG = summarizeTaxDeadlineCatalog()

type RegimeId = 'turnover' | 'osn'

function fmtNum(n: number, digits = 0) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(n)
}

function periodLabel(year: number, q: number) {
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
  if (q === 0) return `${year} (весь год)`
  const start = (q - 1) * 3
  return `${months[start]}–${months[start + 2]} ${year}`
}

// ─── Компонент ─────────────────────────────────────────────────────────────
export default function TaxCalculator() {
  const turnoverTaxRate = useRegulatoryNumber('tax.turnover.standard') / 100
  const profitTaxRate = useRegulatoryNumber('tax.profit.standard') / 100
  const SOCIAL_TAX_RATE = useRegulatoryNumber('tax.social.standard') / 100
  const INCOME_TAX_RATE = useRegulatoryNumber('tax.ndfl.standard') / 100
  const VAT_RATE = useRegulatoryNumber('tax.vat.standard') / 100
  const REGIMES = useMemo(() => [
    { id: 'turnover' as const, label: 'Налог с оборота', rate: turnoverTaxRate, vatRequired: false },
    { id: 'osn' as const, label: 'ОСН (общий)', rate: profitTaxRate, vatRequired: true },
  ], [profitTaxRate, turnoverTaxRate])
  const { active } = useCompany()
  const { transactions } = useTransactions(active?.id ?? null)

  const thisYear = new Date().getFullYear()
  const thisQ    = Math.floor(new Date().getMonth() / 3) + 1

  const [regime,     setRegime]     = useState<RegimeId>('turnover')
  const [year,       setYear]       = useState(thisYear)
  const [quarter,    setQuarter]    = useState(thisQ)
  const [employees,  setEmployees]  = useState(5)
  const [avgSalary,  setAvgSalary]  = useState(3_000_000) // сум
  const [manualRev,  setManualRev]  = useState<string>('')
  const [manualExp,  setManualExp]  = useState<string>('')
  const [useAuto,    setUseAuto]    = useState(true)

  // ─── Вычисляем выручку из транзакций ───
  const { autoRevenue, autoExpenses } = useMemo(() => {
    const months = quarter === 0
      ? [1,2,3,4,5,6,7,8,9,10,11,12]
      : [(quarter-1)*3+1, (quarter-1)*3+2, (quarter-1)*3+3]

    let rev = 0, exp = 0
    for (const t of transactions) {
      const tDate = new Date(t.date)
      if (tDate.getFullYear() !== year) continue
      const tMonth = tDate.getMonth() + 1
      if (!months.includes(tMonth)) continue
      if (t.status === 'unpaid') continue // учитываем только оплаченные
      if (t.type === 'income')  rev += t.amount
      if (t.type === 'expense') exp += t.amount
    }
    return { autoRevenue: rev, autoExpenses: exp }
  }, [transactions, year, quarter])

  const revenue  = useAuto ? autoRevenue  : (parseFloat(manualRev.replace(/\s/g, '')) || 0)
  const expenses = useAuto ? autoExpenses : (parseFloat(manualExp.replace(/\s/g, '')) || 0)

  // ─── Налоговые расчёты ───
  const calc = useMemo(() => {
    const reg = REGIMES.find(r => r.id === regime) ?? REGIMES[0]

    // Налог с оборота
    const turnoverTax = revenue * reg.rate

    // НДС (если ОСН)
    const vatBase = revenue
    const vatTax  = reg.vatRequired ? vatBase * VAT_RATE : 0

    // Налог на прибыль (только ОСН): (доходы – расходы) * ставка
    const profit = Math.max(0, revenue - expenses)
    const profitTax = regime === 'osn' ? profit * reg.rate : 0

    // НДФЛ + соцналог
    const totalSalary    = employees * avgSalary
    const personalIncome = totalSalary * INCOME_TAX_RATE
    const socialTax      = totalSalary * SOCIAL_TAX_RATE

    const totalTaxBurden = (regime === 'turnover' ? turnoverTax : profitTax + vatTax)
                         + personalIncome + socialTax

    const effectiveRate = revenue > 0 ? (totalTaxBurden / revenue) * 100 : 0

    return {
      turnoverTax,
      vatTax,
      profitTax,
      profit,
      personalIncome,
      socialTax,
      totalSalary,
      totalTaxBurden,
      effectiveRate,
    }
  }, [INCOME_TAX_RATE, REGIMES, SOCIAL_TAX_RATE, VAT_RATE, regime, revenue, expenses, employees, avgSalary])

  // ─── Дедлайны ───
  const deadlines = useMemo(() => {
    const months = quarter === 0
      ? [0,1,2,3,4,5,6,7,8,9,10,11]
      : [(quarter-1)*3, (quarter-1)*3+1, (quarter-1)*3+2]

    const all: { date: string; title: string; kind: string }[] = []
    for (const m of months) {
      for (const d of deadlinesForMonth(year, m, regime === 'turnover' ? 'Налог с оборота' : 'ОСН')) {
        all.push({ date: d.date, title: d.deadline.title, kind: d.deadline.kind })
      }
    }
    return all.sort((a, b) => a.date.localeCompare(b.date))
  }, [year, quarter, regime])

  const today = todayISO()

  return (
    <div className="space-y-5 max-w-xl">

      {/* Параметры */}
      <div className="bg-bx-bg border border-bx-border rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-bx-text uppercase tracking-wider">Параметры расчёта</p>

        {/* Режим */}
        <div>
          <label className="text-[11px] text-bx-muted block mb-1.5">Налоговый режим</label>
          <div className="flex gap-2">
            {REGIMES.map(r => (
              <button key={r.id} onClick={() => setRegime(r.id)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${regime === r.id ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-bx-border text-bx-muted hover:border-bx-border-2'}`}>
                {r.label}
                <span className="ml-1 text-[10px] opacity-60">({(r.rate * 100).toFixed(0)}%)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Период */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-bx-muted block mb-1">Год</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="w-full bg-bx-surface text-bx-text text-xs px-2 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50">
              {[thisYear - 1, thisYear, thisYear + 1].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-bx-muted block mb-1">Период</label>
            <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}
              className="w-full bg-bx-surface text-bx-text text-xs px-2 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50">
              <option value={0}>Весь год</option>
              <option value={1}>I квартал (Янв–Мар)</option>
              <option value={2}>II квартал (Апр–Июн)</option>
              <option value={3}>III квартал (Июл–Сен)</option>
              <option value={4}>IV квартал (Окт–Дек)</option>
            </select>
          </div>
        </div>

        {/* Автоматическая выручка */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] text-bx-muted">Источник выручки</label>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setUseAuto(true)}
                className={`px-2 py-0.5 text-[10px] rounded ${useAuto ? 'bg-blue-600/30 text-blue-400' : 'text-bx-muted hover:text-bx-muted'}`}>
                Из базы
              </button>
              <button onClick={() => setUseAuto(false)}
                className={`px-2 py-0.5 text-[10px] rounded ${!useAuto ? 'bg-blue-600/30 text-blue-400' : 'text-bx-muted hover:text-bx-muted'}`}>
                Вручную
              </button>
            </div>
          </div>

          {useAuto ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-bx-surface rounded-lg px-3 py-2 border border-bx-border">
                <p className="text-[10px] text-bx-muted mb-0.5">Доходы (из Finance)</p>
                <p className="text-emerald-400 font-mono">{fmtNum(autoRevenue)} сум</p>
              </div>
              <div className="bg-bx-surface rounded-lg px-3 py-2 border border-bx-border">
                <p className="text-[10px] text-bx-muted mb-0.5">Расходы (из Finance)</p>
                <p className="text-red-400 font-mono">{fmtNum(autoExpenses)} сум</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-bx-muted block mb-0.5">Выручка, сум</label>
                <input type="text" value={manualRev} onChange={e => setManualRev(e.target.value)} placeholder="0"
                  className="w-full bg-bx-surface text-bx-text text-xs px-2 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50 font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-bx-muted block mb-0.5">Расходы, сум</label>
                <input type="text" value={manualExp} onChange={e => setManualExp(e.target.value)} placeholder="0"
                  className="w-full bg-bx-surface text-bx-text text-xs px-2 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50 font-mono" />
              </div>
            </div>
          )}
        </div>

        {/* Зарплата и сотрудники */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-bx-muted block mb-1">Кол-во сотрудников</label>
            <input type="number" min={0} value={employees} onChange={e => setEmployees(Number(e.target.value))}
              className="w-full bg-bx-surface text-bx-text text-xs px-2 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="text-[11px] text-bx-muted block mb-1">Средняя ЗП, сум/мес</label>
            <input type="number" min={0} step={100000} value={avgSalary} onChange={e => setAvgSalary(Number(e.target.value))}
              className="w-full bg-bx-surface text-bx-text text-xs px-2 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50" />
          </div>
        </div>
      </div>

      {/* Результат */}
      <div className="bg-bx-bg border border-bx-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-bx-text uppercase tracking-wider">
          Налоговая нагрузка · {periodLabel(year, quarter)}
        </p>

        <div className="space-y-2">
          {regime === 'turnover' && (
            <TaxRow label={`Налог с оборота (${REGIMES[0].rate * 100}%)`} value={calc.turnoverTax} color="text-amber-400" />
          )}
          {regime === 'osn' && (
            <>
              <TaxRow label={`Налог на прибыль (${REGIMES[1].rate * 100}%) · прибыль: ${fmtNum(calc.profit)} сум`} value={calc.profitTax} color="text-amber-400" />
              <TaxRow label={`НДС (${VAT_RATE * 100}%)`} value={calc.vatTax} color="text-orange-400" />
            </>
          )}
          <TaxRow label={`ФОТ · ${employees} чел × ${fmtNum(avgSalary)} сум`} value={calc.totalSalary} color="text-bx-muted" note="база" />
          <TaxRow label={`НДФЛ (${INCOME_TAX_RATE * 100}%)`} value={calc.personalIncome} color="text-purple-400" />
          <TaxRow label={`Соцналог (${SOCIAL_TAX_RATE * 100}%)`} value={calc.socialTax} color="text-purple-400" />
        </div>

        <div className="pt-3 border-t border-bx-border flex items-center justify-between">
          <div>
            <p className="text-[11px] text-bx-muted">ИТОГО налогов</p>
            <p className="text-xl font-bold text-bx-text font-mono">{fmtNum(calc.totalTaxBurden)} <span className="text-xs font-normal text-bx-muted">сум</span></p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-bx-muted">Налоговая нагрузка</p>
            <p className={`text-lg font-bold ${calc.effectiveRate > 25 ? 'text-red-400' : calc.effectiveRate > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {calc.effectiveRate.toFixed(1)}%
            </p>
          </div>
        </div>
        <p className="text-[10px] text-bx-muted leading-relaxed">
          ⚠ Расчёт приблизительный. Уточняйте ставки на soliq.uz и в НК РУз.
          Не учитываются: налоговые льготы, вычеты, авансы, земельный налог, акцизы.
        </p>
      </div>

      {/* Дедлайны квартала */}
      {deadlines.length > 0 && (
        <div className="bg-bx-bg border border-bx-border rounded-xl p-4">
          <p className="text-xs font-semibold text-bx-text uppercase tracking-wider mb-3">
            📋 Сроки сдачи и уплаты
          </p>
          <div className="space-y-1.5">
            {deadlines.map((d, i) => {
              const isPast = d.date < today
              const isSoon = !isPast && d.date <= daysFromNowISO(7)
              return (
                <div key={i} className={`flex items-center gap-3 text-xs rounded-lg px-3 py-2 ${isPast ? 'opacity-40' : ''} ${isSoon ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-bx-surface'}`}>
                  <span className={`font-mono text-[10px] ${isPast ? 'text-bx-muted' : isSoon ? 'text-amber-400' : 'text-bx-muted'}`}>{d.date}</span>
                  <span className={`flex-1 ${isPast ? 'text-bx-muted line-through' : 'text-bx-text'}`}>{d.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.kind === 'payment' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {d.kind === 'payment' ? 'уплата' : 'отчёт'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {deadlines.length === 0 && TAX_DEADLINE_CATALOG.ready === 0 && TAX_DEADLINE_CATALOG.needsReview > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-4 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
          Сроки не подставлены в расчёт: {TAX_DEADLINE_CATALOG.needsReview} карточек календаря ожидают проверки официальных источников. Расчёт налогов остаётся ориентировочным.
        </div>
      )}
    </div>
  )
}

function TaxRow({ label, value, color, note }: { label: string; value: number; color: string; note?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-bx-muted truncate max-w-[60%]">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>
        {note ? <span className="text-bx-muted font-normal mr-1">{note}</span> : null}
        {fmtNum(value)} сум
      </span>
    </div>
  )
}

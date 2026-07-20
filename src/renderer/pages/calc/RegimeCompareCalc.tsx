import React, { useMemo, useState } from 'react'
import CalcResult from './CalcResult'
import MoneyInput from './MoneyInput'
import { regulatoryNumber } from '../../data/calculatorRegulatoryValues'
import { useRegulatoryNumber } from '../../lib/calculatorRegulatory'

export type TaxRegime = 'turnover' | 'vat6' | 'general'

export interface RegimeInputs {
  domesticRevenueMln: number
  exportRevenueMln: number
  purchasesVat12Mln: number
  purchasesVat6Mln: number
  otherExpensesMln: number
  turnoverRate: number
  turnoverUnavailable: boolean
  vat6Unavailable: boolean
}

export interface RegimeOutcome {
  id: TaxRegime
  label: string
  available: boolean
  tax: number
  netProfit: number
  lines: Array<{ label: string; value: number }>
}

const MLN = 1_000_000
interface RegimeRates {
  vat12Percent: number
  vat6Percent: number
  profitTaxPercent: number
}

const DEFAULT_REGIME_RATES: RegimeRates = {
  vat12Percent: regulatoryNumber('tax.vat.standard'),
  vat6Percent: regulatoryNumber('tax.vat.reduced'),
  profitTaxPercent: regulatoryNumber('tax.profit.standard'),
}
// Порог показан справочно в текущей редакции калькулятора: он не заменяет
// индивидуальную проверку обязанности перейти на иной режим.
export const GENERAL_REGIME_THRESHOLD = regulatoryNumber('tax.regime.threshold')

const fmt = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} сум`
const parseMln = (value: string) => Math.max(0, Number(value.replace(/\s/g, '').replace(',', '.')) || 0)

export function calculateRegimeComparison(input: RegimeInputs, rates: RegimeRates = DEFAULT_REGIME_RATES): RegimeOutcome[] {
  const vat12 = rates.vat12Percent / 100
  const vat6 = rates.vat6Percent / 100
  const profitRate = rates.profitTaxPercent / 100
  const domestic = input.domesticRevenueMln * MLN
  const exportRevenue = input.exportRevenueMln * MLN
  const revenue = domestic + exportRevenue
  const purchases12 = input.purchasesVat12Mln * MLN
  const purchases6 = input.purchasesVat6Mln * MLN
  const otherExpenses = input.otherExpensesMln * MLN
  const allExpenses = purchases12 + purchases6 + otherExpenses

  const turnoverTax = revenue * (input.turnoverRate / 100)
  const vat6Tax = revenue * vat6
  const outputVat = domestic * vat12 // экспорт в модели облагается по нулевой ставке
  const inputVat = purchases12 * vat12 / (1 + vat12) + purchases6 * vat6 / (1 + vat6)
  const vatToPay = Math.max(0, outputVat - inputVat)
  // Для прибыли учитываем расходы без НДС, который был принят к зачёту.
  const deductibleCosts = purchases12 / (1 + vat12) + purchases6 / (1 + vat6) + otherExpenses
  const profitBeforeTax = Math.max(0, revenue - deductibleCosts)
  const profitTax = profitBeforeTax * profitRate

  return [
    {
      id: 'turnover', label: `Налог с оборота ${input.turnoverRate}%`, available: !input.turnoverUnavailable,
      tax: turnoverTax, netProfit: revenue - allExpenses - turnoverTax,
      lines: [{ label: 'Налог с оборота', value: turnoverTax }],
    },
    {
      id: 'vat6', label: `Упрощённый НДС ${rates.vat6Percent}%`, available: !input.vat6Unavailable,
      tax: vat6Tax, netProfit: revenue - allExpenses - vat6Tax,
      lines: [{ label: `НДС ${rates.vat6Percent}%`, value: vat6Tax }],
    },
    {
      id: 'general', label: `НДС ${rates.vat12Percent}% + налог на прибыль`, available: true,
      tax: vatToPay + profitTax, netProfit: revenue - deductibleCosts - vatToPay - profitTax,
      lines: [
        { label: `Исходящий НДС ${rates.vat12Percent}%`, value: outputVat },
        { label: 'Входящий НДС к зачёту', value: -inputVat },
        { label: 'НДС к уплате', value: vatToPay },
        { label: `Налог на прибыль ${rates.profitTaxPercent}%`, value: profitTax },
      ],
    },
  ]
}

const Field = ({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) => (
  <label className="block">
    <span className="text-xs font-bold text-bx-text">{label}</span>
    <span className="mt-1 block text-[10px] leading-relaxed text-bx-muted">{hint}</span>
    <span className="mt-2 block"><MoneyInput value={value} onChange={onChange} /></span>
  </label>
)

export default function RegimeCompareCalc() {
  const VAT_12_PERCENT = useRegulatoryNumber('tax.vat.standard')
  const VAT_6_PERCENT = useRegulatoryNumber('tax.vat.reduced')
  const PROFIT_TAX_PERCENT = useRegulatoryNumber('tax.profit.standard')
  const TURNOVER_TAX_PERCENT = useRegulatoryNumber('tax.turnover.standard')
  const generalRegimeThreshold = useRegulatoryNumber('tax.regime.threshold')
  const [current, setCurrent] = useState<TaxRegime>('general')
  const [activity, setActivity] = useState<'services' | 'production'>('services')
  const [turnoverRate, setTurnoverRate] = useState(String(TURNOVER_TAX_PERCENT))
  const [transitionMonth, setTransitionMonth] = useState('7')
  const [turnoverUnavailable, setTurnoverUnavailable] = useState(false)
  const [vat6Unavailable, setVat6Unavailable] = useState(false)
  const [voluntaryVat, setVoluntaryVat] = useState(false)
  const [agent, setAgent] = useState(false)
  const [domestic, setDomestic] = useState('')
  const [retail, setRetail] = useState('')
  const [exportRevenue, setExportRevenue] = useState('')
  const [purchases12, setPurchases12] = useState('')
  const [purchases6, setPurchases6] = useState('')
  const [otherExpenses, setOtherExpenses] = useState('')

  const input = useMemo<RegimeInputs>(() => ({
    domesticRevenueMln: parseMln(domestic), exportRevenueMln: parseMln(exportRevenue),
    purchasesVat12Mln: parseMln(purchases12), purchasesVat6Mln: parseMln(purchases6), otherExpensesMln: parseMln(otherExpenses),
    turnoverRate: Math.min(100, Math.max(0, Number(turnoverRate.replace(',', '.')) || TURNOVER_TAX_PERCENT)),
    turnoverUnavailable, vat6Unavailable: vat6Unavailable || activity === 'production',
  }), [activity, domestic, exportRevenue, otherExpenses, purchases12, purchases6, turnoverRate, turnoverUnavailable, vat6Unavailable])
  const revenue = (input.domesticRevenueMln + input.exportRevenueMln) * MLN
  const rates = useMemo(() => ({
    vat12Percent: VAT_12_PERCENT,
    vat6Percent: VAT_6_PERCENT,
    profitTaxPercent: PROFIT_TAX_PERCENT,
  }), [PROFIT_TAX_PERCENT, VAT_12_PERCENT, VAT_6_PERCENT])
  const outcomes = useMemo(() => calculateRegimeComparison(input, rates), [input, rates])
  const available = outcomes.filter(item => item.available)
  const winner = available.slice().sort((left, right) => left.tax - right.tax)[0]
  const monthsLeft = Math.max(0, 13 - Number(transitionMonth))
  const hasRevenue = revenue > 0

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/[0.10] via-bx-surface to-violet-500/[0.06] p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-300">Налоги · ориентировочный сценарий</p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-bx-text">Какой налоговый режим выгоднее</h2>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-bx-muted">Сравнение налога с оборота, НДС {VAT_6_PERCENT}% и общего НДС {VAT_12_PERCENT}% с налогом на прибыль. Суммы вводятся за полный год, в миллионах сум.</p>
      </header>

      <section className="rounded-2xl border border-bx-border bg-bx-surface p-5" aria-labelledby="regime-profile-title">
        <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">Шаг 1</p><h3 id="regime-profile-title" className="mt-1 text-sm font-black text-bx-text">Профиль предприятия</h3></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block"><span className="text-xs font-bold text-bx-text">Текущий режим</span><select value={current} onChange={event => setCurrent(event.target.value as TaxRegime)} className="mt-2 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm font-semibold text-bx-text"><option value="turnover">Налог с оборота</option><option value="vat6">Упрощённый НДС {VAT_6_PERCENT}%</option><option value="general">Общий НДС {VAT_12_PERCENT}% + налог на прибыль</option></select></label>
          <label className="block"><span className="text-xs font-bold text-bx-text">Сфера деятельности</span><select value={activity} onChange={event => setActivity(event.target.value as 'services' | 'production')} className="mt-2 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm font-semibold text-bx-text"><option value="services">Торговля, общепит или услуги</option><option value="production">Производство товаров</option></select><span className="mt-1 block text-[10px] leading-relaxed text-bx-muted">Для услуг используйте сценарии с НДС {VAT_6_PERCENT}%; для производства он отмечается как недоступный.</span></label>
          <label className="block"><span className="text-xs font-bold text-bx-text">Ставка налога с оборота</span><select value={turnoverRate} onChange={event => setTurnoverRate(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm font-semibold text-bx-text"><option value={TURNOVER_TAX_PERCENT}>{TURNOVER_TAX_PERCENT}% — базовая</option><option value="1">1% — при подтверждённом праве</option><option value="2">2% — при подтверждённом праве</option></select><span className="mt-1 block text-[10px] leading-relaxed text-bx-muted">Выберите пониженную ставку только после подтверждения права на неё.</span></label>
          <label className="block"><span className="text-xs font-bold text-bx-text">Месяц перехода на новый режим</span><select value={transitionMonth} onChange={event => setTransitionMonth(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm font-semibold text-bx-text">{['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'].map((month, index) => <option key={month} value={index + 1}>{month} 2026</option>)}</select><span className="mt-1 block text-[10px] leading-relaxed text-bx-muted">Остаток года в сравнении считается пропорционально месяцам.</span></label>
        </div>
        <div className="mt-5 space-y-3 border-t border-bx-border pt-4">
          <Check checked={turnoverUnavailable} onChange={setTurnoverUnavailable} title="Основной вид деятельности исключает налог с оборота" text="Производство или продажа ювелирных изделий, лекарства, подакцизные товары, нефтепродукты, алкоголь, рынки, аудит и другие ограничения — отметьте после проверки статуса." />
          <Check checked={vat6Unavailable} onChange={setVat6Unavailable} title="Крупный налогоплательщик или госдоля от 50%" text={`Отметка исключает НДС ${VAT_6_PERCENT}% из сравнения.`} />
          <Check checked={voluntaryVat} onChange={setVoluntaryVat} title="На НДС перешли добровольно менее 12 месяцев назад" text="Не влияет на сумму, но напомнит проверить срок возврата на оборот." />
          <Check checked={agent} onChange={setAgent} title="Посредник: база — вознаграждение" text="Вносите в выручку только агентское/комиссионное вознаграждение, не всю стоимость продаж." />
        </div>
      </section>

      <section className="rounded-2xl border border-bx-border bg-bx-surface p-5" aria-labelledby="regime-data-title">
        <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">Шаг 2</p><h3 id="regime-data-title" className="mt-1 text-sm font-black text-bx-text">Выручка и расходы за полный год, млн сум</h3><p className="mt-1 text-[10px] text-bx-muted">Для посредника — только вознаграждение. Поле покупателей без зачёта НДС справочное и на сумму налога не влияет.</p></div>
        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Чистая выручка внутри страны (без НДС)" hint="Реализация на территории Узбекистана без НДС." value={domestic} onChange={setDomestic} />
          <Field label="В том числе без зачёта НДС" hint="Физлица, оборотники и льготники. Только для оценки цены." value={retail} onChange={setRetail} />
          <Field label="Чистая экспортная выручка (без НДС)" hint="На общем НДС экспорт в модели имеет ставку 0%." value={exportRevenue} onChange={setExportRevenue} />
          <Field label={`Закупки с НДС ${VAT_12_PERCENT}%`} hint={`Полная сумма оплаты; зачёт ${VAT_12_PERCENT}/${100 + VAT_12_PERCENT} учитывается только на общем режиме.`} value={purchases12} onChange={setPurchases12} />
          <Field label={`Закупки с НДС ${VAT_6_PERCENT}%`} hint={`Полная сумма оплаты; зачёт ${VAT_6_PERCENT}/${100 + VAT_6_PERCENT} учитывается только на общем режиме.`} value={purchases6} onChange={setPurchases6} />
          <Field label="Закупки без НДС и прочие расходы" hint="Например, ФОТ с соцналогом, аренда у физлиц, закупки у оборотников." value={otherExpenses} onChange={setOtherExpenses} />
        </div>
      </section>

      {!hasRevenue ? <div className="rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/[0.09] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">Введите прогноз выручки</p><h3 className="mt-1 text-lg font-black text-bx-text">Здесь появится сравнение режимов</h3><p className="mt-1 text-xs leading-relaxed text-bx-muted">Заполните хотя бы одно поле выручки — налоги и чистая прибыль посчитаются автоматически.</p></div> : <>
        <section className="grid gap-3 xl:grid-cols-3" aria-label="Сравнение режимов">{outcomes.map(outcome => <article key={outcome.id} className={`rounded-2xl border p-4 ${outcome.available ? (winner?.id === outcome.id ? 'border-emerald-500/50 bg-emerald-500/[0.08] ring-1 ring-emerald-500/15' : 'border-bx-border bg-bx-surface') : 'border-bx-border bg-bx-bg opacity-60'}`}><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-black text-bx-text">{outcome.label}</h3>{winner?.id === outcome.id && <span className="rounded-full bg-emerald-600 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-white">Меньше налог</span>}</div>{!outcome.available ? <p className="mt-4 text-xs font-semibold text-bx-muted">Недоступен по отмеченному ограничению.</p> : <><p className="mt-5 text-[10px] font-bold uppercase tracking-wide text-bx-muted">Налоги за год</p><p className="mt-1 text-2xl font-black tabular-nums text-bx-text">{fmt(outcome.tax)}</p><p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-bx-muted">Остаток 2026 · {monthsLeft} мес.</p><p className="mt-1 text-sm font-black tabular-nums text-bx-text">{fmt(outcome.tax * monthsLeft / 12)}</p><p className="mt-4 border-t border-bx-border pt-3 text-[10px] text-bx-muted">Оценка чистой прибыли: <b className="tabular-nums text-bx-text">{fmt(outcome.netProfit)}</b></p></>}</article>)}</section>
        {winner && <CalcResult title="Сравнение налоговых режимов" rows={[{ label: `Минимальная расчётная нагрузка — ${winner.label}`, value: fmt(winner.tax), highlight: true }, ...outcomes.filter(outcome => outcome.available).map(outcome => ({ label: outcome.label, value: `${fmt(outcome.tax)} · чистая прибыль ${fmt(outcome.netProfit)}` }))]} />}
      </>}

      <aside className="rounded-2xl border border-bx-border bg-bx-bg p-4 text-[11px] leading-relaxed text-bx-muted"><b className="text-bx-text">Что проверить перед решением.</b> Порог общего режима в сценарии: {fmt(generalRegimeThreshold)} в год. {revenue >= generalRegimeThreshold ? 'Ваш прогноз достиг этого порога — проверьте обязанность перехода.' : 'Ваш прогноз ниже этого справочного порога.'} {voluntaryVat ? ' Вы отметили добровольный переход на НДС: проверьте срок возврата на оборот.' : ''} Расчёт ориентировочный: льготы, освобождения, акцизы, перенос убытков, особенности договоров и фактическая налоговая база не учитываются. Перед переходом сверяйте актуальную редакцию НК и решение налогового специалиста.</aside>
    </div>
  )
}

function Check({ checked, onChange, title, text }: { checked: boolean; onChange: (value: boolean) => void; title: string; text: string }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition-colors hover:bg-bx-bg"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-600" /><span><span className="block text-xs font-bold text-bx-text">{title}</span><span className="mt-1 block text-[10px] leading-relaxed text-bx-muted">{text}</span></span></label>
}

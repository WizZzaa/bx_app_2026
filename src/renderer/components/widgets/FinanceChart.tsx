import React from 'react'

interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface FinanceChartProps {
  transactions: {
    amount: number
    type: 'income' | 'expense'
    date: string
    status: string
  }[]
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('ru-RU', { month: 'short' })
}

export default function FinanceChart({ transactions }: FinanceChartProps) {
  // Получаем массив последних 6 месяцев в формате YYYY-MM
  const last6Months = React.useMemo(() => {
    const list = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      list.push(d.toISOString().slice(0, 7))
    }
    return list
  }, [])

  // Группируем доходы и расходы по месяцам
  const data: MonthlyData[] = React.useMemo(() => {
    return last6Months.map(m => {
      let income = 0
      let expense = 0
      for (const t of transactions) {
        if (t.status === 'unpaid') continue
        if (t.date.slice(0, 7) === m) {
          if (t.type === 'income') {
            income += t.amount
          } else {
            expense += t.amount
          }
        }
      }
      return {
        month: formatMonth(m),
        income,
        expense
      }
    })
  }, [transactions, last6Months])

  // Расчет максимального значения для масштабирования графика
  const maxVal = React.useMemo(() => {
    const max = Math.max(...data.flatMap(d => [d.income, d.expense]))
    return max > 0 ? max * 1.15 : 1000000 // Запас 15% сверху
  }, [data])

  const chartHeight = 160
  const chartWidth = 500
  const paddingLeft = 60
  const paddingRight = 20
  const paddingTop = 15
  const paddingBottom = 25

  const graphWidth = chartWidth - paddingLeft - paddingRight
  const graphHeight = chartHeight - paddingTop - paddingBottom

  // Форматирование денег для оси Y
  const fmtYAxis = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' млн'
    if (val >= 1000) return (val / 1000).toFixed(0) + ' т.'
    return String(val)
  }

  // Отрисовка сетки по Y
  const yTicks = [0, maxVal / 2, maxVal]

  return (
    <div className="bg-[#141820] border border-[#1e2535] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-300">📊 Динамика доходов и расходов</h4>
          <p className="text-[10px] text-slate-500">Статистика за последние 6 месяцев (сум)</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
            <span className="text-slate-400">Доходы</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />
            <span className="text-slate-400">Расходы</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[180px]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          {/* Горизонтальные линии сетки и подписи оси Y */}
          {yTicks.map((tick, idx) => {
            const y = paddingTop + graphHeight - (tick / maxVal) * graphHeight
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#1e2535"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#515f73"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="sans-serif"
                >
                  {fmtYAxis(tick)}
                </text>
              </g>
            )
          })}

          {/* Столбики данных */}
          {data.map((d, idx) => {
            const step = graphWidth / data.length
            const xCenter = paddingLeft + idx * step + step / 2
            const barWidth = 10
            
            // Координаты для доходов
            const incHeight = (d.income / maxVal) * graphHeight
            const incX = xCenter - barWidth - 2
            const incY = paddingTop + graphHeight - incHeight

            // Координаты для расходов
            const expHeight = (d.expense / maxVal) * graphHeight
            const expX = xCenter + 2
            const expY = paddingTop + graphHeight - expHeight

            return (
              <g key={idx} className="group">
                {/* Доходы */}
                <rect
                  x={incX}
                  y={incY}
                  width={barWidth}
                  height={Math.max(incHeight, 2)}
                  rx="2"
                  className="fill-emerald-500/80 group-hover:fill-emerald-400 transition-colors"
                />
                
                {/* Расходы */}
                <rect
                  x={expX}
                  y={expY}
                  width={barWidth}
                  height={Math.max(expHeight, 2)}
                  rx="2"
                  className="fill-red-500/80 group-hover:fill-red-400 transition-colors"
                />

                {/* Подписи оси X */}
                <text
                  x={xCenter}
                  y={chartHeight - 6}
                  fill="#8b9bb4"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {d.month}
                </text>
              </g>
            )
          })}

          {/* Оси */}
          <line
            x1={paddingLeft}
            y1={paddingTop + graphHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + graphHeight}
            stroke="#2a3447"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  )
}

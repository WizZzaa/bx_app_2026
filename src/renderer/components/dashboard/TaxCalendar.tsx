import React, { useMemo, useState } from 'react'
import { deadlinesForMonth, summarizeTaxDeadlineCatalog, type TaxDeadline } from '../../data/taxCalendar'
import Icon from '../../lib/ui/Icon'

const TAX_DEADLINE_CATALOG = summarizeTaxDeadlineCatalog()
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface Props {
  onPickDeadline: (date: string, deadline: TaxDeadline) => void
}

const formatDay = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

export default function TaxCalendar({ onPickDeadline }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const deadlines = useMemo(() => {
    const map = new Map<string, TaxDeadline[]>()
    for (const { date, deadline } of deadlinesForMonth(year, month)) {
      map.set(date, [...(map.get(date) ?? []), deadline])
    }
    return map
  }, [year, month])

  const cells = useMemo(() => {
    const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const result: (number | null)[] = Array.from({ length: startOffset }, () => null)
    for (let day = 1; day <= daysInMonth; day += 1) result.push(day)
    while (result.length % 7 !== 0) result.push(null)
    return result
  }, [year, month])

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const dateString = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const selectedDeadlines = selected ? deadlines.get(selected) ?? [] : []
  const deadlineDates = [...deadlines.keys()].sort()
  const nearestDate = deadlineDates.find(date => date >= today) ?? deadlineDates[0] ?? null
  const nearestDeadline = nearestDate ? deadlines.get(nearestDate)?.[0] ?? null : null

  const previousMonth = () => {
    setSelected(null)
    if (month === 0) { setMonth(11); setYear(value => value - 1) } else setMonth(value => value - 1)
  }
  const nextMonth = () => {
    setSelected(null)
    if (month === 11) { setMonth(0); setYear(value => value + 1) } else setMonth(value => value + 1)
  }
  const showToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelected(today)
  }

  return (
    <div className="bx-tax-calendar">
      <header className="bx-tax-calendar__header">
        <div className="bx-tax-calendar__title">
          <span aria-hidden="true"><Icon name="planner" /></span>
          <div>
            <p>Бухгалтерский календарь</p>
            <h2>Сроки и отчётность</h2>
            <small>Выберите дату — BX покажет срок и подготовит задачу.</small>
          </div>
        </div>
        <div className="bx-tax-calendar__controls" aria-label="Навигация по месяцам">
          <button type="button" onClick={previousMonth} aria-label="Предыдущий месяц"><Icon name="arrowL" /></button>
          <strong>{MONTHS[month]} <span>{year}</span></strong>
          <button type="button" onClick={nextMonth} aria-label="Следующий месяц"><Icon name="arrowR" /></button>
        </div>
      </header>

      <div className="bx-tax-calendar__toolbar">
        <button type="button" onClick={showToday}>Сегодня</button>
        <div className="bx-tax-calendar__legend" aria-label="Обозначения календаря">
          <span><i className="bx-tax-calendar__dot bx-tax-calendar__dot--report" /> Отчёт</span>
          <span><i className="bx-tax-calendar__dot bx-tax-calendar__dot--payment" /> Уплата</span>
        </div>
      </div>

      {nearestDate && nearestDeadline ? (
        <button type="button" className="bx-tax-calendar__nearest" onClick={() => setSelected(nearestDate)}>
          <span><Icon name="clock" /></span>
          <div><small>Ближайший общий срок · {formatDay(nearestDate)}</small><strong>{nearestDeadline.title}</strong></div>
          <Icon name="arrowR" />
        </button>
      ) : TAX_DEADLINE_CATALOG.needsReview > 0 ? (
        <div className="bx-tax-calendar__review" role="status">
          <span><Icon name="shield" /></span>
          <div><strong>Проверяем календарь по официальным источникам</strong><p>{TAX_DEADLINE_CATALOG.needsReview} сроков пока не используются для автозадач. Ранее созданные задачи сохранены.</p></div>
        </div>
      ) : null}

      <div className="bx-tax-calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map(weekday => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="bx-tax-calendar__grid">
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} aria-hidden="true" />
          const date = dateString(day)
          const dayDeadlines = deadlines.get(date) ?? []
          const hasPayment = dayDeadlines.some(item => item.kind === 'payment' || item.kind === 'both')
          const hasReport = dayDeadlines.some(item => item.kind === 'report' || item.kind === 'both')
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(selected === date ? null : date)}
              className={`${date === selected ? 'is-selected' : ''} ${date === today ? 'is-today' : ''}`}
              aria-pressed={date === selected}
              aria-label={`${day} ${MONTHS[month]}${dayDeadlines.length ? `, бухгалтерских сроков: ${dayDeadlines.length}` : ', общих сроков нет'}`}
            >
              <span>{day}</span>
              {(hasReport || hasPayment) && <i aria-hidden="true">{hasReport && <b className="bx-tax-calendar__dot bx-tax-calendar__dot--report" />}{hasPayment && <b className="bx-tax-calendar__dot bx-tax-calendar__dot--payment" />}</i>}
            </button>
          )
        })}
      </div>

      {selected && (
        <section className="bx-tax-calendar__details" aria-live="polite" aria-label={`Сроки на ${formatDay(selected)}`}>
          <div className="bx-tax-calendar__details-heading"><div><small>{formatDay(selected)}</small><h3>{selectedDeadlines.length ? `${selectedDeadlines.length} общих срока` : 'Общих сроков нет'}</h3></div><button type="button" onClick={() => setSelected(null)} aria-label="Закрыть выбранную дату"><Icon name="crossSmall" /></button></div>
          {selectedDeadlines.length ? selectedDeadlines.map(deadline => (
            <article key={deadline.id}>
              <span className={`bx-tax-calendar__dot bx-tax-calendar__dot--${deadline.kind === 'payment' ? 'payment' : 'report'}`} />
              <div><strong>{deadline.title}</strong><small>{deadline.kind === 'payment' ? 'Уплата' : deadline.kind === 'report' ? 'Отчётность' : 'Отчётность и уплата'} · {deadline.taxType}</small></div>
              <button type="button" onClick={() => onPickDeadline(selected, deadline)}><Icon name="plus" /> Добавить задачу</button>
            </article>
          )) : <p>На этот день нет подтверждённых общих сроков. Личную задачу можно добавить через кнопку «Новая задача» выше.</p>}
        </section>
      )}
    </div>
  )
}

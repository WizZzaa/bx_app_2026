import React from 'react'
import Button from '../../components/ui/Button'
import { Sheet } from '../../components/ui/Sheet'
import Icon from '../../lib/ui/Icon'
import type { CalCard } from './CalendarView'
import type { BxBoard } from './useBoards'
import type { BxEvent, EventStatus } from './useEvents'
import './PlannerA2.css'

interface Props {
  date: string
  events: BxEvent[]
  cards: CalCard[]
  boards: BxBoard[]
  onEventClick: (event: BxEvent) => void
  onCardClick: (id: string) => void
  onEventStatusChange: (id: string, status: EventStatus) => void
  onCardStatusChange: (id: string, boardId: string, done: boolean) => void
  onDeleteEvent: (id: string) => void
  onDeleteCard: (id: string) => void
  onAddClick: (date: string) => void
  onClose: () => void
}

const TYPE_ICON: Record<string, string> = {
  task: 'check',
  tax_deadline: 'receipt',
  reminder: 'bell',
  event: 'planner',
}

export default function DailyTasksModal({
  date,
  events,
  cards,
  boards,
  onEventClick,
  onCardClick,
  onEventStatusChange,
  onCardStatusChange,
  onDeleteEvent,
  onDeleteCard,
  onAddClick,
  onClose,
}: Props) {
  const isCardDone = (card: CalCard) => {
    const board = boards.find(item => item.id === card.board_id)
    if (!board?.columns?.length) return false
    return card.column_id === board.columns[board.columns.length - 1].id
  }

  const formattedDate = React.useMemo(() => {
    const currentDate = new Date(date)
    const day = currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    const weekday = currentDate.toLocaleDateString('ru-RU', { weekday: 'long' })
    return `${day}, ${weekday}`
  }, [date])

  const boardName = (id: string) => boards.find(board => board.id === id)?.name ?? 'Доска'
  const boardIcon = (id: string) => boards.find(board => board.id === id)?.icon ?? '🗂️'
  const itemCount = events.length + cards.length

  const footer = (
    <Button
      type="button"
      className="bx-planner-daily-sheet__add"
      onClick={() => {
        onAddClick(date)
        onClose()
      }}
    >
      <Icon name="plus" className="h-4 w-4" />
      Добавить задачу или событие
    </Button>
  )

  return (
    <Sheet
      open
      onClose={onClose}
      title="План дня"
      description={`${formattedDate} · ${itemCount} ${itemCount === 1 ? 'запись' : 'записей'}`}
      closeLabel="Закрыть план дня"
      className="bx-planner-sheet bx-planner-daily-sheet"
      footer={footer}
    >
      {itemCount === 0 && (
        <div className="bx-planner-daily-empty">
          <span aria-hidden="true"><Icon name="check" /></span>
          <h3>На этот день всё спокойно</h3>
          <p>Запланированных дел нет. Добавьте задачу, событие или напоминание.</p>
        </div>
      )}

      {events.length > 0 && (
        <section className="bx-planner-daily-group" aria-labelledby="planner-daily-events-title">
          <div className="bx-planner-daily-group__heading">
            <div><h3 id="planner-daily-events-title">Задачи и события</h3><p>Из календаря Планировщика</p></div>
            <span>{events.length}</span>
          </div>
          <div className="bx-planner-daily-list">
            {events.map(event => {
              const done = event.status === 'done'
              return (
                <article key={`e-${event.id}`} className="bx-planner-daily-item" data-complete={done}>
                  <label className="bx-planner-daily-item__check">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => onEventStatusChange(event.id, done ? 'todo' : 'done')}
                    />
                    <span className="sr-only">{done ? 'Вернуть в работу' : 'Отметить выполненным'}: {event.title}</span>
                  </label>
                  <span className="bx-planner-daily-item__icon" aria-hidden="true"><Icon name={TYPE_ICON[event.type] ?? 'planner'} /></span>
                  <button
                    type="button"
                    className="bx-planner-daily-item__main"
                    onClick={() => {
                      onEventClick(event)
                      onClose()
                    }}
                  >
                    <strong>{event.title}</strong>
                    <span>{event.type === 'tax_deadline' ? 'Налоговый срок' : event.status === 'in_progress' ? 'В работе' : 'Запись планировщика'}</span>
                  </button>
                  {event.priority === 'high' && <span className="bx-planner-daily-item__badge is-danger">Важно</span>}
                  <button type="button" onClick={() => onDeleteEvent(event.id)} className="bx-planner-daily-item__delete" aria-label={`Удалить: ${event.title}`}>
                    <Icon name="trash" />
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {cards.length > 0 && (
        <section className="bx-planner-daily-group" aria-labelledby="planner-daily-cards-title">
          <div className="bx-planner-daily-group__heading">
            <div><h3 id="planner-daily-cards-title">Карточки досок</h3><p>Привязаны к выбранной дате</p></div>
            <span>{cards.length}</span>
          </div>
          <div className="bx-planner-daily-list">
            {cards.map(card => {
              const done = isCardDone(card)
              return (
                <article key={`c-${card.id}`} className="bx-planner-daily-item" data-complete={done}>
                  <label className="bx-planner-daily-item__check">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => onCardStatusChange(card.id, card.board_id, !done)}
                    />
                    <span className="sr-only">{done ? 'Вернуть в работу' : 'Отметить выполненной'}: {card.title}</span>
                  </label>
                  <span className="bx-planner-daily-item__symbol" aria-hidden="true">{boardIcon(card.board_id)}</span>
                  <button
                    type="button"
                    className="bx-planner-daily-item__main"
                    onClick={() => {
                      onCardClick(card.id)
                      onClose()
                    }}
                  >
                    <strong>{card.title}</strong>
                    <span>{boardName(card.board_id)}</span>
                  </button>
                  <button type="button" onClick={() => onDeleteCard(card.id)} className="bx-planner-daily-item__delete" aria-label={`Удалить: ${card.title}`}>
                    <Icon name="trash" />
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </Sheet>
  )
}

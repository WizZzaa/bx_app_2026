import React, { useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import { Field } from '../../components/ui/FormControls'
import { Sheet } from '../../components/ui/Sheet'
import Icon from '../../lib/ui/Icon'
import { BOARD_ICONS, COLUMN_COLORS, type BxBoard } from './useBoards'
import './PlannerA2.css'

interface Props {
  board?: BxBoard | null
  onSave: (name: string, icon: string, color: string) => void
  onDelete?: () => void
  onClose: () => void
}

const COLOR_LABELS: Record<string, string> = {
  slate: 'Графитовый',
  blue: 'Голубой',
  amber: 'Янтарный',
  emerald: 'Изумрудный',
  purple: 'Лавандовый',
  red: 'Красный',
  pink: 'Розовый',
  cyan: 'Бирюзовый',
}

export default function BoardModal({ board, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(board?.name ?? '')
  const [icon, setIcon] = useState(board?.icon ?? '📋')
  const [color, setColor] = useState(board?.color ?? 'blue')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [nameError, setNameError] = useState<string>()
  const nameRef = useRef<HTMLInputElement>(null)

  function save() {
    if (!name.trim()) {
      setNameError('Введите название доски.')
      requestAnimationFrame(() => nameRef.current?.focus())
      return
    }
    onSave(name.trim(), icon, color)
  }

  const deleteControl = board && onDelete && !board.is_default
    ? confirmDelete
      ? (
          <div className="bx-planner-sheet__delete-confirm">
            <span>Удалить доску и все карточки?</span>
            <Button type="button" variant="danger" onClick={onDelete}>Удалить</Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>Оставить</Button>
          </div>
        )
      : <Button type="button" variant="ghost" className="bx-planner-sheet__destructive" onClick={() => setConfirmDelete(true)}>Удалить доску</Button>
    : board?.is_default
      ? <span className="bx-planner-sheet__hint">Доску по умолчанию нельзя удалить</span>
      : null

  const footer = (
    <div className="bx-planner-sheet__footer">
      <div className="bx-planner-sheet__footer-leading">{deleteControl}</div>
      <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
      <Button type="submit" form="bx-planner-board-form">
        <Icon name={board ? 'save' : 'plus'} className="h-4 w-4" />
        {board ? 'Сохранить изменения' : 'Создать доску'}
      </Button>
    </div>
  )

  return (
    <Sheet
      open
      onClose={onClose}
      title={board ? 'Настройки доски' : 'Новая доска'}
      description="Название, символ и спокойный цвет помогут быстро отличить рабочий контекст."
      closeLabel="Закрыть настройки доски"
      initialFocusRef={nameRef}
      className="bx-planner-sheet bx-planner-board-sheet"
      footer={footer}
    >
      <form id="bx-planner-board-form" className="bx-planner-form" onSubmit={formEvent => { formEvent.preventDefault(); save() }} noValidate>
        <Field
          ref={nameRef}
          label="Название доски"
          required
          error={nameError}
          value={name}
          onChange={changeEvent => {
            setName(changeEvent.target.value)
            setNameError(undefined)
          }}
          placeholder="Например, клиент ООО «Восход»"
          autoComplete="off"
        />

        <fieldset className="bx-planner-choice">
          <legend>Символ</legend>
          <p>Используется в календаре и списке досок.</p>
          <div className="bx-planner-choice__icons">
            {BOARD_ICONS.map(item => (
              <button type="button" key={item} onClick={() => setIcon(item)} aria-label={`Выбрать символ ${item}`} aria-pressed={icon === item}>
                <span aria-hidden="true">{item}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="bx-planner-choice">
          <legend>Цвет</legend>
          <p>Мягкий акцент не меняет данные и доступы доски.</p>
          <div className="bx-planner-choice__colors">
            {COLUMN_COLORS.map(item => (
              <button type="button" key={item} onClick={() => setColor(item)} aria-label={COLOR_LABELS[item] ?? item} aria-pressed={color === item}>
                <span className={`bx-planner-choice__swatch is-${item}`} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Sheet>
  )
}

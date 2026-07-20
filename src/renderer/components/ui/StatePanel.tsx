import React from 'react'
import './design-system.css'

export type StatePanelStatus =
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'permission'
  | 'locked'
  | 'stale'
  | 'success'

const LABELS: Record<StatePanelStatus, string> = {
  loading: 'Загрузка',
  empty: 'Нет данных',
  error: 'Ошибка',
  offline: 'Нет соединения',
  permission: 'Нет доступа',
  locked: 'Доступ ограничен',
  stale: 'Данные устарели',
  success: 'Готово',
}

export interface StatePanelProps extends React.HTMLAttributes<HTMLElement> {
  status: StatePanelStatus
  title: string
  description?: string
  action?: React.ReactNode
}

export function StatePanel({ status, title, description, action, className = '', ...props }: StatePanelProps) {
  const role = status === 'error' || status === 'offline' ? 'alert' : 'status'

  return (
    <section
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      aria-busy={status === 'loading' || undefined}
      data-status={status}
      className={`bx-d1-state-panel ${className}`}
      {...props}
    >
      <p className="bx-d1-state-panel__eyebrow">{LABELS[status]}</p>
      <h2 className="bx-d1-state-panel__title">{title}</h2>
      {description && <p className="bx-d1-state-panel__description">{description}</p>}
      {action}
    </section>
  )
}

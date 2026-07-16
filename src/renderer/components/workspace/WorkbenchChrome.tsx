import React from 'react'
import Icon from '../../lib/ui/Icon'

export type WorkbenchView = 'compact' | 'guided'

interface WorkbenchModeSwitchProps {
  kind: 'calculator' | 'utility'
  view: WorkbenchView
  onViewChange: (view: WorkbenchView) => void
}

export function WorkbenchModeSwitch({ kind, view, onViewChange }: WorkbenchModeSwitchProps) {
  const openSection = (hash: string) => {
    window.location.hash = hash
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-bx-border bg-bx-bg p-1" aria-label="Раздел рабочего центра">
        <button
          type="button"
          onClick={() => openSection('/calc')}
          className={`min-h-10 rounded-lg px-2 text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${kind === 'calculator' ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}
        >
          Калькуляторы
        </button>
        <button
          type="button"
          onClick={() => openSection('/tools')}
          className={`min-h-10 rounded-lg px-2 text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${kind === 'utility' ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}
        >
          Утилиты
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-bx-surface-2 p-1" aria-label="Плотность интерфейса">
        <button
          type="button"
          onClick={() => onViewChange('compact')}
          aria-pressed={view === 'compact'}
          className={`min-h-9 rounded-lg px-2 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${view === 'compact' ? 'bg-bx-surface text-bx-text shadow-sm' : 'text-bx-muted hover:text-bx-text'}`}
        >
          Компактно
        </button>
        <button
          type="button"
          onClick={() => onViewChange('guided')}
          aria-pressed={view === 'guided'}
          className={`min-h-9 rounded-lg px-2 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${view === 'guided' ? 'bg-bx-surface text-bx-text shadow-sm' : 'text-bx-muted hover:text-bx-text'}`}
        >
          С подсказками
        </button>
      </div>
    </div>
  )
}

interface WorkbenchActionsProps {
  isFavorite: boolean
  onToggleFavorite: () => void
  onReset: () => void
  onExport?: () => void
  showGuide: boolean
  onToggleGuide: () => void
}

export function WorkbenchActions({ isFavorite, onToggleFavorite, onReset, onExport, showGuide, onToggleGuide }: WorkbenchActionsProps) {
  const buttonClass = 'min-h-11 rounded-xl border border-bx-border bg-bx-surface px-3 text-xs font-bold text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-bx-text focus:outline-none focus:ring-2 focus:ring-blue-500/40'

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" onClick={onToggleGuide} aria-expanded={showGuide} className={buttonClass}>
        {showGuide ? 'Скрыть шаги' : 'Как работать'}
      </button>
      <button type="button" onClick={onReset} className={buttonClass} title="Очистить поля текущего модуля">
        Сбросить
      </button>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={isFavorite}
        className={`${buttonClass} ${isFavorite ? '!border-amber-500/30 !bg-amber-500/10 !text-amber-700 dark:!text-amber-400' : ''}`}
      >
        {isFavorite ? '★ В избранном' : '☆ Избранное'}
      </button>
      {onExport && (
        <button type="button" onClick={onExport} className="min-h-11 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-bx-bg">
          PDF
        </button>
      )}
    </div>
  )
}

export function WorkbenchGuide({ kind }: { kind: 'calculator' | 'utility' }) {
  const steps = kind === 'calculator'
    ? [
        ['1', 'Введите исходные данные', 'Поля считают результат сразу; суммы можно вводить с пробелами.'],
        ['2', 'Проверьте результат', 'Главное значение выделено, остальные показатели собраны ниже.'],
        ['3', 'Заберите расчёт', 'Копируйте число, весь расчёт или сохраните его в TXT/PDF.'],
      ]
    : [
        ['1', 'Добавьте данные', 'Введите текст, реквизиты или выберите файл — в зависимости от модуля.'],
        ['2', 'Запустите обработку', 'Проверяйте предупреждения до применения системных действий.'],
        ['3', 'Сохраните результат', 'Скопируйте, скачайте или перенесите готовые данные в рабочий документ.'],
      ]

  return (
    <div className="mb-4 grid gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-3 sm:grid-cols-3">
      {steps.map(([number, title, text]) => (
        <div key={number} className="flex gap-2.5 rounded-xl bg-bx-surface/80 p-3">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-blue-600 text-[11px] font-black text-white">{number}</span>
          <div>
            <p className="text-xs font-extrabold text-bx-text">{title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-bx-muted">{text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface WorkbenchCanvasProps {
  children: React.ReactNode
  resetKey: React.Key
  fullHeight?: boolean
}

export function WorkbenchCanvas({ children, resetKey, fullHeight }: WorkbenchCanvasProps) {
  return (
    <div
      className={`${fullHeight ? 'h-full overflow-hidden p-4' : 'p-4 sm:p-5'} rounded-2xl border border-bx-border bg-bx-surface shadow-sm [&_button]:cursor-pointer [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-blue-500/40 [&_input]:min-h-11 [&_select]:min-h-11 [&_textarea]:leading-relaxed`}
    >
      <React.Fragment key={resetKey}>{children}</React.Fragment>
    </div>
  )
}

export function WorkbenchEmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-bx-border p-4 text-center">
      <Icon name="search" className="mx-auto h-5 w-5 text-bx-muted" />
      <p className="mt-2 text-xs font-semibold text-bx-muted">{text}</p>
    </div>
  )
}

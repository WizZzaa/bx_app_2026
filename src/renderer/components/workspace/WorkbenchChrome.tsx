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
          className={`min-h-11 rounded-lg px-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${kind === 'calculator' ? 'bg-violet-600 text-white' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}
        >
          Калькуляторы
        </button>
        <button
          type="button"
          onClick={() => openSection('/tools')}
          className={`min-h-11 rounded-lg px-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${kind === 'utility' ? 'bg-violet-600 text-white' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}
        >
          Утилиты
        </button>
      </div>
      <div className="hidden grid-cols-2 gap-1 rounded-xl bg-bx-surface-2 p-1 lg:grid" aria-label="Плотность интерфейса">
        <button
          type="button"
          onClick={() => onViewChange('compact')}
          aria-pressed={view === 'compact'}
          className={`min-h-10 rounded-lg px-2 text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${view === 'compact' ? 'bg-bx-surface text-bx-text shadow-sm' : 'text-bx-muted hover:text-bx-text'}`}
        >
          Компактно
        </button>
        <button
          type="button"
          onClick={() => onViewChange('guided')}
          aria-pressed={view === 'guided'}
          className={`min-h-10 rounded-lg px-2 text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${view === 'guided' ? 'bg-bx-surface text-bx-text shadow-sm' : 'text-bx-muted hover:text-bx-text'}`}
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
  const buttonClass = 'min-h-11 rounded-xl border border-bx-border bg-bx-surface px-3 text-xs font-bold text-bx-muted transition-colors hover:border-violet-500/30 hover:text-bx-text focus:outline-none focus:ring-2 focus:ring-violet-500/40'

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
        <button type="button" onClick={onExport} className="min-h-11 rounded-xl bg-violet-600 px-3.5 text-xs font-bold text-white transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-bx-bg">
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
    <div className="mb-4 grid gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-3 sm:grid-cols-3">
      {steps.map(([number, title, text]) => (
        <div key={number} className="flex gap-2.5 rounded-xl bg-bx-surface/80 p-3">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-violet-600 text-[11px] font-black text-white">{number}</span>
          <div>
            <p className="text-xs font-extrabold text-bx-text">{title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-bx-muted">{text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface WorkbenchTutorialProps {
  kind: 'calculator' | 'utility'
  enabled: boolean
  onToggle: () => void
}

export function WorkbenchTutorial({ kind, enabled, onToggle }: WorkbenchTutorialProps) {
  const isCalculator = kind === 'calculator'
  const steps = isCalculator
    ? [
        ['search', 'Найдите расчёт', 'Введите название или выберите понятную группу слева.'],
        ['note', 'Заполните исходные данные', 'Поля и единицы измерения остаются рядом — ничего не нужно угадывать.'],
        ['shield', 'Проверьте ставку', 'Жёлтая метка подскажет, когда значение требует ручной сверки.'],
        ['save', 'Сохраните результат', 'Скопируйте расчёт или выгрузите PDF в десктопной версии.'],
      ]
    : [
        ['search', 'Выберите задачу', 'Ищите по действию: проверить ИНН, сжать PDF или настроить E-Imzo.'],
        ['download', 'Добавьте данные', 'Файл, текст или реквизиты запрашиваются только внутри выбранной утилиты.'],
        ['shield', 'Проверьте предупреждение', 'Системные действия явно отмечены и не запускаются без вашего клика.'],
        ['check', 'Заберите результат', 'Скопируйте, скачайте или перенесите готовые данные дальше по работе.'],
      ]

  return (
    <section className="mb-4 overflow-hidden rounded-[22px] border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-bx-surface to-bx-surface" aria-labelledby={`${kind}-tutorial-title`}>
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><Icon name="info" className="h-4 w-4" /></span>
          <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">Первый запуск · 4 шага</p><h2 id={`${kind}-tutorial-title`} className="mt-1 text-base font-black text-bx-text">{isCalculator ? 'Как получить проверяемый расчёт' : 'Как выбрать и безопасно применить утилиту'}</h2><p className="mt-1 text-xs leading-relaxed text-bx-muted">Что нажать, зачем это нужно и где искать результат. Настройка сохраняется только на этом устройстве.</p></div>
        </div>
        <div className="flex flex-shrink-0 items-center justify-between gap-3 rounded-xl border border-bx-border bg-bx-surface px-3 py-2">
          <span className="text-xs font-black text-bx-text">Показывать обучение</span>
          <button type="button" onClick={onToggle} role="switch" aria-checked={enabled} aria-label={`Показывать обучение: ${isCalculator ? 'калькуляторы' : 'утилиты'}`} className={`relative h-7 w-12 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${enabled ? 'border-violet-600 bg-violet-600' : 'border-bx-border-2 bg-bx-bg'}`}><span aria-hidden="true" className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : ''}`} /></button>
        </div>
      </div>
      {enabled && <ol className="grid gap-px border-t border-bx-border bg-bx-border sm:grid-cols-2 xl:grid-cols-4">{steps.map(([icon, title, description], index) => <li key={title} className="bg-bx-surface p-4"><div className="flex items-center justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300"><Icon name={icon} className="h-4 w-4" /></span><span className="text-[10px] font-black text-violet-600/75 dark:text-violet-300/75">ШАГ {index + 1}</span></div><h3 className="mt-3 text-sm font-black text-bx-text">{title}</h3><p className="mt-1.5 text-xs leading-relaxed text-bx-muted">{description}</p></li>)}</ol>}
    </section>
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
      className={`${fullHeight ? 'h-full overflow-hidden p-4' : 'p-4 sm:p-5'} rounded-2xl border border-bx-border bg-bx-surface [&_button]:cursor-pointer [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-violet-500/40 [&_input]:min-h-11 [&_select]:min-h-11 [&_textarea]:leading-relaxed`}
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

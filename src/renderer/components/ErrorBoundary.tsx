import React from 'react'
import { logger } from '../lib/logger'
import { reportError } from '../lib/errorReporter'

// Глобальная граница ошибок на корне приложения: любой неперехваченный сбой
// рендера показывает экран восстановления вместо белого экрана.
// Для локальных сбоев (виджеты дашборда) используется WidgetBoundary.
interface Props { children: React.ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('app', 'Неперехваченная ошибка рендера', { message: error.message, stack: error.stack, componentStack: info.componentStack })
    reportError(error.message, `${error.stack ?? ''}\n--- component stack ---${info.componentStack ?? ''}`)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 p-6 text-center bg-bx-bg">
        <span className="text-4xl opacity-70">⚠️</span>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-bx-text">Что-то пошло не так</h1>
          <p className="text-sm text-bx-muted max-w-md">
            Произошла непредвиденная ошибка. Данные в облаке в безопасности — попробуйте перезагрузить приложение.
          </p>
        </div>
        <p className="text-[11px] text-bx-muted font-mono max-w-md break-words opacity-70">{this.state.error.message}</p>
        <button
          onClick={this.handleReload}
          className="mt-2 px-5 py-2.5 rounded-xl bg-bx-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Перезагрузить
        </button>
      </div>
    )
  }
}

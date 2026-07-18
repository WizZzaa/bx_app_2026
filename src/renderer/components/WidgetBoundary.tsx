import React from 'react'
import { trackWidgetEvent } from '../lib/adminWidgetPolicy'

// Локальная граница ошибок для виджетов дашборда: сбой в одном виджете
// не должен гасить весь экран (в приложении общего ErrorBoundary нет).
interface Props { name?: string; widgetId?: string; children: React.ReactNode }
interface State { error: Error | null }

export default class WidgetBoundary extends React.Component<Props, State> {
  state: State = { error: null }
  private readonly startedAt = performance.now()

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error(`[widget${this.props.name ? ':' + this.props.name : ''}]`, error)
    if (this.props.widgetId) void trackWidgetEvent(this.props.widgetId, 'load_error', performance.now() - this.startedAt)
  }

  componentDidMount() {
    if (!this.state.error && this.props.widgetId) {
      void trackWidgetEvent(this.props.widgetId, 'load_success', performance.now() - this.startedAt)
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl min-h-[300px] h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-bx-surface border border-bx-border">
          <span className="text-2xl opacity-60">⚠️</span>
          <p className="text-xs text-bx-muted">Виджет{this.props.name ? ` «${this.props.name}»` : ''} не загрузился</p>
          <p className="text-[10px] text-bx-muted font-mono truncate max-w-full">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

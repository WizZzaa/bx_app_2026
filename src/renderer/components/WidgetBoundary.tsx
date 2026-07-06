import React from 'react'

// Локальная граница ошибок для виджетов дашборда: сбой в одном виджете
// не должен гасить весь экран (в приложении общего ErrorBoundary нет).
interface Props { name?: string; children: React.ReactNode }
interface State { error: Error | null }

export default class WidgetBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error(`[widget${this.props.name ? ':' + this.props.name : ''}]`, error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl min-h-[300px] h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-bx-surface border border-bx-border">
          <span className="text-2xl opacity-60">⚠️</span>
          <p className="text-xs text-slate-400">Виджет{this.props.name ? ` «${this.props.name}»` : ''} не загрузился</p>
          <p className="text-[10px] text-slate-600 font-mono truncate max-w-full">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

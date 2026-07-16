import React, { useState } from 'react'
import Icon from '../../lib/ui/Icon'

export type DocumentViewMode = 'simple' | 'detailed'

const DOCUMENT_VIEW_MODE_KEY = 'bx_document_workspace_view_mode'

export function useDocumentViewMode() {
  const [viewMode, setViewMode] = useState<DocumentViewMode>(() => localStorage.getItem(DOCUMENT_VIEW_MODE_KEY) === 'detailed' ? 'detailed' : 'simple')

  const changeViewMode = (next: DocumentViewMode) => {
    setViewMode(next)
    localStorage.setItem(DOCUMENT_VIEW_MODE_KEY, next)
  }

  return [viewMode, changeViewMode] as const
}

interface DocumentViewModeSwitchProps {
  current: 'documents' | 'templates'
  value: DocumentViewMode
  onChange: (value: DocumentViewMode) => void
  actions?: React.ReactNode
  compact?: boolean
}

export function DocumentViewModeSwitch({ current, value, onChange, actions, compact = false }: DocumentViewModeSwitchProps) {
  const simple = value === 'simple'
  const isDocuments = current === 'documents'

  if (!simple || compact) {
    return <section className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-2xl border border-bx-border bg-bx-surface px-4 py-2.5 shadow-sm" aria-label="Вид страницы">
      <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name={isDocuments ? 'note' : 'templates'} className="h-4 w-4" /></span><div><p className="text-[10px] font-black text-bx-text">Вид страницы</p><p className="mt-0.5 text-[9px] text-bx-muted">{simple ? 'Только рабочие элементы' : 'Все пояснения и подсказки'}</p></div></div>
      <ModeButtons value={value} onChange={onChange} />
    </section>
  }

  return <header className="flex flex-col gap-4 rounded-[22px] border border-bx-border bg-bx-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name={isDocuments ? 'note' : 'templates'} className="h-5 w-5" /></span>
      <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">{isDocuments ? 'Архив компании' : 'Библиотека бланков'}</p><h1 className="mt-1 text-lg font-black text-bx-text">{isDocuments ? 'Документы без лишних блоков' : 'Шаблоны без лишних пояснений'}</h1><p className="mt-1 text-[11px] text-bx-muted">{isDocuments ? 'Поиск, фильтры, загрузка и файлы — сразу перед глазами.' : 'Категории, поиск и выбор бланка — сразу перед глазами.'}</p></div>
    </div>
    <div className="flex flex-col gap-2 sm:items-end"><ModeButtons value={value} onChange={onChange} />{actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}</div>
  </header>
}

function ModeButtons({ value, onChange }: { value: DocumentViewMode; onChange: (value: DocumentViewMode) => void }) {
  return <div className="grid grid-cols-2 rounded-xl border border-bx-border bg-bx-bg p-1" role="group" aria-label="Плотность страницы">
    <ModeButton label="Простой" icon="file" active={value === 'simple'} onClick={() => onChange('simple')} />
    <ModeButton label="Подробный" icon="info" active={value === 'detailed'} onClick={() => onChange('detailed')} />
  </div>
}

function ModeButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-[10px] font-black outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}><Icon name={icon} className="h-3.5 w-3.5" />{label}</button>
}

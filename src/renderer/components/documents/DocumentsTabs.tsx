import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../lib/ui/Icon'

export default function DocumentsTabs({ current }: { current: 'templates' | 'documents' }) {
  const navigate = useNavigate()
  return <nav className="grid grid-cols-2 rounded-2xl border border-bx-border bg-bx-surface p-1 shadow-sm" aria-label="Раздел Документы">
    <button type="button" aria-current={current === 'templates' ? 'page' : undefined} onClick={() => navigate('/documents/templates')} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black ${current === 'templates' ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:bg-bx-bg hover:text-bx-text'}`}><Icon name="templates" className="h-4 w-4" />Шаблоны</button>
    <button type="button" aria-current={current === 'documents' ? 'page' : undefined} onClick={() => navigate('/documents/my')} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black ${current === 'documents' ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:bg-bx-bg hover:text-bx-text'}`}><Icon name="note" className="h-4 w-4" />Мои документы</button>
  </nav>
}

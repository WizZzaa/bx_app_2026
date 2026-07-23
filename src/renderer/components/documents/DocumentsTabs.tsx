import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../lib/ui/Icon'

export default function DocumentsTabs({ current, stage = current === 'documents' ? 3 : 1 }: { current: 'templates' | 'documents'; stage?: 1 | 2 | 3 }) {
  const navigate = useNavigate()
  const steps = [
    { number: 1, title: 'Выбрать основу', text: 'Шаблон или свой файл', icon: 'templates' },
    { number: 2, title: 'Заполнить и проверить', text: 'Реквизиты и предпросмотр', icon: 'check' },
    { number: 3, title: 'Сохранить', text: 'Архив по организации', icon: 'folder' },
  ]
  return <section className="bx-documents-tabs overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface shadow-sm" aria-label="Рабочий процесс документов">
    <div className="bx-documents-tabs__top flex flex-col gap-4 border-b border-bx-border p-4 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-xs font-black text-bx-text">Документы</p><p className="mt-1 text-sm text-bx-muted">Выберите основу, проверьте содержание и сохраните готовый файл.</p></div>
      <nav className="bx-documents-tabs__switch grid min-w-[min(100%,22rem)] grid-cols-2 rounded-xl border border-bx-border bg-bx-bg p-1" aria-label="Раздел Документы">
        <button type="button" aria-current={current === 'templates' ? 'page' : undefined} onClick={() => navigate('/documents/templates')} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black ${current === 'templates' ? 'bx-documents-tabs__current text-white shadow-sm' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}><Icon name="templates" className="h-4 w-4" />Шаблоны</button>
        <button type="button" aria-current={current === 'documents' ? 'page' : undefined} onClick={() => navigate('/documents/my')} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black ${current === 'documents' ? 'bx-documents-tabs__current text-white shadow-sm' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}><Icon name="note" className="h-4 w-4" />Мои документы</button>
      </nav>
    </div>
    <ol className="bx-documents-tabs__steps grid gap-px bg-bx-border sm:grid-cols-3">
      {steps.map(step => <li key={step.number} className={`flex items-center gap-3 bg-bx-surface px-4 py-3 ${stage === step.number ? 'bx-documents-tabs__active' : stage > step.number ? 'text-emerald-700 dark:text-emerald-300' : 'text-bx-muted'}`} aria-current={stage === step.number ? 'step' : undefined}>
        <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${stage === step.number ? 'bx-documents-tabs__current text-white' : stage > step.number ? 'bg-emerald-500/10' : 'bg-bx-surface-2'}`}><Icon name={stage > step.number ? 'check' : step.icon} className="h-4 w-4" /></span>
        <span><strong className="block text-xs font-black">{step.number}. {step.title}</strong><span className="mt-0.5 block text-xs text-bx-muted">{step.text}</span></span>
      </li>)}
    </ol>
  </section>
}

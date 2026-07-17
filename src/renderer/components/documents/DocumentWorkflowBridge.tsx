import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../lib/ui/Icon'

type DocumentWorkspace = 'templates' | 'documents'

const STEPS = [
  { id: 'templates', number: '01', title: 'Выбрать основу', description: 'Найти готовый бланк или создать свой шаблон.' },
  { id: 'prepare', number: '02', title: 'Заполнить и проверить', description: 'Подставить реквизиты, проверить условия и выгрузку.' },
  { id: 'documents', number: '03', title: 'Сохранить в архив', description: 'Хранить готовый файл с компанией, типом и тегами.' },
] as const

export default function DocumentWorkflowBridge({ current }: { current: DocumentWorkspace }) {
  const navigate = useNavigate()
  const isTemplates = current === 'templates'

  return (
    <section className="overflow-hidden rounded-[22px] border border-blue-500/20 bg-gradient-to-r from-blue-500/[0.075] via-bx-surface to-violet-500/[0.055] shadow-sm" aria-labelledby={`document-workflow-${current}`}>
      <div className="flex flex-col gap-4 p-4.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 xl:max-w-[330px]">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20"><Icon name={isTemplates ? 'templates' : 'note'} className="h-4 w-4" /></span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Единый контур документов</p>
              <h2 id={`document-workflow-${current}`} className="mt-0.5 text-sm font-black text-bx-text">Шаблоны и Документы работают вместе</h2>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-bx-muted">Шаблон отвечает за подготовку содержимого, а раздел «Документы» — за хранение и быстрый поиск готового файла.</p>
        </div>

        <ol className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3" aria-label="Путь документа">
          {STEPS.map(step => {
            const active = step.id === current || (step.id === 'prepare' && isTemplates)
            return <li key={step.id} className={`relative rounded-2xl border p-3 ${active ? 'border-blue-500/35 bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'border-bx-border bg-bx-surface/80 text-bx-text'}`}>
              <div className="flex items-center justify-between gap-2"><span className={`text-[9px] font-black uppercase tracking-[0.12em] ${active ? 'text-blue-100' : 'text-bx-muted'}`}>Шаг {step.number}</span>{active && <Icon name="check" className="h-3.5 w-3.5" />}</div>
              <p className="mt-1 text-[11px] font-black">{step.title}</p>
              <p className={`mt-1 text-[9px] leading-relaxed ${active ? 'text-blue-50/85' : 'text-bx-muted'}`}>{step.description}</p>
            </li>
          })}
        </ol>

        <button type="button" onClick={() => navigate(isTemplates ? '/documents' : '/templates')} className="inline-flex min-h-11 flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-500/25 bg-bx-surface px-4 text-[10px] font-black text-blue-600 shadow-sm outline-none transition-colors hover:bg-blue-500/[0.08] focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300">
          <Icon name={isTemplates ? 'note' : 'templates'} className="h-4 w-4" />
          {isTemplates ? 'Открыть Документы' : 'Перейти к шаблонам'}
          <Icon name="arrowR" className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  )
}

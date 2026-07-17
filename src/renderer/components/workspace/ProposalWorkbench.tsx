import React, { useState } from 'react'
import Icon from '../../lib/ui/Icon'
import type { WorkbenchProposal } from '../../data/workbenchCatalog'

interface ProposalWorkbenchProps {
  proposal: WorkbenchProposal
}

export function ProposalWorkbench({ proposal }: ProposalWorkbenchProps) {
  const [copied, setCopied] = useState(false)
  const brief = [
    proposal.title,
    proposal.summary,
    `Входные данные: ${proposal.inputs.join('; ')}.`,
    `Результат: ${proposal.outputs.join('; ')}.`,
    `Ценность: ${proposal.value}`,
  ].join('\n')

  const copyBrief = async () => {
    await navigator.clipboard.writeText(brief)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-4 flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
          <Icon name="note" className="w-5 h-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-bx-text">Концепция — расчёты ещё не включены</p>
          <p className="text-xs text-bx-muted mt-1 leading-relaxed">
            Сначала согласуем поля, документы и правила. Ставки и юридически значимые формулы появятся только после проверки по официальным источникам.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-bx-border bg-bx-bg p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">Что загружаем</p>
          <ul className="mt-3 space-y-2">
            {proposal.inputs.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-bx-text">
                <Icon name="check" className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-bx-border bg-bx-bg p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">Что получаем</p>
          <ul className="mt-3 space-y-2">
            {proposal.outputs.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-bx-text">
                <Icon name="arrowR" className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="rounded-2xl border border-bx-border bg-bx-surface-2/60 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-bx-muted">Зачем это специалисту</p>
        <p className="text-sm text-bx-text leading-relaxed mt-2">{proposal.value}</p>
      </div>

      <button
        type="button"
        onClick={copyBrief}
        className="min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-bx-surface"
      >
        <Icon name={copied ? 'check' : 'copy'} className="w-4 h-4" />
        {copied ? 'Описание скопировано' : 'Скопировать концепцию для обсуждения'}
      </button>
    </div>
  )
}

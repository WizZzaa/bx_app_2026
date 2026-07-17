import React from 'react'
import Icon from '../lib/ui/Icon'

export type TranslatorWorkspaceMode = 'simple' | 'professional'

interface TranslatorWorkspaceSwitchProps {
  value: TranslatorWorkspaceMode
  onChange: (value: TranslatorWorkspaceMode) => void
}

export function TranslatorWorkspaceSwitch({ value, onChange }: TranslatorWorkspaceSwitchProps) {
  const simple = value === 'simple'

  return <section className="flex flex-col gap-4 rounded-[22px] border border-bx-border bg-bx-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5" aria-labelledby="translator-workspace-title">
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name="languages" className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Переводчик документов</p>
        <h1 id="translator-workspace-title" className="mt-1 text-lg font-black text-bx-text">{simple ? 'Быстрый перевод без лишних панелей' : 'Полный профессиональный рабочий стол'}</h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-bx-muted">{simple ? 'Языки, документ, результат и основные действия остаются перед глазами. Остальные инструменты аккуратно свёрнуты.' : 'Обучение, режимы, глоссарий, контроль качества и история показаны одновременно.'}</p>
      </div>
    </div>
    <div className="grid flex-shrink-0 grid-cols-2 rounded-2xl border border-bx-border bg-bx-bg p-1" role="group" aria-label="Вид переводчика">
      <WorkspaceModeButton active={simple} icon="languages" label="Простой" onClick={() => onChange('simple')} />
      <WorkspaceModeButton active={!simple} icon="settings" label="Профессиональный" onClick={() => onChange('professional')} />
    </div>
  </section>
}

function WorkspaceModeButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-4 ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'text-bx-muted hover:bg-bx-surface hover:text-bx-text'}`}><Icon name={icon} className="h-4 w-4" />{label}</button>
}

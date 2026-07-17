import React from 'react'
import Icon from '../lib/ui/Icon'

export function TranslatorTutorial({ enabled, literalActive, onToggle, onChooseLiteral }: { enabled: boolean; literalActive: boolean; onToggle: () => void; onChooseLiteral: () => void }) {
  return <section className="overflow-hidden rounded-[22px] border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] via-bx-surface to-violet-500/[0.06] shadow-sm" aria-labelledby="translator-tutorial-title">
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20"><Icon name="info" className="h-4 w-4" /></span>
        <div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Мини-обучение</p><h2 id="translator-tutorial-title" className="mt-1 text-sm font-black text-bx-text">Как получить нужный перевод с первого раза</h2><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">Четыре коротких шага. Подсказку можно скрыть — выбор сохранится на этом устройстве.</p></div>
      </div>
      <div className="flex flex-shrink-0 items-center justify-between gap-3 rounded-xl border border-bx-border bg-bx-surface/80 px-3 py-2 sm:justify-start">
        <span className="text-[10px] font-black text-bx-text">Показывать обучение</span>
        <button type="button" onClick={onToggle} role="switch" aria-checked={enabled} aria-label="Показывать обучение переводчика" className={`relative h-7 w-12 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${enabled ? 'border-blue-600 bg-blue-600' : 'border-bx-border-2 bg-bx-bg'}`}>
          <span aria-hidden="true" className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
    {enabled && <ol className="grid gap-px border-t border-bx-border bg-bx-border sm:grid-cols-2 xl:grid-cols-4">
      <TutorialStep number="1" title="Выберите языки" description="Слева — язык исходника, справа — язык готового текста. Стрелка меняет их местами." icon="exchange" />
      <TutorialStep number="2" title="Выберите точность" description="Для обычного перевода нажмите «Дословный перевод». Для договоров и отчётов есть специальные режимы." icon="languages" action={<button type="button" onClick={onChooseLiteral} aria-pressed={literalActive} className={`mt-3 min-h-9 rounded-lg border px-3 text-[10px] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${literalActive ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-500/25 bg-blue-500/[0.08] text-blue-700 hover:bg-blue-500/[0.13] dark:text-blue-200'}`}>{literalActive ? 'Дословный режим выбран' : 'Включить дословный перевод'}</button>} />
      <TutorialStep number="3" title="Добавьте текст" description="Вставьте текст вручную или загрузите PDF, DOCX, таблицу и другие поддерживаемые файлы." icon="download" />
      <TutorialStep number="4" title="Проверьте и сохраните" description="Сверьте числа и термины, отредактируйте результат, затем скачайте его или добавьте в Документы." icon="check" />
    </ol>}
  </section>
}

function TutorialStep({ number, title, description, icon, action }: { number: string; title: string; description: string; icon: string; action?: React.ReactNode }) {
  return <li className="bg-bx-surface p-4"><div className="flex items-center justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name={icon} className="h-4 w-4" /></span><span className="text-[10px] font-black text-blue-600/70 dark:text-blue-300/70">ШАГ {number}</span></div><h3 className="mt-3 text-xs font-black text-bx-text">{title}</h3><p className="mt-1.5 text-[10px] leading-relaxed text-bx-muted">{description}</p>{action}</li>
}

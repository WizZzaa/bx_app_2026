import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNewsItem, LEGISLATION_NEWS, type NewsItem } from '../data/newsItems'
import Icon from '../lib/ui/Icon'

function openExternal(url: string) {
  if (window.bx?.shell?.openExternal) window.bx.shell.openExternal(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

export default function NewsDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = getNewsItem(id)

  if (!item) return <NotFound onBack={() => navigate('/news')} />

  const currentIndex = LEGISLATION_NEWS.findIndex(candidate => candidate.id === item.id)
  const nextItem = LEGISLATION_NEWS[(currentIndex + 1) % LEGISLATION_NEWS.length]
  const askAi = () => navigate('/ai', { state: { prompt: buildAiPrompt(item) } })
  const createTask = () => navigate('/planner', { state: { newTask: { title: `Проверить изменение: ${item.title}`, note: buildTaskNote(item) } } })

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto bg-bx-bg px-4 py-4 text-bx-text sm:px-6 sm:py-6">
      <div className="bx-reading-container space-y-4">
        <nav aria-label="Хлебные крошки" className="flex min-w-0 items-center gap-2 text-xs font-bold text-bx-muted"><button type="button" onClick={() => navigate('/news')} className="inline-flex min-h-11 flex-shrink-0 items-center gap-2 rounded-xl px-3 hover:bg-bx-surface hover:text-bx-text"><Icon name="arrowR" className="h-4 w-4 rotate-180" />Все новости</button><span aria-hidden="true">/</span><span className="truncate text-bx-text">{item.tag}</span></nav>

        <header className="relative overflow-hidden rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.10] via-bx-surface to-bx-surface p-6 sm:p-8">
          <div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">{item.tag}</span><span className="text-xs font-semibold text-bx-muted">{formatDate(item.date)}</span><span className="text-xs font-semibold text-bx-muted">{item.points.length + item.actions.length + 2} блоков · около 4 минут</span></div><h1 className="mt-5 text-2xl font-black leading-tight tracking-tight sm:text-4xl">{item.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-bx-muted">{item.summary}</p></div>
        </header>

        <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="space-y-4" aria-label="Разбор изменения">
            <section className="rounded-[24px] border border-violet-500/20 bg-violet-500/[0.06] p-5 sm:p-6"><p className="text-xs font-black text-violet-700 dark:text-violet-300">Коротко</p><h2 className="mt-1 text-xl font-black">Что нужно понять до чтения деталей</h2><p className="mt-3 text-sm leading-7">{item.impact}</p></section>

            <ContentSection number="01" title="Что изменилось" description="Факты из материала, без выводов за вашу компанию."><div className="mt-5 space-y-3">{item.points.map((point, index) => <div key={point} className="flex items-start gap-3 rounded-2xl border border-bx-border bg-bx-bg p-4"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-violet-500/10 text-xs font-black text-violet-700 dark:text-violet-300">{index + 1}</span><p className="text-sm font-semibold leading-6">{point}</p></div>)}</div></ContentSection>

            <ContentSection number="02" title="Почему это важно" description="Практический риск и влияние на рабочий процесс."><p className="mt-5 rounded-2xl bg-bx-bg p-5 text-sm font-semibold leading-7">{item.impact}</p></ContentSection>

            <ContentSection number="03" title="Что проверить" description="Готовый чек-лист перед применением нормы."><div className="mt-5 grid gap-3 sm:grid-cols-2">{item.actions.map(action => <div key={action} className="flex items-start gap-3 rounded-2xl border border-bx-border bg-bx-bg p-4"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300"><Icon name="check" className="h-4 w-4" /></span><p className="text-sm font-semibold leading-6">{action}</p></div>)}</div></ContentSection>

            <section className="flex items-start gap-3 rounded-[22px] border border-amber-500/25 bg-amber-500/[0.08] p-5"><Icon name="alert" className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-300" /><div><h2 className="text-sm font-black">Перед применением</h2><p className="mt-1.5 text-sm leading-6 text-bx-muted">{item.caution}</p></div></section>
          </article>

          <aside className="space-y-4 xl:sticky xl:top-4" aria-label="Действия с материалом">
            <section className="rounded-[24px] border border-bx-border bg-bx-surface p-5"><p className="text-xs font-black text-violet-700 dark:text-violet-300">Следующий шаг</p><h2 className="mt-1 text-lg font-black">Не оставляйте изменение просто прочитанным</h2><p className="mt-2 text-xs leading-5 text-bx-muted">Сначала проверьте источник, затем выберите одно рабочее действие.</p><div className="mt-4 space-y-2"><ActionButton icon="external" label="Открыть источник" description={item.source} primary onClick={() => openExternal(item.url)} /><ActionButton icon="ai" label="Разобрать с AI" description="Проверить применимость и риски" onClick={askAi} /><ActionButton icon="planner" label="Поставить в план" description="Создать задачу с контекстом" onClick={createTask} /></div></section>
            <section className="rounded-[24px] border border-bx-border bg-bx-surface p-5"><p className="text-xs font-black text-bx-muted">Следующий материал</p><h2 className="mt-2 text-base font-black leading-6">{nextItem.title}</h2><p className="mt-2 text-xs text-bx-muted">{nextItem.tag} · {formatDate(nextItem.date)}</p><button type="button" onClick={() => navigate(`/news/${nextItem.id}`)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-bx-border bg-bx-bg text-xs font-black hover:border-violet-500/30">Читать дальше<Icon name="arrowR" className="h-4 w-4 text-violet-600" /></button></section>
          </aside>
        </section>
      </div>
    </div>
  )
}

export function buildAiPrompt(item: NewsItem) { return `Проверь и объясни материал «${item.title}». Определи применимость для компании, риски и конкретные действия.\n\nСуть:\n${item.points.map(point => `- ${point}`).join('\n')}\n\nПрактический контекст: ${item.impact}\nИсточник: ${item.source} — ${item.url}` }
export function buildTaskNote(item: NewsItem) { return `Внутренний материал BX: ${item.title}\nИсточник: ${item.source}\nСсылка: ${item.url}\n\nЧто проверить:\n${item.actions.map((action, index) => `${index + 1}. ${action}`).join('\n')}\n\nВажно: ${item.caution}` }
function formatDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) }

function ContentSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-[24px] border border-bx-border bg-bx-surface p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-violet-500/10 text-xs font-black text-violet-700 dark:text-violet-300">{number}</span><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-xs leading-5 text-bx-muted">{description}</p></div></div>{children}</section>
}

function ActionButton({ icon, label, description, primary = false, onClick }: { icon: string; label: string; description: string; primary?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${primary ? 'border-violet-600 bg-violet-600 text-white hover:bg-violet-700' : 'border-bx-border bg-bx-bg text-bx-text hover:border-violet-500/30'}`}><Icon name={icon} className="h-4 w-4 flex-shrink-0" /><span className="min-w-0"><span className="block text-sm font-black">{label}</span><span className={`mt-0.5 block text-xs ${primary ? 'text-white/80' : 'text-bx-muted'}`}>{description}</span></span></button>
}

function NotFound({ onBack }: { onBack: () => void }) {
  return <div className="grid flex-1 place-items-center bg-bx-bg p-6"><div className="max-w-md rounded-[28px] border border-bx-border bg-bx-surface p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-700"><Icon name="news" className="h-6 w-6" /></span><h1 className="mt-4 text-xl font-black">Материал не найден</h1><p className="mt-2 text-sm leading-6 text-bx-muted">Возможно, ссылка устарела или материал был обновлён.</p><button type="button" onClick={onBack} className="mt-5 min-h-11 rounded-xl bg-violet-600 px-5 text-sm font-black text-white">Вернуться к новостям</button></div></div>
}

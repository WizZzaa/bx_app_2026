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
    <main className="custom-scrollbar flex-1 overflow-y-auto bg-bx-bg px-5 py-5 text-bx-text sm:px-6">
      <div className="bx-reading-container space-y-4">
        <nav aria-label="Хлебные крошки" className="flex items-center gap-2 text-[10px] font-bold text-bx-muted"><button onClick={() => navigate('/news')} className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 hover:bg-bx-surface hover:text-bx-text"><Icon name="arrowR" className="h-3.5 w-3.5 rotate-180" />Новости</button><span>/</span><span className="truncate text-bx-text">{item.title}</span></nav>

        <header className="relative overflow-hidden rounded-[28px] border border-bx-border bg-bx-surface p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.09] blur-3xl" />
          <div className="relative max-w-4xl"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-lg border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.13em] ${item.tagColor}`}>{item.tag}</span><span className="text-[10px] font-semibold text-bx-muted">{formatDate(item.date)}</span><span className="text-[10px] font-semibold text-bx-muted">Источник: {item.source}</span></div><h1 className="mt-5 text-2xl font-black leading-tight tracking-tight text-bx-text sm:text-4xl">{item.title}</h1><p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-bx-muted">{item.summary}</p></div>
        </header>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="space-y-4" aria-label="Материал новости">
            <section className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm sm:p-6"><SectionTitle number="01" title="Что изменилось" /><div className="mt-5 space-y-3">{item.points.map((point, index) => <div key={point} className="flex items-start gap-3 rounded-2xl border border-bx-border/70 bg-bx-bg p-4"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-blue-500/10 text-[10px] font-black text-blue-600 dark:text-blue-300">{index + 1}</span><p className="text-sm font-medium leading-6 text-bx-text">{point}</p></div>)}</div></section>
            <section className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm sm:p-6"><SectionTitle number="02" title="Почему это важно" /><p className="mt-5 rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-5 text-sm font-medium leading-7 text-bx-text">{item.impact}</p></section>
            <section className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm sm:p-6"><SectionTitle number="03" title="Что проверить бухгалтеру" /><div className="mt-5 grid gap-3 sm:grid-cols-2">{item.actions.map(action => <div key={action} className="flex items-start gap-3 rounded-2xl border border-bx-border/70 bg-bx-bg p-4"><span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><Icon name="check" className="h-3.5 w-3.5" /></span><p className="text-xs font-semibold leading-5 text-bx-text">{action}</p></div>)}</div></section>
            <section className="flex items-start gap-3 rounded-[22px] border border-amber-500/20 bg-amber-500/[0.07] p-5"><Icon name="alert" className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" /><div><h2 className="text-xs font-black text-amber-900 dark:text-amber-100">Перед применением</h2><p className="mt-1.5 text-xs font-medium leading-5 text-amber-900/80 dark:text-amber-100/75">{item.caution}</p></div></section>
          </article>

          <aside className="space-y-4 xl:sticky xl:top-4" aria-label="Действия с материалом">
            <section className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-300">Следующий шаг</p><h2 className="mt-1 text-base font-black text-bx-text">Превратить информацию в действие</h2><div className="mt-4 space-y-2"><ActionButton icon="ai" label="Разобрать с AI" description="Проверить применимость и риски" tone="violet" onClick={askAi} /><ActionButton icon="planner" label="Поставить в план" description="Создать задачу с контекстом" tone="blue" onClick={createTask} /><ActionButton icon="arrowR" label="Открыть источник" description={item.source} tone="neutral" onClick={() => openExternal(item.url)} /></div></section>
            <section className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-bx-muted">Следующий материал</p><h2 className="mt-2 text-sm font-black leading-5 text-bx-text">{nextItem.title}</h2><p className="mt-2 text-[10px] font-medium text-bx-muted">{nextItem.tag} · {formatDate(nextItem.date)}</p><button onClick={() => navigate(`/news/${nextItem.id}`)} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-bx-border bg-bx-bg text-[10px] font-extrabold text-bx-text hover:border-blue-500/30">Читать дальше <Icon name="arrowR" className="h-3.5 w-3.5" /></button></section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export function buildAiPrompt(item: NewsItem) { return `Проверь и объясни материал «${item.title}». Определи применимость для компании, риски и конкретные действия.\n\nСуть:\n${item.points.map(point => `- ${point}`).join('\n')}\n\nПрактический контекст: ${item.impact}\nИсточник: ${item.source} — ${item.url}` }
export function buildTaskNote(item: NewsItem) { return `Внутренний материал BX: ${item.title}\nИсточник: ${item.source}\nСсылка: ${item.url}\n\nЧто проверить:\n${item.actions.map((action, index) => `${index + 1}. ${action}`).join('\n')}\n\nВажно: ${item.caution}` }
function formatDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) }
function SectionTitle({ number, title }: { number: string; title: string }) { return <div className="flex items-center gap-3"><span className="text-[10px] font-black tabular-nums text-blue-600 dark:text-blue-300">{number}</span><h2 className="text-lg font-black text-bx-text">{title}</h2><span className="h-px flex-1 bg-bx-border" /></div> }
function ActionButton({ icon, label, description, tone, onClick }: { icon: string; label: string; description: string; tone: 'blue' | 'violet' | 'neutral'; onClick: () => void }) { const styles = tone === 'blue' ? 'border-blue-500/20 bg-blue-500/[0.07] text-blue-700 dark:text-blue-300' : tone === 'violet' ? 'border-violet-500/20 bg-violet-500/[0.07] text-violet-700 dark:text-violet-300' : 'border-bx-border bg-bx-bg text-bx-text'; return <button onClick={onClick} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-blue-500/35 ${styles}`}><Icon name={icon} className="h-4 w-4 flex-shrink-0" /><span className="min-w-0"><span className="block text-xs font-black">{label}</span><span className="mt-0.5 block truncate text-[9px] font-medium opacity-75">{description}</span></span></button> }
function NotFound({ onBack }: { onBack: () => void }) { return <main className="grid flex-1 place-items-center bg-bx-bg p-6"><div className="max-w-md rounded-[28px] border border-bx-border bg-bx-surface p-8 text-center shadow-sm"><Icon name="news" className="mx-auto h-8 w-8 text-bx-muted" /><h1 className="mt-4 text-xl font-black text-bx-text">Материал не найден</h1><p className="mt-2 text-xs leading-5 text-bx-muted">Возможно, ссылка устарела или материал был обновлён.</p><button onClick={onBack} className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white">Вернуться к новостям</button></div></main> }

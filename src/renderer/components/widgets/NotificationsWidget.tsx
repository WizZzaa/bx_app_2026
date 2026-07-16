import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../lib/ui/Icon'
import { loadEcpKeys } from '../../lib/ecpStorage'
import { buildNotices, type EcpKeyLite, type NoticeLevel } from '../../lib/notices'

const styleByLevel: Record<NoticeLevel, { dot: string; chip: string; label: string }> = {
  critical: { dot: 'bg-rose-500', chip: 'bg-rose-500/10 text-rose-600 dark:text-rose-300', label: 'Важно' },
  warning: { dot: 'bg-amber-500', chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'Срок' },
  info: { dot: 'bg-blue-500', chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-300', label: 'Инфо' },
}

export default function NotificationsWidget() {
  const navigate = useNavigate()
  const [ecpKeys, setEcpKeys] = useState<EcpKeyLite[]>([])
  useEffect(() => { loadEcpKeys().then(setEcpKeys) }, [])
  const notices = useMemo(() => buildNotices(ecpKeys), [ecpKeys])

  return (
    <section className="flex h-full min-h-[280px] flex-col rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm" aria-label="Оповещения">
      <header className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300"><Icon name="bell" className="h-4 w-4" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-300">Контроль</p><h2 className="text-sm font-black text-bx-text">Оповещения</h2></div><span className="ml-auto rounded-full bg-bx-bg px-2.5 py-1 text-[9px] font-bold text-bx-muted">{notices.length || 'нет новых'}</span></header>
      {notices.length === 0 ? (
        <div className="my-auto rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-6 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><Icon name="check" className="h-5 w-5" /></span><p className="mt-3 text-sm font-black text-bx-text">Всё спокойно</p><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">Просрочек и горящих сроков нет</p></div>
      ) : (
        <div className="mt-4 space-y-2">
          {notices.slice(0, 3).map(notice => { const style = styleByLevel[notice.level]; return <button key={notice.id} onClick={() => navigate(notice.to)} className="flex w-full items-start gap-2.5 rounded-xl border border-bx-border/60 bg-bx-bg p-3 text-left transition-colors hover:border-blue-500/30"><span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${style.dot}`} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-bx-text">{notice.text}</p><div className="mt-1.5 flex gap-2"><span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${style.chip}`}>{style.label}</span><span className="text-[9px] text-bx-muted">{notice.time}</span></div></div><Icon name="arrowR" className="h-3.5 w-3.5 text-bx-muted" /></button> })}
        </div>
      )}
    </section>
  )
}

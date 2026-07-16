import React, { useEffect, useRef, useState } from 'react'
import { useTickets, type BxTicket } from './support/useTickets'
import { usePlan } from '../lib/plan'
import PaywallModal from '../components/PaywallModal'
import { useToast } from '../lib/ui/ToastContext'
import { useCompany } from '../lib/CompanyContext'
import Icon from '../lib/ui/Icon'
import {
  ResourceEmpty,
  ResourceHero,
  ResourceLayout,
  ResourceNavItem,
  ResourceSidebar,
  primaryActionClass,
  secondaryActionClass,
} from '../components/workspace/ResourceWorkspace'

const STATUS: Record<BxTicket['status'], { label: string; cls: string }> = {
  open: { label: 'Открыт', cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  answered: { label: 'Есть ответ', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  closed: { label: 'Закрыт', cls: 'bg-bx-surface-2 text-bx-muted' },
}

const fieldClass = 'h-11 w-full rounded-xl border border-bx-border-2 bg-bx-bg px-3.5 text-sm text-bx-text outline-none transition-colors placeholder:text-bx-muted focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15'

export default function Support() {
  const { tickets, activeId, messages, loading, openTicket, createTicket, reply, closeTicket } = useTickets()
  const { isPro } = usePlan()
  const { active: activeCompany } = useCompany()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [remoteId, setRemoteId] = useState('')
  const [replyText, setReplyText] = useState('')
  const [paywall, setPaywall] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const active = tickets.find(ticket => ticket.id === activeId) ?? null

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [messages])
  useEffect(() => {
    setContactName(localStorage.getItem('bx_support_contact_name') ?? '')
    setContactPhone(localStorage.getItem('bx_support_contact_phone') ?? '')
    setRemoteId(localStorage.getItem('bx_support_remote_id') ?? '')
  }, [])
  useEffect(() => {
    try {
      const draft = localStorage.getItem('bx_support_draft')
      if (!draft) return
      const parsed = JSON.parse(draft) as { subject?: string; body?: string }
      localStorage.removeItem('bx_support_draft')
      if (!isPro) { setPaywall(true); return }
      setSubject(parsed.subject ?? '')
      setBody(parsed.body ?? '')
      setCreating(true)
    } catch { /* повреждённый черновик не блокирует поддержку */ }
  }, [isPro])

  const startCreate = () => {
    if (!isPro) { setPaywall(true); return }
    setCreating(true)
  }
  const submitCreate = async () => {
    if (submitting) return
    if (!subject.trim() || !body.trim() || !contactName.trim() || !contactPhone.trim()) { toast.error('Заполните тему, описание и контакты'); return }
    setSubmitting(true)
    try {
      const id = await createTicket(subject.trim(), body.trim(), contactName.trim(), contactPhone.trim(), activeCompany?.name || undefined, activeCompany?.inn || undefined, remoteId.trim() || undefined)
      if (!id) { toast.error('Не удалось создать обращение — проверьте вход в аккаунт'); return }
      localStorage.setItem('bx_support_contact_name', contactName.trim())
      localStorage.setItem('bx_support_contact_phone', contactPhone.trim())
      localStorage.setItem('bx_support_remote_id', remoteId.trim())
      setCreating(false); setSubject(''); setBody('')
      toast.success('Обращение отправлено — специалист ответит здесь')
      await openTicket(id)
    } finally { setSubmitting(false) }
  }
  const submitReply = async () => {
    if (!replyText.trim() || !active || sendingReply) return
    setSendingReply(true)
    try { if (await reply(active.id, replyText.trim())) setReplyText('') }
    finally { setSendingReply(false) }
  }
  const closeActive = async () => {
    if (!active) return
    await closeTicket(active.id)
    toast.success('Обращение закрыто')
  }

  const sidebar = (
    <ResourceSidebar
      icon="headset"
      title="Поддержка"
      subtitle="ПК, 1С, E-Imzo и BX"
      label="Мои обращения"
      footer={<button type="button" onClick={startCreate} className={`${primaryActionClass} w-full`}><Icon name="plus" className="h-4 w-4" />Новое обращение</button>}
    >
      {loading && <div className="px-3 py-6 text-center text-xs text-bx-muted">Загружаем обращения…</div>}
      {!loading && tickets.length === 0 && <div className="mx-1 rounded-xl border border-dashed border-bx-border p-4 text-center text-[10px] leading-relaxed text-bx-muted">Здесь появится история общения со специалистами BX.</div>}
      {tickets.map(ticket => (
        <div key={ticket.id} className="relative">
          <ResourceNavItem icon={ticket.status === 'answered' ? 'message' : 'headset'} label={ticket.subject} active={activeId === ticket.id} onClick={() => { setCreating(false); openTicket(ticket.id) }} />
          <div className="pointer-events-none -mt-2 mb-1 ml-[52px] mr-2 flex items-center gap-1.5">
            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${STATUS[ticket.status].cls}`}>{STATUS[ticket.status].label}</span>
            <span className="text-[8px] text-bx-muted">{new Date(ticket.updated_at).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      ))}
    </ResourceSidebar>
  )

  return (
    <ResourceLayout sidebar={sidebar}>
      {creating ? (
        <div className="mx-auto max-w-5xl space-y-5">
          <ResourceHero eyebrow="Новое обращение" title="Опишите проблему один раз — продолжим диалог здесь" description="Укажите, что произошло, где возникла ошибка и как с вами связаться. Данные удалённого доступа добавляйте только при необходимости." icon="message" stats={[{ value: activeCompany?.name ?? 'Не выбрана', label: 'организация' }, { value: 'Рабочий день', label: 'обычный срок ответа' }]} />
          <section className="grid gap-5 rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm lg:grid-cols-[1fr_280px] lg:p-6">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5"><span className="text-xs font-bold text-bx-text">Ваше ФИО <span className="text-red-500">*</span></span><input value={contactName} onChange={event => setContactName(event.target.value)} autoComplete="name" placeholder="Иван Иванов" className={fieldClass} /></label>
                <label className="space-y-1.5"><span className="text-xs font-bold text-bx-text">Телефон <span className="text-red-500">*</span></span><input value={contactPhone} onChange={event => setContactPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="+998 (90) 123-45-67" className={fieldClass} /></label>
              </div>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Тема обращения <span className="text-red-500">*</span></span><input value={subject} onChange={event => setSubject(event.target.value)} placeholder="Например: ошибка при входе в E-Imzo" className={fieldClass} /></label>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Что произошло <span className="text-red-500">*</span></span><textarea value={body} onChange={event => setBody(event.target.value)} rows={8} placeholder="Опишите программу, действие, текст или код ошибки и ожидаемый результат…" className={`${fieldClass} h-auto resize-y py-3 leading-relaxed`} /></label>
              <div className="flex flex-wrap gap-2 pt-1"><button type="button" onClick={submitCreate} disabled={submitting || !subject.trim() || !body.trim() || !contactName.trim() || !contactPhone.trim()} className={primaryActionClass}><Icon name="send" className={`h-4 w-4 ${submitting ? 'animate-pulse motion-reduce:animate-none' : ''}`} />{submitting ? 'Отправляем…' : 'Отправить обращение'}</button><button type="button" onClick={() => setCreating(false)} className={secondaryActionClass}>Отмена</button></div>
            </div>
            <aside className="space-y-3">
              <div className={`rounded-2xl border p-4 ${activeCompany ? 'border-blue-500/20 bg-blue-500/[0.06]' : 'border-amber-500/20 bg-amber-500/[0.07]'}`}>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-bx-muted">Организация обращения</p>
                <p className="mt-2 text-xs font-black text-bx-text">{activeCompany?.name ?? 'Организация не выбрана'}</p>
                {activeCompany?.inn && <p className="mt-1 text-[10px] text-bx-muted">ИНН {activeCompany.inn}</p>}
                {!activeCompany && <p className="mt-2 text-[10px] leading-relaxed text-bx-muted">Выберите компанию в верхней панели, если проблема относится к её данным.</p>}
              </div>
              <label className="block rounded-2xl border border-bx-border bg-bx-bg p-4"><span className="text-xs font-bold text-bx-text">ID AnyDesk / RustDesk</span><span className="mt-1 block text-[10px] leading-relaxed text-bx-muted">Необязательно. Не передавайте пароль постоянного доступа.</span><input value={remoteId} onChange={event => setRemoteId(event.target.value)} placeholder="123 456 789" className={`${fieldClass} mt-3 font-mono tracking-wider`} /></label>
              <div className="flex gap-2"><a href="https://anydesk.com/download" target="_blank" rel="noreferrer" className={`${secondaryActionClass} flex-1 px-2`}>AnyDesk <Icon name="external" className="h-3.5 w-3.5" /></a><a href="https://rustdesk.com/download" target="_blank" rel="noreferrer" className={`${secondaryActionClass} flex-1 px-2`}>RustDesk <Icon name="external" className="h-3.5 w-3.5" /></a></div>
            </aside>
          </section>
        </div>
      ) : active ? (
        <div className="mx-auto flex min-h-[calc(100vh-130px)] max-w-5xl flex-col overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bx-border px-5 py-4">
            <div className="min-w-0"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-black ${STATUS[active.status].cls}`}>{STATUS[active.status].label}</span><span className="text-[10px] text-bx-muted">Обновлено {new Date(active.updated_at).toLocaleDateString('ru-RU')}</span></div><h2 className="mt-2 truncate text-lg font-black text-bx-text">{active.subject}</h2></div>
            {active.status !== 'closed' && <button type="button" onClick={closeActive} className={secondaryActionClass}>Закрыть обращение</button>}
          </header>
          <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-bx-bg/60 p-5 lg:p-6">
            {messages.map(message => (
              <div key={message.id} className={`max-w-[78%] ${message.author === 'user' ? 'ml-auto' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${message.author === 'user' ? 'rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md border border-bx-border bg-bx-surface text-bx-text'}`}>
                  {message.author === 'staff' && <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300"><Icon name="headset" className="h-3.5 w-3.5" />Специалист BX</p>}
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
                <p className={`mt-1 text-[9px] text-bx-muted ${message.author === 'user' ? 'text-right' : ''}`}>{new Date(message.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
          {active.status !== 'closed' && <div className="flex gap-2 border-t border-bx-border p-4"><label className="min-w-0 flex-1"><span className="sr-only">Дополнить обращение</span><input value={replyText} onChange={event => setReplyText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') submitReply() }} placeholder="Дополнить обращение…" className={fieldClass} /></label><button type="button" onClick={submitReply} disabled={sendingReply || !replyText.trim()} className={primaryActionClass}><Icon name="send" className={`h-4 w-4 ${sendingReply ? 'animate-pulse motion-reduce:animate-none' : ''}`} />{sendingReply ? 'Отправляем…' : 'Отправить'}</button></div>}
        </div>
      ) : (
        <div className="space-y-5">
          <ResourceHero eyebrow="Человек рядом, когда автоматики недостаточно" title="Поддержка без потерянных переписок" description="Создайте обращение по BX, 1С, E-Imzo или настройке рабочего компьютера. Вся история, ответы специалиста и статус решения останутся в одном месте." icon="headset" stats={[{ value: tickets.filter(ticket => ticket.status === 'open').length, label: 'открыто' }, { value: tickets.filter(ticket => ticket.status === 'answered').length, label: 'ждут вашего ответа' }, { value: tickets.length, label: 'обращений всего' }]} actions={<button type="button" onClick={startCreate} className={primaryActionClass}><Icon name="plus" className="h-4 w-4" />Новое обращение</button>} />
          <ResourceEmpty icon="message" title="Выберите обращение или создайте новое" description="Для быстрого решения приложите точный текст ошибки, название программы и шаг, на котором возникла проблема." action={<button type="button" onClick={startCreate} className={primaryActionClass}>Обратиться в поддержку</button>} />
        </div>
      )}
      {paywall && <PaywallModal feature="Живой специалист — обращения в поддержку" onClose={() => setPaywall(false)} />}
    </ResourceLayout>
  )
}

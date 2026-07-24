import React, { useEffect, useRef, useState } from 'react'
import '../styles/a8-services-support-settings.css'
import { useTickets } from './support/useTickets'
import { SupportTicketNavItem } from './support/SupportTicketNavItem'
import {
  buildSupportMessage,
  buildSupportSubject,
  SUPPORT_CATEGORIES,
  TICKET_STATUS,
  type SupportCategory,
  type SupportImpact,
} from './support/supportUi'
import { usePlan } from '../lib/plan'
import PaywallModal from '../components/PaywallModal'
import { useToast } from '../lib/ui/ToastContext'
import { useCompany } from '../lib/CompanyContext'
import Icon from '../lib/ui/Icon'
import { BxMotion } from '../lib/ui/BxMotion'
import {
  ResourceLayout,
  ResourceSidebar,
  primaryActionClass,
  secondaryActionClass,
} from '../components/workspace/ResourceWorkspace'

const fieldClass = 'min-h-12 w-full rounded-xl border border-bx-border-2 bg-bx-bg px-4 text-base text-bx-text outline-none transition-colors placeholder:text-bx-muted focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15'
const invalidFieldClass = 'border-red-500/60 focus:border-red-500 focus:ring-red-500/15'
type SupportRequiredField = 'body' | 'contactPhone'

export default function Support() {
  const { tickets, activeId, messages, loading, openTicket, createTicket, reply, closeTicket } = useTickets()
  const { plan, isPro } = usePlan()
  const hasSupport = plan === 'standard' || plan === 'premium' || (plan === undefined && isPro)
  const { active: activeCompany } = useCompany()
  const toast = useToast()
  const [creating, setCreating] = useState(hasSupport)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [remoteId, setRemoteId] = useState('')
  const [category, setCategory] = useState<SupportCategory>('bx')
  const [impact, setImpact] = useState<SupportImpact>('normal')
  const [createAttempted, setCreateAttempted] = useState(false)
  const [blurredFields, setBlurredFields] = useState<Set<SupportRequiredField>>(() => new Set())
  const [replyText, setReplyText] = useState('')
  const [paywall, setPaywall] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const contactPhoneRef = useRef<HTMLInputElement>(null)
  const active = tickets.find(ticket => ticket.id === activeId) ?? null
  const bodyInvalid = body.trim().length < 20
  const contactPhoneInvalid = !contactPhone.trim()
  const showFieldError = (field: SupportRequiredField, invalid: boolean) => invalid && (createAttempted || blurredFields.has(field))
  const markFieldBlurred = (field: SupportRequiredField) => setBlurredFields(current => new Set(current).add(field))

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
      if (!hasSupport) { setPaywall(true); return }
      const parsed = JSON.parse(draft) as {
        subject?: string
        body?: string
        category?: SupportCategory
        impact?: SupportImpact
        remoteId?: string
      }
      setSubject(parsed.subject ?? '')
      setBody(parsed.body ?? '')
      if (SUPPORT_CATEGORIES.some(item => item.value === parsed.category)) setCategory(parsed.category as SupportCategory)
      if (parsed.impact === 'normal' || parsed.impact === 'blocking') setImpact(parsed.impact)
      if (parsed.remoteId) setRemoteId(parsed.remoteId)
      setCreating(true)
    } catch { /* повреждённый черновик не блокирует поддержку */ }
    finally { setDraftReady(true) }
  }, [hasSupport])
  useEffect(() => {
    if (!draftReady || !creating || !hasSupport) return undefined
    const timer = window.setTimeout(() => {
      if (!body.trim() && !subject.trim() && !remoteId.trim() && category === 'bx' && impact === 'normal') {
        localStorage.removeItem('bx_support_draft')
        return
      }
      localStorage.setItem('bx_support_draft', JSON.stringify({ subject, body, category, impact, remoteId }))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [body, category, creating, draftReady, hasSupport, impact, remoteId, subject])

  const startCreate = () => {
    if (!hasSupport) { setPaywall(true); return }
    setCreateAttempted(false)
    setBlurredFields(new Set())
    setCreating(true)
  }
  const submitCreate = async () => {
    if (submitting) return
    setCreateAttempted(true)
    if (bodyInvalid || contactPhoneInvalid) {
      if (bodyInvalid) bodyRef.current?.focus()
      else contactPhoneRef.current?.focus()
      toast.error('Проверьте обязательные поля формы')
      return
    }
    setSubmitting(true)
    try {
      const messageBody = buildSupportMessage(body, category, impact)
      const ticketSubject = subject.trim() || buildSupportSubject(body, category)
      const id = await createTicket(ticketSubject, messageBody, category, contactName.trim() || undefined, contactPhone.trim(), activeCompany?.name || undefined, activeCompany?.inn || undefined, remoteId.trim() || undefined)
      if (!id) { toast.error('Не удалось создать обращение — проверьте вход в аккаунт'); return }
      localStorage.setItem('bx_support_contact_name', contactName.trim())
      localStorage.setItem('bx_support_contact_phone', contactPhone.trim())
      localStorage.setItem('bx_support_remote_id', remoteId.trim())
      localStorage.removeItem('bx_support_draft')
      setCreating(false); setSubject(''); setBody(''); setCategory('bx'); setImpact('normal'); setCreateAttempted(false); setBlurredFields(new Set())
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
      footer={<button type="button" onClick={startCreate} className={`${primaryActionClass} w-full`}><Icon name="plus" className="h-4 w-4" />Отправить заявку</button>}
    >
      {loading && <div className="px-3 py-6 text-center text-xs text-bx-muted">Загружаем обращения…</div>}
      {!loading && tickets.length === 0 && <div className="mx-1 rounded-xl border border-dashed border-bx-border p-4 text-center text-[10px] leading-relaxed text-bx-muted">Здесь появится история общения со специалистами BX.</div>}
      {tickets.map(ticket => <SupportTicketNavItem key={ticket.id} ticket={ticket} active={activeId === ticket.id} onOpen={() => { setCreating(false); openTicket(ticket.id) }} />)}
    </ResourceSidebar>
  )

  return (
    <ResourceLayout sidebar={sidebar}>
      <div className="bx-a8-support w-full">
      {creating ? (
        <BxMotion preset="raise" className="bx-a8-support__composer mx-auto max-w-3xl space-y-4">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Поддержка BX</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-bx-text">Чем помочь?</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bx-muted">Одно сообщение и номер для связи — тему обращения BX сформирует сам.</p>
            </div>
            {tickets.length > 0 && <button type="button" onClick={() => setCreating(false)} disabled={submitting} className={secondaryActionClass}>К обращениям</button>}
          </header>

          <section className="space-y-5 rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm sm:p-6">
            <label className="block space-y-2">
              <span className="text-sm font-black text-bx-text">Что случилось? <span className="text-red-500">*</span></span>
              <textarea ref={bodyRef} value={body} required maxLength={4000} aria-invalid={showFieldError('body', bodyInvalid)} aria-describedby="support-body-help" onBlur={() => markFieldBlurred('body')} onChange={event => setBody(event.target.value)} rows={7} placeholder="Например: при подписании счёта E-Imzo пишет «ключ не найден». Перезапуск не помог." className={`${fieldClass} h-auto min-h-48 resize-y py-3 leading-relaxed ${showFieldError('body', bodyInvalid) ? invalidFieldClass : ''}`} />
              <span id="support-body-help" aria-live="polite" className={`flex items-start justify-between gap-3 text-[11px] ${showFieldError('body', bodyInvalid) ? 'text-red-600 dark:text-red-300' : 'text-bx-muted'}`}><span>{showFieldError('body', bodyInvalid) ? 'Добавьте хотя бы 20 символов, чтобы специалист понял проблему.' : 'Если видите ошибку — скопируйте её текст сюда. Черновик сохраняется на устройстве.'}</span><span className="shrink-0 tabular-nums">{body.length}/4000</span></span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Раздел</span><select value={category} onChange={event => setCategory(event.target.value as SupportCategory)} className={fieldClass}>{SUPPORT_CATEGORIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${impact === 'blocking' ? 'border-amber-500/35 bg-amber-500/10' : 'border-bx-border bg-bx-bg'}`}><input type="checkbox" checked={impact === 'blocking'} onChange={event => setImpact(event.target.checked ? 'blocking' : 'normal')} className="h-5 w-5 rounded border-bx-border-2 text-violet-600 focus:ring-violet-500" /><span><span className="block text-xs font-black text-bx-text">Работа остановлена</span><span className="mt-0.5 block text-[10px] text-bx-muted">Отметьте, только если нельзя продолжать работу</span></span></label>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
              <div className="flex items-center gap-2"><Icon name="user" className="h-4 w-4 text-violet-700 dark:text-violet-300" /><h2 className="text-sm font-black text-bx-text">Куда ответить</h2></div>
              <p className="mt-1 text-[11px] text-bx-muted">Контакты запомнятся на этом устройстве для следующих заявок.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Телефон <span className="text-red-500">*</span></span><input ref={contactPhoneRef} value={contactPhone} required maxLength={30} aria-invalid={showFieldError('contactPhone', contactPhoneInvalid)} aria-describedby="support-phone-error" onBlur={() => markFieldBlurred('contactPhone')} onChange={event => setContactPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="+998 90 123-45-67" className={`${fieldClass} ${showFieldError('contactPhone', contactPhoneInvalid) ? invalidFieldClass : ''}`} />{showFieldError('contactPhone', contactPhoneInvalid) && <span id="support-phone-error" role="alert" className="block text-[10px] text-red-600 dark:text-red-300">Оставьте номер для уточняющих вопросов.</span>}</label>
                <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Как к вам обращаться <span className="font-normal text-bx-muted">· необязательно</span></span><input value={contactName} maxLength={100} onChange={event => setContactName(event.target.value)} autoComplete="name" placeholder="Имя" className={fieldClass} /></label>
              </div>
            </div>

            <details className="rounded-2xl border border-bx-border bg-bx-bg">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-xs font-bold text-bx-text outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500"><Icon name="settings" className="h-4 w-4 text-bx-muted" /><span className="flex-1">Дополнительные сведения</span><span className="text-[10px] font-normal text-bx-muted">необязательно</span></summary>
              <div className="grid gap-3 border-t border-bx-border p-4 sm:grid-cols-2">
                <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Своя тема заявки</span><input value={subject} maxLength={120} onChange={event => setSubject(event.target.value)} placeholder="BX сформирует автоматически" className={fieldClass} /></label>
                <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">ID AnyDesk / RustDesk</span><input value={remoteId} maxLength={80} onChange={event => setRemoteId(event.target.value)} placeholder="Только если уже договорились" className={`${fieldClass} font-mono tracking-wider`} /></label>
                <p className="text-[11px] leading-relaxed text-bx-muted sm:col-span-2">Организация: <strong className="text-bx-text">{activeCompany?.name ?? 'не выбрана'}</strong>{activeCompany?.inn ? ` · ИНН ${activeCompany.inn}` : ''}. Никогда не отправляйте пароль, PIN-код или закрытый ключ ЭЦП.</p>
              </div>
            </details>

            <div className="flex flex-col gap-2 border-t border-bx-border pt-4 sm:flex-row sm:items-center"><button type="button" onClick={submitCreate} disabled={submitting} className={`${primaryActionClass} w-full sm:w-auto`}><Icon name="send" className={`h-4 w-4 ${submitting ? 'animate-pulse motion-reduce:animate-none' : ''}`} />{submitting ? 'Отправляем…' : 'Отправить заявку'}</button><button type="button" onClick={() => setCreating(false)} disabled={submitting} className={`${secondaryActionClass} w-full sm:w-auto`}>Отмена</button><p className="text-center text-[10px] text-bx-muted sm:ml-auto sm:text-right">Обычно отвечаем до 1 рабочего дня</p></div>
          </section>
        </BxMotion>
      ) : active ? (
        <BxMotion preset="fade" className="bx-a8-support__thread mx-auto flex min-h-[calc(100vh-130px)] max-w-5xl flex-col overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bx-border px-5 py-4">
            <div className="min-w-0"><div className="flex items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${TICKET_STATUS[active.status].cls}`}>{TICKET_STATUS[active.status].label}</span><span className="text-[10px] text-bx-muted">Обновлено {new Date(active.updated_at).toLocaleDateString('ru-RU')}</span></div><h2 className="mt-2 truncate text-lg font-black text-bx-text">{active.subject}</h2></div>
            {active.status !== 'closed' && <button type="button" onClick={closeActive} className={secondaryActionClass}>Закрыть обращение</button>}
          </header>
          <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-bx-bg/60 p-5 lg:p-6">
            {messages.map(message => (
              <div key={message.id} className={`max-w-[78%] ${message.author === 'user' ? 'ml-auto' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${message.author === 'user' ? 'rounded-br-md bg-violet-600 text-white' : message.author === 'auto' ? 'rounded-bl-md border border-amber-500/25 bg-amber-500/[0.08] text-bx-text' : 'rounded-bl-md border border-bx-border bg-bx-surface text-bx-text'}`}>
                  {message.author === 'staff' && <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300"><Icon name="headset" className="h-3.5 w-3.5" />Специалист BX</p>}
                  {message.author === 'auto' && <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black text-amber-700 dark:text-amber-300"><Icon name="bell" className="h-3.5 w-3.5" />Автоматическое сообщение BX</p>}
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
                <p className={`mt-1 text-[9px] text-bx-muted ${message.author === 'user' ? 'text-right' : ''}`}>{new Date(message.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
          {active.status !== 'closed' && <div className="flex gap-2 border-t border-bx-border p-4"><label className="min-w-0 flex-1"><span className="sr-only">Дополнить обращение</span><input value={replyText} onChange={event => setReplyText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') submitReply() }} placeholder="Дополнить обращение…" className={fieldClass} /></label><button type="button" onClick={submitReply} disabled={sendingReply || !replyText.trim()} className={primaryActionClass}><Icon name="send" className={`h-4 w-4 ${sendingReply ? 'animate-pulse motion-reduce:animate-none' : ''}`} />{sendingReply ? 'Отправляем…' : 'Отправить'}</button></div>}
        </BxMotion>
      ) : (
        <BxMotion preset="raise" className="mx-auto flex min-h-[calc(100vh-190px)] max-w-3xl items-center justify-center py-8">
          <div className="w-full rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-bx-surface to-violet-500/[0.06] p-7 text-center shadow-sm sm:p-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20"><Icon name="headset" className="h-6 w-6" /></span>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Поддержка BX</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-bx-text">Чем помочь?</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-bx-muted">Опишите проблему в одном сообщении. Ответ специалиста и вся переписка останутся здесь.</p>
            <button type="button" onClick={startCreate} className={`${primaryActionClass} mt-6 w-full sm:w-auto`}><Icon name="send" className="h-4 w-4" />Отправить заявку</button>
            <p className="mt-3 text-[10px] text-bx-muted">BX, 1С, E-Imzo, документы и рабочий компьютер · обычно до 1 рабочего дня</p>
          </div>
        </BxMotion>
      )}
      {paywall && <PaywallModal feature="Живой специалист — обращения в поддержку" onClose={() => setPaywall(false)} />}
      </div>
    </ResourceLayout>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import { useTickets } from './support/useTickets'
import { SupportTicketNavItem } from './support/SupportTicketNavItem'
import {
  buildSupportMessage,
  SUPPORT_CATEGORIES,
  SUPPORT_IMPACTS,
  TICKET_STATUS,
  type SupportCategory,
  type SupportImpact,
} from './support/supportUi'
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

const fieldClass = 'h-11 w-full rounded-xl border border-bx-border-2 bg-bx-bg px-3.5 text-sm text-bx-text outline-none transition-colors placeholder:text-bx-muted focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15'
const invalidFieldClass = 'border-red-500/60 focus:border-red-500 focus:ring-red-500/15'
type SupportRequiredField = 'subject' | 'body' | 'contactName' | 'contactPhone'

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
  const [category, setCategory] = useState<SupportCategory>('bx')
  const [impact, setImpact] = useState<SupportImpact>('normal')
  const [remoteExpanded, setRemoteExpanded] = useState(false)
  const [createAttempted, setCreateAttempted] = useState(false)
  const [blurredFields, setBlurredFields] = useState<Set<SupportRequiredField>>(() => new Set())
  const [replyText, setReplyText] = useState('')
  const [paywall, setPaywall] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const contactNameRef = useRef<HTMLInputElement>(null)
  const contactPhoneRef = useRef<HTMLInputElement>(null)
  const active = tickets.find(ticket => ticket.id === activeId) ?? null
  const subjectInvalid = !subject.trim()
  const bodyInvalid = body.trim().length < 20
  const contactNameInvalid = !contactName.trim()
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
    setCreateAttempted(false)
    setBlurredFields(new Set())
    setCreating(true)
  }
  const submitCreate = async () => {
    if (submitting) return
    setCreateAttempted(true)
    if (subjectInvalid || bodyInvalid || contactNameInvalid || contactPhoneInvalid) {
      if (subjectInvalid) subjectRef.current?.focus()
      else if (bodyInvalid) bodyRef.current?.focus()
      else if (contactNameInvalid) contactNameRef.current?.focus()
      else contactPhoneRef.current?.focus()
      toast.error('Проверьте обязательные поля формы')
      return
    }
    setSubmitting(true)
    try {
      const messageBody = buildSupportMessage(body, category, impact)
      const id = await createTicket(subject.trim(), messageBody, category, contactName.trim(), contactPhone.trim(), activeCompany?.name || undefined, activeCompany?.inn || undefined, remoteId.trim() || undefined)
      if (!id) { toast.error('Не удалось создать обращение — проверьте вход в аккаунт'); return }
      localStorage.setItem('bx_support_contact_name', contactName.trim())
      localStorage.setItem('bx_support_contact_phone', contactPhone.trim())
      localStorage.setItem('bx_support_remote_id', remoteId.trim())
      setCreating(false); setSubject(''); setBody(''); setCategory('bx'); setImpact('normal'); setRemoteExpanded(false); setCreateAttempted(false); setBlurredFields(new Set())
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
      {tickets.map(ticket => <SupportTicketNavItem key={ticket.id} ticket={ticket} active={activeId === ticket.id} onOpen={() => { setCreating(false); openTicket(ticket.id) }} />)}
    </ResourceSidebar>
  )

  return (
    <ResourceLayout sidebar={sidebar}>
      {creating ? (
        <div className="mx-auto max-w-5xl space-y-5">
          <ResourceHero eyebrow="Новое обращение" title="Расскажите, что случилось — BX соберёт всё нужное" description="Форма подскажет, какие сведения помогут специалисту разобраться быстрее. Пароли и ключи электронной подписи указывать нельзя." icon="message" stats={[{ value: activeCompany?.name ?? 'Не выбрана', label: 'организация' }, { value: '1 рабочий день', label: 'обычный срок ответа' }]} />
          <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4 rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm lg:p-6">
              <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Шаг 1 · Раздел проблемы</p><h2 className="mt-1 text-base font-black text-bx-text">К чему относится обращение?</h2><p className="mt-1 text-[11px] text-bx-muted">Выберите ближайший вариант — специалист сразу увидит нужный контекст.</p></div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="Раздел проблемы">
                {SUPPORT_CATEGORIES.map(item => <button key={item.value} type="button" aria-pressed={category === item.value} onClick={() => setCategory(item.value)} className={`min-h-[76px] rounded-2xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${category === item.value ? 'border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-200' : 'border-bx-border bg-bx-bg text-bx-text hover:border-blue-500/25 hover:bg-blue-500/[0.05]'}`}><span className="flex items-start gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${category === item.value ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted'}`}><Icon name={item.icon} className="h-4 w-4" /></span><span><span className="block text-[11px] font-black">{item.label}</span><span className={`mt-0.5 block text-[10px] leading-snug ${category === item.value ? 'text-blue-600/80 dark:text-blue-200/75' : 'text-bx-muted'}`}>{item.hint}</span></span></span></button>)}
              </div>

              <div className="border-t border-bx-border pt-4"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Шаг 2 · Суть обращения</p><h2 className="mt-1 text-base font-black text-bx-text">Что произошло?</h2></div>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Короткая тема <span className="text-red-500">*</span></span><input ref={subjectRef} value={subject} maxLength={120} aria-invalid={showFieldError('subject', subjectInvalid)} aria-describedby="support-subject-help" onBlur={() => markFieldBlurred('subject')} onChange={event => setSubject(event.target.value)} placeholder="Например: E-Imzo не видит ключ" className={`${fieldClass} ${showFieldError('subject', subjectInvalid) ? invalidFieldClass : ''}`} /><span id="support-subject-help" aria-live="polite" className={`flex justify-between text-[10px] ${showFieldError('subject', subjectInvalid) ? 'text-red-600 dark:text-red-300' : 'text-bx-muted'}`}><span>{showFieldError('subject', subjectInvalid) ? 'Напишите, что именно не работает.' : 'Одно предложение без длинного описания.'}</span><span className="tabular-nums">{subject.length}/120</span></span></label>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Подробное описание <span className="text-red-500">*</span></span><textarea ref={bodyRef} value={body} maxLength={4000} aria-invalid={showFieldError('body', bodyInvalid)} aria-describedby="support-body-help" onBlur={() => markFieldBlurred('body')} onChange={event => setBody(event.target.value)} rows={8} placeholder={'1. Что вы делали\n2. Что произошло или какой текст ошибки появился\n3. Какой результат ожидали'} className={`${fieldClass} h-auto min-h-44 resize-y py-3 leading-relaxed ${showFieldError('body', bodyInvalid) ? invalidFieldClass : ''}`} /><span id="support-body-help" aria-live="polite" className={`flex justify-between text-[10px] ${showFieldError('body', bodyInvalid) ? 'text-red-600 dark:text-red-300' : 'text-bx-muted'}`}><span>{showFieldError('body', bodyInvalid) ? 'Добавьте хотя бы 20 символов, чтобы специалист понял проблему.' : 'Полезнее всего точный текст ошибки и последовательность действий.'}</span><span className="tabular-nums">{body.length}/4000</span></span></label>

              <fieldset className="border-t border-bx-border pt-4"><legend className="text-xs font-bold text-bx-text">Как проблема влияет на работу?</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{(Object.entries(SUPPORT_IMPACTS) as Array<[SupportImpact, typeof SUPPORT_IMPACTS[SupportImpact]]>).map(([value, option]) => <button key={value} type="button" aria-pressed={impact === value} onClick={() => setImpact(value)} className={`min-h-[68px] rounded-2xl border px-3.5 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${impact === value ? value === 'blocking' ? 'border-amber-500/35 bg-amber-500/10' : 'border-blue-500/35 bg-blue-500/10' : 'border-bx-border bg-bx-bg hover:border-blue-500/25'}`}><span className="block text-[11px] font-black text-bx-text">{option.label}</span><span className="mt-1 block text-[9px] leading-snug text-bx-muted">{option.hint}</span></button>)}</div></fieldset>

              <div className="flex flex-wrap gap-2 border-t border-bx-border pt-4"><button type="button" onClick={submitCreate} disabled={submitting} className={primaryActionClass}><Icon name="send" className={`h-4 w-4 ${submitting ? 'animate-pulse motion-reduce:animate-none' : ''}`} />{submitting ? 'Отправляем…' : 'Отправить обращение'}</button><button type="button" onClick={() => setCreating(false)} disabled={submitting} className={secondaryActionClass}>Отмена</button></div>
            </div>
            <aside className="space-y-3 lg:sticky lg:top-6">
              <div className={`rounded-2xl border p-4 ${activeCompany ? 'border-blue-500/20 bg-blue-500/[0.06]' : 'border-amber-500/20 bg-amber-500/[0.07]'}`}>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-bx-muted">Организация обращения</p>
                <p className="mt-2 text-xs font-black text-bx-text">{activeCompany?.name ?? 'Организация не выбрана'}</p>
                {activeCompany?.inn && <p className="mt-1 text-[10px] text-bx-muted">ИНН {activeCompany.inn}</p>}
                {!activeCompany && <p className="mt-2 text-[10px] leading-relaxed text-bx-muted">Выберите компанию в верхней панели, если проблема относится к её данным.</p>}
              </div>
              <section className="rounded-2xl border border-bx-border bg-bx-surface p-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Шаг 3 · Контакты</p><div className="mt-3 space-y-3"><label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Ваше ФИО <span className="text-red-500">*</span></span><input ref={contactNameRef} value={contactName} maxLength={100} aria-invalid={showFieldError('contactName', contactNameInvalid)} onBlur={() => markFieldBlurred('contactName')} onChange={event => setContactName(event.target.value)} autoComplete="name" placeholder="Иван Иванов" className={`${fieldClass} ${showFieldError('contactName', contactNameInvalid) ? invalidFieldClass : ''}`} />{showFieldError('contactName', contactNameInvalid) && <span role="alert" className="block text-[10px] text-red-600 dark:text-red-300">Укажите, к кому обратиться.</span>}</label><label className="block space-y-1.5"><span className="text-xs font-bold text-bx-text">Телефон <span className="text-red-500">*</span></span><input ref={contactPhoneRef} value={contactPhone} maxLength={30} aria-invalid={showFieldError('contactPhone', contactPhoneInvalid)} onBlur={() => markFieldBlurred('contactPhone')} onChange={event => setContactPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="+998 (90) 123-45-67" className={`${fieldClass} ${showFieldError('contactPhone', contactPhoneInvalid) ? invalidFieldClass : ''}`} />{showFieldError('contactPhone', contactPhoneInvalid) && <span role="alert" className="block text-[10px] text-red-600 dark:text-red-300">Оставьте номер для уточняющих вопросов.</span>}</label></div></section>
              <section className="overflow-hidden rounded-2xl border border-bx-border bg-bx-surface"><button type="button" aria-expanded={remoteExpanded} onClick={() => setRemoteExpanded(value => !value)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-bx-bg focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bx-surface-2 text-bx-muted"><Icon name="monitor" className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-bx-text">Удалённое подключение</span><span className="mt-0.5 block text-[10px] text-bx-muted">Необязательно</span></span><Icon name="arrowR" className={`h-4 w-4 text-bx-muted transition-transform ${remoteExpanded ? 'rotate-90' : ''}`} /></button>{remoteExpanded && <div className="border-t border-bx-border p-4"><label className="block"><span className="text-[10px] leading-relaxed text-bx-muted">ID AnyDesk / RustDesk. Никогда не передавайте пароль постоянного доступа.</span><input value={remoteId} maxLength={80} onChange={event => setRemoteId(event.target.value)} placeholder="123 456 789" className={`${fieldClass} mt-3 font-mono tracking-wider`} /></label><div className="mt-3 flex gap-2"><a href="https://anydesk.com/download" target="_blank" rel="noreferrer" className={`${secondaryActionClass} flex-1 px-2`}>AnyDesk <Icon name="external" className="h-3.5 w-3.5" /></a><a href="https://rustdesk.com/download" target="_blank" rel="noreferrer" className={`${secondaryActionClass} flex-1 px-2`}>RustDesk <Icon name="external" className="h-3.5 w-3.5" /></a></div></div>}</section>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4"><p className="flex items-center gap-2 text-[10px] font-black text-emerald-800 dark:text-emerald-300"><Icon name="shield" className="h-4 w-4" />Перед отправкой</p><ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-bx-muted"><li>• Не указывайте пароль от BX или почты</li><li>• Не отправляйте PIN-код и закрытый ключ ЭЦП</li><li>• Проверьте номер телефона</li></ul></div>
            </aside>
          </section>
        </div>
      ) : active ? (
        <div className="mx-auto flex min-h-[calc(100vh-130px)] max-w-5xl flex-col overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bx-border px-5 py-4">
            <div className="min-w-0"><div className="flex items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${TICKET_STATUS[active.status].cls}`}>{TICKET_STATUS[active.status].label}</span><span className="text-[10px] text-bx-muted">Обновлено {new Date(active.updated_at).toLocaleDateString('ru-RU')}</span></div><h2 className="mt-2 truncate text-lg font-black text-bx-text">{active.subject}</h2></div>
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

import React, { useState, useRef, useEffect } from 'react'
import { useTickets, type BxTicket } from './support/useTickets'
import { usePlan } from '../lib/plan'
import PaywallModal from '../components/PaywallModal'
import { useToast } from '../lib/ui/ToastContext'
import { useCompany } from '../lib/CompanyContext'

const STATUS: Record<BxTicket['status'], { label: string; cls: string }> = {
  open:     { label: 'Открыт',   cls: 'bg-blue-500/15 text-blue-400' },
  answered: { label: 'Есть ответ', cls: 'bg-emerald-500/15 text-emerald-400' },
  closed:   { label: 'Закрыт',   cls: 'bg-slate-500/15 text-bx-muted' },
}

const Support = () => {
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const active = tickets.find(t => t.id === activeId) ?? null

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  // Загрузка сохраненных контактных данных из localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('bx_support_contact_name')
    const savedPhone = localStorage.getItem('bx_support_contact_phone')
    const savedRemoteId = localStorage.getItem('bx_support_remote_id')
    if (savedName) setContactName(savedName)
    if (savedPhone) setContactPhone(savedPhone)
    if (savedRemoteId) setRemoteId(savedRemoteId)
  }, [])

  useEffect(() => {
    try {
      const draft = localStorage.getItem('bx_support_draft')
      if (draft) {
        const { subject: s, body: b } = JSON.parse(draft)
        localStorage.removeItem('bx_support_draft')
        if (!isPro) {
          setPaywall(true)
          return
        }
        setSubject(s || '')
        setBody(b || '')
        setCreating(true)
      }
    } catch {
      // ignore
    }
  }, [isPro])

  const handleStartCreate = () => {
    if (!isPro) {
      setPaywall(true)
      return
    }
    setCreating(true)
  }

  const handleSubmitCreate = async () => {
    if (!subject.trim() || !body.trim() || !contactName.trim() || !contactPhone.trim()) {
      toast.error('Пожалуйста, заполните тему, описание и ваши контакты')
      return
    }
    const id = await createTicket(
      subject.trim(),
      body.trim(),
      contactName.trim(),
      contactPhone.trim(),
      activeCompany?.name || undefined,
      activeCompany?.inn || undefined,
      remoteId.trim() || undefined
    )
    if (!id) {
      toast.error('Не удалось создать обращение — проверьте вход в аккаунт')
      return
    }

    // Сохраняем введенные контактные данные для удобства будущих обращений
    localStorage.setItem('bx_support_contact_name', contactName.trim())
    localStorage.setItem('bx_support_contact_phone', contactPhone.trim())
    localStorage.setItem('bx_support_remote_id', remoteId.trim())

    setCreating(false)
    setSubject('')
    setBody('')
    toast.success('Обращение отправлено — специалист ответит здесь')
    await openTicket(id)
  }

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !active) return
    const ok = await reply(active.id, replyText.trim())
    if (ok) {
      setReplyText('')
    }
  }

  const handleKeyDownReply = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmitReply()
    }
  }

  const handleCloseTicket = async () => {
    if (!active) return
    await closeTicket(active.id)
    toast.success('Обращение закрыто')
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Список обращений */}
      <aside className="w-72 flex-shrink-0 border-r border-bx-border flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-base font-semibold text-bx-text">Поддержка</h1>
          <p className="text-xs text-bx-muted mt-0.5">Техподдержка по ПК, 1С и E-Imzo</p>
        </div>
        <div className="px-3 pb-2">
          <button onClick={handleStartCreate}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
            + Новое обращение
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {loading && <p className="text-xs text-bx-muted text-center py-4">Загрузка…</p>}
          {!loading && tickets.length === 0 && (
            <p className="text-xs text-bx-muted text-center py-6 px-3 leading-relaxed">
              Обращений пока нет. Нужна помощь с 1С, E-Imzo или настройкой ПК? Откройте новое обращение.
            </p>
          )}
          {tickets.map(t => (
            <button key={t.id} onClick={() => openTicket(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                activeId === t.id ? 'bg-blue-600/20' : 'hover:bg-bx-surface-2'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-medium truncate ${activeId === t.id ? 'text-blue-400' : 'text-bx-text'}`}>{t.subject}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span>
              </div>
              <p className="text-[10px] text-bx-muted mt-0.5">{new Date(t.updated_at).toLocaleDateString('ru-RU')}</p>
            </button>
          ))}
        </nav>
      </aside>

      {/* Переписка */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {creating ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-lg mx-auto space-y-4">
              <h2 className="text-lg font-semibold text-bx-text">Новое обращение в техподдержку</h2>
              
              {/* Информация о компании */}
              {activeCompany ? (
                <div className="bg-bx-surface-2 border border-blue-500/20 rounded-lg px-3.5 py-2.5 text-xs text-bx-text">
                  <span className="text-[10px] uppercase font-bold text-blue-400 block mb-0.5">Организация обращения</span>
                  <b>{activeCompany.name}</b> {activeCompany.inn ? `(ИНН: ${activeCompany.inn})` : ''}
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3.5 py-2.5 text-xs text-amber-400">
                  ⚠ Рекомендуем выбрать активную организацию в шапке приложения, чтобы специалист сразу видел реквизиты.
                </div>
              )}

              {/* Контакты человека */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-bx-muted block mb-1.5">Ваше ФИО *</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-bx-muted block mb-1.5">Телефон для связи *</label>
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                    placeholder="+998 (90) 123-45-67"
                    className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm" />
                </div>
              </div>

              {/* ID удаленного доступа */}
              <div className="bg-bx-surface/40 p-4 rounded-xl border border-bx-border/60 space-y-2.5">
                <div>
                  <label className="text-xs text-bx-muted font-medium block mb-1.5">ID AnyDesk / RustDesk (для удалённой помощи)</label>
                  <input value={remoteId} onChange={e => setRemoteId(e.target.value)}
                    placeholder="Например: 123 456 789"
                    className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm font-mono tracking-wider" />
                </div>
                <div className="flex gap-4 items-center text-[11px] text-bx-muted">
                  <span>Если у вас нет программ удаленного доступа, скачайте:</span>
                  <div className="flex gap-2.5">
                    <a href="https://anydesk.com/download" target="_blank" rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-semibold underline transition-colors">AnyDesk</a>
                    <span className="text-bx-muted">|</span>
                    <a href="https://rustdesk.com/download" target="_blank" rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-semibold underline transition-colors">RustDesk</a>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-bx-muted block mb-1.5">Тема *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Например: Ошибка при входе в E-Imzo или Настройка принтера"
                  className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm" />
              </div>
              
              <div>
                <label className="text-xs text-bx-muted block mb-1.5">Описание проблемы *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
                  placeholder="Опишите проблему: какая программа не работает, код ошибки или что требуется настроить…"
                  className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm resize-none" />
              </div>

              <div className="flex gap-2">
                <button onClick={handleSubmitCreate} disabled={!subject.trim() || !body.trim() || !contactName.trim() || !contactPhone.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
                  Отправить
                </button>
                <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-bx-muted hover:text-bx-text">Отмена</button>
              </div>
              <p className="text-[11px] text-bx-muted">Специалист техподдержки ответит в этом же обращении. Обычно — в течение рабочего дня.</p>
            </div>
          </div>
        ) : active ? (
          <>
            <div className="flex-shrink-0 border-b border-bx-border px-6 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-bx-text truncate">{active.subject}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${STATUS[active.status].cls}`}>{STATUS[active.status].label}</span>
              </div>
              {active.status !== 'closed' && (
                <button onClick={handleCloseTicket}
                  className="text-xs text-bx-muted hover:text-bx-text flex-shrink-0 transition-colors">Закрыть обращение</button>
              )}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`max-w-[75%] ${m.author === 'user' ? 'ml-auto' : ''}`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.author === 'user'
                      ? 'bg-blue-600/20 text-bx-text rounded-br-sm'
                      : 'bg-bx-surface border border-bx-border text-bx-text rounded-bl-sm'}`}>
                    {m.author === 'staff' && <p className="text-[10px] text-emerald-400 font-semibold mb-1">👤 Техподдержка BX</p>}
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                  <p className={`text-[10px] text-bx-muted mt-1 ${m.author === 'user' ? 'text-right' : ''}`}>
                    {new Date(m.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
            {active.status !== 'closed' && (
              <div className="flex-shrink-0 border-t border-bx-border p-4 flex gap-2">
                <input value={replyText} onChange={e => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDownReply}
                  placeholder="Дополнить обращение…"
                  className="flex-1 bg-bx-bg text-bx-text px-3.5 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm" />
                <button onClick={handleSubmitReply} disabled={!replyText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
                  Отправить
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <p className="text-3xl mb-3">🎧</p>
              <h2 className="text-base font-semibold text-bx-text mb-1.5">Нужна помощь с ПК или 1С?</h2>
              <p className="text-sm text-bx-muted leading-relaxed">
                Здесь вы можете задать вопросы специалистам технической поддержки по установке программ, настройке E-Imzo, кэша 1С или бэкапам.
              </p>
              <button onClick={handleStartCreate}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                + Новое обращение
              </button>
            </div>
          </div>
        )}
      </div>

      {paywall && <PaywallModal feature="Живой специалист — обращения в поддержку" onClose={() => setPaywall(false)} />}
    </div>
  )
}

export default Support

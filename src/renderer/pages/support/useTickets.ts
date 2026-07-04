import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/db/supabase'

// Тикеты живой поддержки (этап 3 стратегии).
// Ответы специалистов вставляются на стороне оператора (service role, author='staff').

export interface BxTicket {
  id: string
  user_id: string
  subject: string
  status: 'open' | 'answered' | 'closed'
  created_at: string
  updated_at: string
}

export interface BxTicketMessage {
  id: string
  ticket_id: string
  user_id: string
  author: 'user' | 'staff'
  body: string
  created_at: string
}

export function useTickets() {
  const [tickets, setTickets] = useState<BxTicket[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<BxTicketMessage[]>([])
  const [loading, setLoading] = useState(true)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bx_tickets').select('*').order('updated_at', { ascending: false })
      if (error) throw error
      setTickets((data ?? []) as BxTicket[])
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])

  const loadMessages = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from('bx_ticket_messages').select('*')
      .eq('ticket_id', ticketId).order('created_at', { ascending: true })
    setMessages((data ?? []) as BxTicketMessage[])
  }, [])

  const openTicket = useCallback(async (id: string) => {
    setActiveId(id)
    await loadMessages(id)
  }, [loadMessages])

  /** Создать тикет с первым сообщением. Возвращает id или null. */
  const createTicket = useCallback(async (subject: string, body: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: t, error } = await supabase
      .from('bx_tickets').insert({ user_id: user.id, subject }).select().single()
    if (error || !t) { console.error(error); return null }
    await supabase.from('bx_ticket_messages')
      .insert({ ticket_id: t.id, user_id: user.id, author: 'user', body })
    await loadTickets()
    return t.id as string
  }, [loadTickets])

  const reply = useCallback(async (ticketId: string, body: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { error } = await supabase.from('bx_ticket_messages')
      .insert({ ticket_id: ticketId, user_id: user.id, author: 'user', body })
    if (error) { console.error(error); return false }
    await loadMessages(ticketId)
    return true
  }, [loadMessages])

  const closeTicket = useCallback(async (ticketId: string) => {
    await supabase.from('bx_tickets').update({ status: 'closed' }).eq('id', ticketId)
    await loadTickets()
  }, [loadTickets])

  return { tickets, activeId, messages, loading, openTicket, createTicket, reply, closeTicket, reload: loadTickets }
}

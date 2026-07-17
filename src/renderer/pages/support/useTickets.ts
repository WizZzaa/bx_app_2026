import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/db/supabase'

export interface BxTicket {
  id: string
  user_id: string
  subject: string
  status: 'open' | 'answered' | 'closed'
  category?: string
  created_at: string
  updated_at: string
  contact_name?: string
  contact_phone?: string
  company_name?: string
  company_inn?: string
  remote_id?: string
}

export interface BxTicketMessage {
  id: string
  ticket_id: string
  user_id: string
  author: 'user' | 'staff' | 'auto'
  body: string
  created_at: string
}

export const useTickets = () => {
  const [tickets, setTickets] = useState<BxTicket[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<BxTicketMessage[]>([])
  const [loading, setLoading] = useState(true)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setTickets([]); return }
      // Личная «Поддержка» — только свои обращения. У админа RLS разрешает читать все
      // тикеты, поэтому здесь фильтруем по user_id явно (иначе админ видит чужие).
      // Все обращения админ смотрит в разделе /admin.
      const { data, error } = await supabase
        .from('bx_tickets').select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
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

  const createTicket = useCallback(async (
    subject: string,
    body: string,
    category?: string,
    contactName?: string,
    contactPhone?: string,
    companyName?: string,
    companyInn?: string,
    remoteId?: string
  ): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data: t, error } = await supabase
      .from('bx_tickets')
      .insert({
        user_id: user.id,
        subject,
        category: category || null,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        company_name: companyName || null,
        company_inn: companyInn || null,
        remote_id: remoteId || null
      })
      .select()
      .single()
      
    if (error || !t) {
      console.error(error)
      return null
    }
    
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

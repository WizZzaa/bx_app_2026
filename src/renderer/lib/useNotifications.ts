import { useState, useEffect } from 'react'
import { supabase } from './db/supabase'
import { useCompany } from './CompanyContext'
import { usePlan } from './plan'

export interface BxNotification {
  id: string
  title: string
  body: string
  target_type: 'all' | 'pro' | 'tin'
  target_tins?: string[]
  created_at: string
  expires_at?: string
  read?: boolean
}

export function useNotifications() {
  const { companies } = useCompany()
  const { isPro } = usePlan()
  const [notifications, setNotifications] = useState<BxNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const getReadIds = (): string[] => {
    try {
      const data = localStorage.getItem('bx_read_notification_ids')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  const markAsRead = (id: string) => {
    try {
      const readIds = getReadIds()
      if (!readIds.includes(id)) {
        readIds.push(id)
        localStorage.setItem('bx_read_notification_ids', JSON.stringify(readIds))
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = () => {
    try {
      const readIds = getReadIds()
      let updated = false
      notifications.forEach(n => {
        if (!readIds.includes(n.id)) {
          readIds.push(n.id)
          updated = true
        }
      })
      if (updated) {
        localStorage.setItem('bx_read_notification_ids', JSON.stringify(readIds))
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    markAsRead(id)
  }

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('bx_global_notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data) return

      const readIds = getReadIds()
      const shownIdsData = localStorage.getItem('bx_shown_notification_ids')
      const shownIds: string[] = shownIdsData ? JSON.parse(shownIdsData) : []

      const activeTins = companies.map(c => c.inn).filter(Boolean)
      const now = new Date().toISOString()

      const filtered: BxNotification[] = data
        .filter((item: any) => {
          if (item.expires_at && item.expires_at < now) return false
          if (item.target_type === 'pro' && !isPro) return false

          if (item.target_type === 'tin') {
            if (!item.target_tins || item.target_tins.length === 0) return false
            const hasMatchingTin = item.target_tins.some((tin: string) => activeTins.includes(tin))
            if (!hasMatchingTin) return false
          }

          return true
        })
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          target_type: item.target_type,
          target_tins: item.target_tins,
          created_at: item.created_at,
          expires_at: item.expires_at,
          read: readIds.includes(item.id)
        }))

      filtered.forEach(n => {
        if (!n.read && !shownIds.includes(n.id)) {
          if (window.bx?.notification?.show) {
            window.bx.notification.show(n.title, n.body).catch(() => void 0)
          } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(n.title, { body: n.body })
          }
          shownIds.push(n.id)
        }
      })
      localStorage.setItem('bx_shown_notification_ids', JSON.stringify(shownIds))

      setNotifications(filtered)
    } catch (e) {
      console.error('Ошибка получения уведомлений:', e)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('global-notifs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bx_global_notifications' },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [companies, isPro])

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  return {
    notifications,
    unreadCount,
    reload: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}

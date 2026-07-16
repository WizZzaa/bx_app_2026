import { useCallback, useEffect, useState } from 'react'
import { supabase } from './db/supabase'
import { useCompany } from './CompanyContext'
import { usePlan } from './plan'

type NotificationSource = 'global' | 'task_assignment'
type NotificationTarget = 'all' | 'pro' | 'standard' | 'premium' | 'tin'

export interface BxNotification {
  id: string
  title: string
  body: string
  target_type: NotificationTarget
  target_tins?: string[]
  created_at: string
  expires_at?: string
  read?: boolean
  source: NotificationSource
  event_id?: string
  company_id?: string
}

interface GlobalNotificationRow {
  id: string
  title: string
  body: string
  target_type: NotificationTarget
  target_tins?: string[] | null
  created_at: string
  send_at?: string | null
  expires_at?: string | null
}

export interface TaskNotificationRow {
  id: string
  event_id: string
  company_id: string
  notification_type: 'assignment' | 'reassignment' | 'accepted' | 'status_changed' | 'due_date_changed'
  event_title: string
  company_name: string
  due_date: string | null
  details?: string | null
  created_at: string
  read_at: string | null
}

function formatDueDate(value: string | null): string {
  if (!value) return 'без срока'
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function buildTaskNotification(item: TaskNotificationRow): BxNotification {
  const titleByType: Record<TaskNotificationRow['notification_type'], string> = {
    assignment: 'Вам назначена задача',
    reassignment: 'Задача переназначена вам',
    accepted: 'Исполнитель принял задачу',
    status_changed: 'Статус задачи изменён',
    due_date_changed: 'Срок задачи изменён',
  }
  const detailByType: Record<TaskNotificationRow['notification_type'], string> = {
    assignment: `срок ${formatDueDate(item.due_date)}`,
    reassignment: `срок ${formatDueDate(item.due_date)}`,
    accepted: 'исполнитель начал работу',
    status_changed: `новый статус: ${item.details || 'обновлён'}`,
    due_date_changed: `новый срок: ${formatDueDate(item.due_date)}`,
  }
  return {
    id: item.id,
    title: titleByType[item.notification_type],
    body: `${item.event_title}\n${item.company_name} · ${detailByType[item.notification_type]}`,
    target_type: 'all',
    created_at: item.created_at,
    read: Boolean(item.read_at),
    source: 'task_assignment',
    event_id: item.event_id,
    company_id: item.company_id,
  }
}

export function useNotifications() {
  const { companies } = useCompany()
  const { plan, isPro, isPremium } = usePlan()
  const [notifications, setNotifications] = useState<BxNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const getReadIds = useCallback((): string[] => {
    try {
      const data = localStorage.getItem('bx_read_notification_ids')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }, [])

  const rememberGlobalRead = useCallback((id: string) => {
    const readIds = getReadIds()
    if (!readIds.includes(id)) {
      readIds.push(id)
      localStorage.setItem('bx_read_notification_ids', JSON.stringify(readIds))
    }
  }, [getReadIds])

  const markAsRead = useCallback(async (id: string) => {
    const item = notifications.find(notification => notification.id === id)
    if (!item || item.read) return

    setNotifications(previous => previous.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification,
    ))

    if (item.source === 'task_assignment') {
      const { error } = await supabase
        .from('bx_task_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
      if (error) console.error('Не удалось отметить назначение прочитанным:', error)
    } else {
      rememberGlobalRead(id)
    }
  }, [notifications, rememberGlobalRead])

  const markAllAsRead = useCallback(async () => {
    const unreadTaskIds = notifications
      .filter(notification => notification.source === 'task_assignment' && !notification.read)
      .map(notification => notification.id)

    notifications
      .filter(notification => notification.source === 'global' && !notification.read)
      .forEach(notification => rememberGlobalRead(notification.id))

    setNotifications(previous => previous.map(notification => ({ ...notification, read: true })))

    if (unreadTaskIds.length > 0) {
      const { error } = await supabase
        .from('bx_task_notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadTaskIds)
      if (error) console.error('Не удалось отметить назначения прочитанными:', error)
    }
  }, [notifications, rememberGlobalRead])

  const deleteNotification = useCallback(async (id: string) => {
    const item = notifications.find(notification => notification.id === id)
    setNotifications(previous => previous.filter(notification => notification.id !== id))
    if (!item) return
    if (item.source === 'task_assignment') {
      if (!item.read) await markAsRead(id)
    } else {
      rememberGlobalRead(id)
    }
  }, [markAsRead, notifications, rememberGlobalRead])

  const fetchNotifications = useCallback(async () => {
    try {
      const [{ data: globalData, error: globalError }, { data: taskData, error: taskError }, { data: { session } }] = await Promise.all([
        supabase.from('bx_global_notifications').select('*').order('created_at', { ascending: false }),
        supabase
          .from('bx_task_notifications')
          .select('id, event_id, company_id, notification_type, event_title, company_name, due_date, details, created_at, read_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.auth.getSession(),
      ])

      if (globalError) throw globalError
      if (taskError) throw taskError

      const readIds = getReadIds()
      const shownIdsData = localStorage.getItem('bx_shown_notification_ids')
      const shownIds: string[] = shownIdsData ? JSON.parse(shownIdsData) : []
      const activeTins = companies.map(company => company.inn).filter((inn): inn is string => Boolean(inn))
      const now = new Date().toISOString()
      const registrationTime = session?.user?.created_at

      const globalNotifications = ((globalData ?? []) as GlobalNotificationRow[])
        .filter(item => {
          if (item.send_at && item.send_at > now) return false
          if (registrationTime && item.created_at < registrationTime) return false
          if (item.expires_at && item.expires_at < now) return false
          if (item.target_type === 'pro' && !isPro) return false
          if (item.target_type === 'standard' && plan !== 'standard') return false
          if (item.target_type === 'premium' && !isPremium) return false
          if (item.target_type === 'tin') {
            if (!item.target_tins?.length) return false
            if (!item.target_tins.some(tin => activeTins.includes(tin))) return false
          }
          return true
        })
        .map<BxNotification>(item => ({
          id: item.id,
          title: item.title,
          body: item.body,
          target_type: item.target_type,
          target_tins: item.target_tins ?? undefined,
          created_at: item.created_at,
          expires_at: item.expires_at ?? undefined,
          read: readIds.includes(item.id),
          source: 'global',
        }))

      const taskNotifications = ((taskData ?? []) as TaskNotificationRow[]).map(buildTaskNotification)

      const combined = [...taskNotifications, ...globalNotifications]
        .sort((left, right) => right.created_at.localeCompare(left.created_at))

      combined.forEach(notification => {
        const shownKey = `${notification.source}:${notification.id}`
        if (!notification.read && !shownIds.includes(shownKey)) {
          if (window.bx?.notification?.show) {
            window.bx.notification.show(notification.title, notification.body).catch(() => void 0)
          } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(notification.title, { body: notification.body })
          }
          shownIds.push(shownKey)
        }
      })
      localStorage.setItem('bx_shown_notification_ids', JSON.stringify(shownIds.slice(-500)))
      setNotifications(combined)
    } catch (error) {
      console.error('Ошибка получения уведомлений:', error)
    }
  }, [companies, getReadIds, isPremium, isPro, plan])

  useEffect(() => {
    let active = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function subscribe() {
      await fetchNotifications()
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return

      channel = supabase
        .channel(`bx-notifications-${user?.id ?? 'signed-out'}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bx_global_notifications' },
          () => { void fetchNotifications() },
        )

      if (user) {
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bx_task_notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          () => { void fetchNotifications() },
        )
      }
      channel.subscribe()
    }

    void subscribe()
    const interval = window.setInterval(() => { void fetchNotifications() }, 5 * 60 * 1000)

    return () => {
      active = false
      if (channel) void supabase.removeChannel(channel)
      window.clearInterval(interval)
    }
  }, [fetchNotifications])

  useEffect(() => {
    setUnreadCount(notifications.filter(notification => !notification.read).length)
  }, [notifications])

  return {
    notifications,
    unreadCount,
    reload: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}

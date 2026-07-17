import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/db/supabase'

export type EventActivityType = 'created' | 'assigned' | 'reassigned' | 'accepted' | 'status_changed' | 'due_date_changed'

export interface EventActivity {
  id: string
  event_id: string
  company_id: string | null
  actor_id: string | null
  activity_type: EventActivityType
  from_value: string | null
  to_value: string | null
  created_at: string
}

export function useEventActivity(eventId?: string | null) {
  const [activities, setActivities] = useState<EventActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!eventId) {
      setActivities([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('bx_event_activity')
      .select('id, event_id, company_id, actor_id, activity_type, from_value, to_value, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (queryError) {
      console.error('Не удалось загрузить журнал задачи:', queryError)
      setActivities([])
      setError(queryError.message)
    } else {
      setActivities((data ?? []) as EventActivity[])
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    if (!eventId) return undefined
    const channel = supabase
      .channel(`bx-event-activity-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bx_event_activity', filter: `event_id=eq.${eventId}` },
        () => { void reload() },
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [eventId, reload])

  return { activities, loading, error, reload }
}

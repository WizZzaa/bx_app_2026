import { supabase } from './db/supabase'

export type RuntimeWidgetAudience = 'all' | 'free' | 'pro' | 'admins'
export type RuntimeWidgetSource = 'internal' | 'official-api' | 'plugin'

export interface RuntimeWidgetConfig {
  id: string
  enabled: boolean
  placement: 'dashboard' | 'planner' | 'sidebar' | 'global'
  audience: RuntimeWidgetAudience
  source: RuntimeWidgetSource
  order: number
  blockedByPlugin?: boolean
}

export interface RuntimeWidgetPolicy {
  safeMode: boolean
  widgets: RuntimeWidgetConfig[]
  updatedAt?: string
}

const defaults: RuntimeWidgetPolicy = {
  safeMode: false,
  widgets: [
    { id: 'smart-calendar', enabled: true, placement: 'dashboard', audience: 'all', source: 'internal', order: 1 },
    { id: 'currency-rates', enabled: true, placement: 'dashboard', audience: 'all', source: 'official-api', order: 2 },
    { id: 'notification-center', enabled: true, placement: 'dashboard', audience: 'all', source: 'internal', order: 3 },
    { id: 'quick-actions', enabled: true, placement: 'dashboard', audience: 'all', source: 'internal', order: 4 },
  ],
}

const normalizePolicy = (value: unknown): RuntimeWidgetPolicy => {
  if (!value || typeof value !== 'object') return defaults
  const candidate = value as Partial<RuntimeWidgetPolicy>
  if (!Array.isArray(candidate.widgets)) return defaults
  const byId = new Map(defaults.widgets.map(widget => [widget.id, widget]))
  for (const widget of candidate.widgets) {
    if (widget?.id) byId.set(widget.id, { ...(byId.get(widget.id) || {}), ...widget } as RuntimeWidgetConfig)
  }
  return { safeMode: Boolean(candidate.safeMode), widgets: [...byId.values()], updatedAt: candidate.updatedAt }
}

export const loadRuntimeWidgetPolicy = async (): Promise<RuntimeWidgetPolicy> => {
  const { data: rpcValue, error: rpcError } = await supabase.rpc('bx_get_public_widget_policy')
  if (!rpcError && rpcValue) return normalizePolicy(rpcValue)

  const { data: published, error: versionError } = await supabase
    .from('bx_control_plane_versions')
    .select('payload')
    .eq('config_key', 'widgets')
    .eq('status', 'published')
    .maybeSingle()
  if (!versionError && published?.payload) return normalizePolicy(published.payload)

  const { data: legacy } = await supabase.from('bx_feature_flags').select('value').eq('key', 'admin_widget_registry').maybeSingle()
  return normalizePolicy(legacy?.value)
}

export const isRuntimeWidgetAllowed = (
  policy: RuntimeWidgetPolicy,
  widgetId: string,
  context: { plan: string; role: string; placement?: RuntimeWidgetConfig['placement'] },
): boolean => {
  const widget = policy.widgets.find(item => item.id === widgetId)
  if (!widget || !widget.enabled || widget.blockedByPlugin) return false
  if (context.placement && widget.placement !== context.placement && widget.placement !== 'global') return false
  if (policy.safeMode && widget.source !== 'internal') return false
  const isAdmin = context.role === 'admin' || context.role.startsWith('admin_') || context.role === 'product_operator'
  if (widget.audience === 'admins') return isAdmin
  if (widget.audience === 'pro') return isAdmin || ['standard', 'premium', 'pro'].includes(context.plan)
  if (widget.audience === 'free') return context.plan === 'free'
  return true
}

export const trackWidgetEvent = async (
  widgetId: string,
  eventType: 'view' | 'load_success' | 'load_error' | 'toggle_show' | 'toggle_hide',
  durationMs?: number,
): Promise<void> => {
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    const appSurface = navigator.userAgent.toLowerCase().includes('electron') ? 'desktop' : 'web'
    await supabase.from('bx_widget_events').insert({
      widget_id: widgetId,
      event_type: eventType,
      duration_ms: typeof durationMs === 'number' ? Math.max(0, Math.round(durationMs)) : null,
      app_surface: appSurface,
      metadata: {},
    })
  } catch {
    // Телеметрия не должна мешать работе приложения.
  }
}

export const defaultRuntimeWidgetPolicy = (): RuntimeWidgetPolicy => ({ ...defaults, widgets: defaults.widgets.map(widget => ({ ...widget })) })

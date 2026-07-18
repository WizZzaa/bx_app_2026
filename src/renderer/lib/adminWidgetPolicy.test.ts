import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultRuntimeWidgetPolicy,
  isRuntimeWidgetAllowed,
  loadRuntimeWidgetPolicy,
} from './adminWidgetPolicy'

const db = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  controlPlaneMaybeSingle: vi.fn(),
  legacyMaybeSingle: vi.fn(),
}))

vi.mock('./db/supabase', () => {
  const controlPlaneQuery = {
    select: vi.fn(() => controlPlaneQuery),
    eq: vi.fn(() => controlPlaneQuery),
    maybeSingle: db.controlPlaneMaybeSingle,
  }
  const legacyQuery = {
    select: vi.fn(() => legacyQuery),
    eq: vi.fn(() => legacyQuery),
    maybeSingle: db.legacyMaybeSingle,
  }

  db.from.mockImplementation((table: string) => (
    table === 'bx_control_plane_versions' ? controlPlaneQuery : legacyQuery
  ))

  return {
    supabase: {
      rpc: db.rpc,
      from: db.from,
    },
  }
})

const remotePolicy = {
  safeMode: true,
  updatedAt: '2026-07-18T12:00:00.000Z',
  widgets: [
    { id: 'currency-rates', enabled: false, placement: 'dashboard', audience: 'pro', source: 'official-api', order: 9 },
  ],
}

describe('runtime widget policy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.rpc.mockResolvedValue({ data: null, error: { message: 'RPC unavailable' } })
    db.controlPlaneMaybeSingle.mockResolvedValue({ data: null, error: { message: 'No published policy' } })
    db.legacyMaybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('loads and normalizes a successful RPC policy without querying fallbacks', async () => {
    db.rpc.mockResolvedValue({ data: remotePolicy, error: null })

    const policy = await loadRuntimeWidgetPolicy()

    expect(policy.safeMode).toBe(true)
    expect(policy.updatedAt).toBe(remotePolicy.updatedAt)
    expect(policy.widgets.find(widget => widget.id === 'currency-rates')).toMatchObject({ enabled: false, audience: 'pro', order: 9 })
    expect(policy.widgets.some(widget => widget.id === 'smart-calendar')).toBe(true)
    expect(db.from).not.toHaveBeenCalled()
  })

  it('falls back to the published control-plane policy when RPC fails', async () => {
    db.controlPlaneMaybeSingle.mockResolvedValue({ data: { payload: remotePolicy }, error: null })

    const policy = await loadRuntimeWidgetPolicy()

    expect(policy.safeMode).toBe(true)
    expect(policy.widgets.find(widget => widget.id === 'currency-rates')?.enabled).toBe(false)
    expect(db.from).toHaveBeenCalledTimes(1)
    expect(db.from).toHaveBeenCalledWith('bx_control_plane_versions')
    expect(db.legacyMaybeSingle).not.toHaveBeenCalled()
  })

  it('falls back to the legacy feature flag when newer policy sources fail', async () => {
    db.legacyMaybeSingle.mockResolvedValue({ data: { value: remotePolicy }, error: null })

    const policy = await loadRuntimeWidgetPolicy()

    expect(policy.safeMode).toBe(true)
    expect(policy.widgets.find(widget => widget.id === 'currency-rates')?.enabled).toBe(false)
    expect(db.from).toHaveBeenNthCalledWith(1, 'bx_control_plane_versions')
    expect(db.from).toHaveBeenNthCalledWith(2, 'bx_feature_flags')
  })

  it.each([
    ['invalid RPC payload', { data: { safeMode: true }, error: null }],
    ['missing payloads', null],
  ] as const)('uses defaults for %s', async (_name, rpcResult) => {
    if (rpcResult) db.rpc.mockResolvedValue(rpcResult)

    const policy = await loadRuntimeWidgetPolicy()

    expect(policy).toEqual(defaultRuntimeWidgetPolicy())
  })

  it('honours published enablement and safe mode', () => {
    const policy = defaultRuntimeWidgetPolicy()
    expect(isRuntimeWidgetAllowed(policy, 'currency-rates', { plan: 'free', role: 'user', placement: 'dashboard' })).toBe(true)
    policy.safeMode = true
    expect(isRuntimeWidgetAllowed(policy, 'currency-rates', { plan: 'free', role: 'user', placement: 'dashboard' })).toBe(false)
    expect(isRuntimeWidgetAllowed(policy, 'smart-calendar', { plan: 'free', role: 'user', placement: 'dashboard' })).toBe(true)
  })

  it('enforces audience and plugin dependency', () => {
    const policy = defaultRuntimeWidgetPolicy()
    policy.widgets.push({ id: 'private-ai', enabled: true, placement: 'dashboard', audience: 'pro', source: 'plugin', order: 20, blockedByPlugin: true })
    expect(isRuntimeWidgetAllowed(policy, 'private-ai', { plan: 'premium', role: 'user' })).toBe(false)
    policy.widgets[policy.widgets.length - 1].blockedByPlugin = false
    expect(isRuntimeWidgetAllowed(policy, 'private-ai', { plan: 'premium', role: 'user' })).toBe(true)
    expect(isRuntimeWidgetAllowed(policy, 'private-ai', { plan: 'free', role: 'user' })).toBe(false)
  })

  it('enforces placement, free/admin audiences, disabled widgets, and global placement', () => {
    const policy = defaultRuntimeWidgetPolicy()
    policy.widgets.push(
      { id: 'admin-sidebar', enabled: true, placement: 'sidebar', audience: 'admins', source: 'internal', order: 20 },
      { id: 'free-dashboard', enabled: true, placement: 'dashboard', audience: 'free', source: 'internal', order: 21 },
      { id: 'global-help', enabled: true, placement: 'global', audience: 'all', source: 'internal', order: 22 },
      { id: 'disabled-widget', enabled: false, placement: 'dashboard', audience: 'all', source: 'internal', order: 23 },
    )

    expect(isRuntimeWidgetAllowed(policy, 'admin-sidebar', { plan: 'premium', role: 'admin_support', placement: 'dashboard' })).toBe(false)
    expect(isRuntimeWidgetAllowed(policy, 'admin-sidebar', { plan: 'free', role: 'user', placement: 'sidebar' })).toBe(false)
    expect(isRuntimeWidgetAllowed(policy, 'admin-sidebar', { plan: 'free', role: 'product_operator', placement: 'sidebar' })).toBe(true)
    expect(isRuntimeWidgetAllowed(policy, 'free-dashboard', { plan: 'free', role: 'user', placement: 'dashboard' })).toBe(true)
    expect(isRuntimeWidgetAllowed(policy, 'free-dashboard', { plan: 'standard', role: 'user', placement: 'dashboard' })).toBe(false)
    expect(isRuntimeWidgetAllowed(policy, 'global-help', { plan: 'free', role: 'user', placement: 'dashboard' })).toBe(true)
    expect(isRuntimeWidgetAllowed(policy, 'disabled-widget', { plan: 'free', role: 'admin', placement: 'dashboard' })).toBe(false)
    expect(isRuntimeWidgetAllowed(policy, 'missing-widget', { plan: 'free', role: 'admin', placement: 'dashboard' })).toBe(false)
  })
})

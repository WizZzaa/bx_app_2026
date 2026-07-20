import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource-variable/geist'
import '../../shared/design/tokens.css'
import '../styles/globals.css'
import { DEFAULT_PLAN_LIMITS, PlanProvider } from '../lib/plan'
import { CompanyProvider } from '../lib/CompanyContext'
import { ToastProvider } from '../lib/ui/ToastContext'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import MobileNavigation from '../components/layout/MobileNavigation'
import type { BxEvent } from './planner/useEvents'
import { DashboardD1View, type DashboardD1ViewProps } from './DashboardD1'
import '../styles/app-shell-d1.css'

const today = '2026-07-20'
const params = new URLSearchParams(window.location.search)
const previewState = params.get('state') || 'default'
const theme = params.get('theme') || 'light'
document.documentElement.setAttribute('data-bx-design', 'd1')
document.documentElement.setAttribute('data-theme', theme)

const event = (id: string, title: string, date: string, type: BxEvent['type'] = 'task'): BxEvent => ({
  id,
  user_id: 'preview-user',
  company_id: 'preview-company',
  type,
  title,
  date,
  due_date: null,
  status: 'todo',
  priority: type === 'tax_deadline' ? 'high' : 'normal',
  tags: null,
  tax_type: type === 'tax_deadline' ? 'НДС' : null,
  kind: type === 'tax_deadline' ? 'report' : null,
  regime: null,
  note: null,
  source: type === 'tax_deadline' ? 'tax' : 'manual',
  reminder_at: null,
  assignee_id: null,
  created_at: '2026-07-19T10:00:00Z',
})

const usage: NonNullable<DashboardD1ViewProps['ai']['value']['usage']> = {
  tariffCode: 'standard',
  tariffVersion: '2026-07-19.1',
  generatedAt: '2026-07-20T10:00:00Z',
  resources: {
    ai: { limit: 30, addOn: 0, reserved: 0, consumed: 4, remaining: previewState === 'exhausted' ? 0 : 26, window: 'billing_cycle', startsAt: null, endsAt: null },
    translations: { limit: 30, addOn: 0, reserved: 0, consumed: 2, remaining: 28, window: 'billing_cycle', startsAt: null, endsAt: null },
    remoteSupportMinutes: { limit: 0, addOn: 0, reserved: 0, consumed: 0, remaining: 0, window: 'billing_cycle', startsAt: null, endsAt: null },
    storageBytes: { limit: 314_572_800, used: 2_097_152, remaining: 312_475_648, window: 'account_lifetime' },
  },
}

const props: DashboardD1ViewProps = {
  today,
  events: previewState === 'empty' ? [] : [
    event('deadline', 'Сдать расчёт по НДС', '2026-07-21', 'tax_deadline'),
    event('task-2', 'Проверить банковскую выписку', '2026-07-22'),
    event('task-3', 'Подготовить документы поставщику', '2026-07-24'),
  ],
  eventsLoading: previewState === 'loading',
  eventsError: previewState === 'permission' ? '42501 permission denied' : previewState === 'error' ? 'network timeout' : null,
  rates: {
    value: [
      { code: 'USD', name: 'Доллар США', flag: '', value: 12_500, diff: 10, date: previewState === 'stale' ? '19.07.2026' : '20.07.2026' },
      { code: 'EUR', name: 'Евро', flag: '', value: 14_200, diff: -5, date: previewState === 'stale' ? '19.07.2026' : '20.07.2026' },
    ],
    loading: previewState === 'loading',
    error: previewState === 'rates-error' ? 'CBU unavailable' : null,
    updatedAt: '2026-07-20T10:00:00Z',
  },
  ai: {
    value: { usage, lastAnswerAt: '2026-07-20T09:00:00Z' },
    loading: previewState === 'loading',
    error: previewState === 'ai-error' ? 'Usage unavailable' : null,
    updatedAt: '2026-07-20T10:00:00Z',
  },
  online: previewState !== 'offline',
  activeCompany: previewState === 'locked' ? null : {
    id: 'preview-company', user_id: 'preview-user', name: 'OOO Orient Trade', inn: '309123456', regime: 'НДС', color: null,
    is_active: true, legal_form: 'ooo', profile_details: {}, registration_date: '2025-01-01', bx_start_date: '2026-01-01',
    is_vat_payer: true, work_weekdays: [1, 2, 3, 4, 5], notification_channels: ['in_app'], preferred_language: 'ru',
    enabled_obligation_rules: [], profile_status: 'confirmed', profile_confirmed_at: '2026-01-01T00:00:00Z', profile_version: 1,
    created_at: '2025-01-01T00:00:00Z',
  },
  companyCount: 1,
  plan: previewState === 'locked' ? 'free' : 'standard',
  planLoading: previewState === 'loading',
  limits: previewState === 'locked' ? DEFAULT_PLAN_LIMITS.free : DEFAULT_PLAN_LIMITS.standard,
  onNavigate: (route, state) => {
    const output = document.getElementById('preview-output')
    if (output) output.textContent = `${route}${state ? ` ${JSON.stringify(state)}` : ''}`
  },
  onRetryEvents: () => undefined,
  onRetryRates: () => undefined,
  onRetryAi: () => undefined,
  onCreateCompany: () => undefined,
  onEditCompany: () => undefined,
}

function WorkspacePreview() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <ToastProvider>
      <CompanyProvider>
        <PlanProvider>
          <div className="bx-app-shell relative flex h-screen w-screen flex-col overflow-hidden bg-bx-bg text-bx-text">
            <div className="bx-app-shell__aura bx-app-shell__aura--start" aria-hidden="true" />
            <div className="bx-app-shell__aura bx-app-shell__aura--end" aria-hidden="true" />
            <div className="bx-app-shell__body relative z-10 flex min-h-0 flex-1 overflow-hidden">
              <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} webResponsive />
              <div className="bx-app-shell__workspace flex min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar onToggleMenu={() => setCollapsed(value => !value)} menuExpanded={!collapsed} previewMode />
                <main className="bx-app-shell__content flex min-h-0 flex-1 overflow-hidden pb-16 md:pb-0" aria-label="Основное содержимое">
                  <DashboardD1View {...props} />
                </main>
              </div>
            </div>
            <MobileNavigation />
          </div>
        </PlanProvider>
      </CompanyProvider>
    </ToastProvider>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('Preview root is missing')
createRoot(root).render(
  <React.StrictMode>
    <HashRouter>
      <WorkspacePreview />
      <output id="preview-output" className="sr-only" aria-live="polite" />
    </HashRouter>
  </React.StrictMode>,
)

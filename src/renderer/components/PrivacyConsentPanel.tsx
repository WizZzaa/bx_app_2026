import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/db/supabase'
import { useToast } from '../lib/ui/ToastContext'
import Icon from '../lib/ui/Icon'

type ConsentType = 'analytics' | 'marketing' | 'ai_improvement' | 'cloud_sync' | 'ecp_metadata_sync' | 'support_diagnostics'
type ConsentState = Partial<Record<ConsentType, { granted: boolean; occurred_at: string }>>

const options: Array<{ type: ConsentType; title: string; description: string; icon: string }> = [
  { type: 'analytics', title: 'Аналитика продукта', description: 'Обезличенные события использования без телефонов, Telegram ID, документов и текстов вопросов.', icon: 'chart' },
  { type: 'marketing', title: 'Полезные предложения', description: 'Новости продукта и предложения. Критичные системные сообщения от этого выбора не зависят.', icon: 'bell' },
  { type: 'ai_improvement', title: 'Улучшение базы знаний', description: 'Только автоматически обезличенные темы вопросов. Файлы и переводы не передаются.', icon: 'ai' },
  { type: 'cloud_sync', title: 'Облачная синхронизация', description: 'Разрешение синхронизировать выбранные рабочие типы данных в пределах тарифа.', icon: 'globe' },
  { type: 'ecp_metadata_sync', title: 'Метаданные ЭЦП', description: 'Только название, владелец, ИНН, отпечаток и сроки. Файл ключа и пароль не отправляются никогда.', icon: 'ecp' },
  { type: 'support_diagnostics', title: 'Диагностика для поддержки', description: 'Версия BX, ОС, раздел и безопасные коды ошибок — только после вашего согласия.', icon: 'shield' },
]

export default function PrivacyConsentPanel() {
  const toast = useToast()
  const [state, setState] = useState<ConsentState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<ConsentType | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('bx_get_my_consent_state')
    if (error) { setLoading(false); return }
    const next: ConsentState = {}
    for (const row of (data || []) as Array<{ consent_type: ConsentType; granted: boolean; occurred_at: string }>) next[row.consent_type] = { granted: row.granted, occurred_at: row.occurred_at }
    setState(next)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const toggle = async (type: ConsentType) => {
    const granted = !state[type]?.granted
    setSaving(type)
    const source = typeof window !== 'undefined' && window.bx ? 'desktop' : 'web'
    const { error } = await supabase.rpc('bx_record_my_consent', { p_consent_type: type, p_granted: granted, p_source: source, p_locale: 'ru', p_document_id: null, p_evidence: {} })
    setSaving(null)
    if (error) { toast.error('Не удалось сохранить выбор приватности'); return }
    await load()
    toast.success(granted ? 'Согласие сохранено' : 'Согласие отозвано')
  }

  return <div className="space-y-5">
    <section className="rounded-3xl border border-bx-border bg-bx-surface p-5 shadow-sm"><div className="flex items-start gap-4"><span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><Icon name="shield" className="h-6 w-6" /></span><div><h3 className="text-base font-black">Согласия хранятся как история</h3><p className="mt-1 text-xs leading-relaxed text-bx-muted">Каждое включение и отзыв записываются отдельным событием с датой и поверхностью BX. Старые решения не перезаписываются.</p></div></div></section>
    <section className="overflow-hidden rounded-3xl border border-bx-border bg-bx-surface shadow-sm">{options.map(option => { const current = state[option.type]; const checked = !!current?.granted; return <div key={option.type} className="flex flex-col gap-3 border-b border-bx-border/70 px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-bx-border bg-bx-surface-2 text-bx-muted"><Icon name={option.icon} className="h-4 w-4" /></span><div><p className="text-sm font-bold">{option.title}</p><p className="mt-1 max-w-2xl text-xs leading-relaxed text-bx-muted">{option.description}</p>{current?.occurred_at && <p className="mt-1 text-[10px] text-bx-muted">Последнее решение: {new Date(current.occurred_at).toLocaleString('ru-RU')}</p>}</div></div><button type="button" onClick={() => void toggle(option.type)} disabled={loading || saving === option.type} role="switch" aria-checked={checked} aria-label={option.title} className={`relative ml-12 h-7 w-12 flex-shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:ml-0 ${checked ? 'border-blue-600 bg-blue-600' : 'border-bx-border-2 bg-bx-bg'} disabled:opacity-50`}><span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} /></button></div> })}</section>
    <p className="px-2 text-[11px] leading-relaxed text-bx-muted">Необходимые данные авторизации, языка, безопасности и учёта лимитов отключить нельзя. Рекламные cookie BX не использует.</p>
  </div>
}

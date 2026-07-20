import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TARIFF_MATRIX } from '../../shared/tariffs'
import Icon from '../lib/ui/Icon'
import Button from './ui/Button'

const formatUzs = (value: number | null) => value === null ? '—' : `${value.toLocaleString('ru-RU')} сум`

const PAID_PERKS = [
  `${TARIFF_MATRIX.standard.companies} компания на Standard или до ${TARIFF_MATRIX.premium.companies} на Premium`,
  `${TARIFF_MATRIX.standard.ai.amount} AI-запросов на Standard или ${TARIFF_MATRIX.premium.ai.amount} на Premium за цикл`,
  `${TARIFF_MATRIX.standard.devicesPerUser} устройства на пользователя`,
  `Standard — ${formatUzs(TARIFF_MATRIX.standard.priceUzs.month)}/мес., Premium — ${formatUzs(TARIFF_MATRIX.premium.priceUzs.month)}/мес.`,
]

export default function PaywallModal({ feature, onClose }: { feature: string; onClose: () => void }) {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    primaryRef.current?.focus()
    return () => previousFocus?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
    if (!controls?.length) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="paywall-title" aria-describedby="paywall-description" onKeyDown={handleKeyDown} className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-bx-border-2 bg-bx-surface shadow-2xl">
        <div className="border-b border-bx-border px-6 py-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-bx-accent" aria-hidden="true"><Icon name="shield" className="h-5 w-5" /></div>
          <p className="mb-1 text-sm font-semibold text-bx-accent">Доступно по подписке</p>
          <h2 id="paywall-title" className="text-xl font-bold leading-tight text-bx-text">{feature}</h2>
          <p id="paywall-description" className="mt-2 text-sm leading-relaxed text-bx-muted">Ваши данные сохранятся. Выберите Standard или Premium, чтобы продолжить работу с этой возможностью.</p>
        </div>
        <ul className="space-y-3 px-6 py-5" aria-label="Возможности платных тарифов">
          {PAID_PERKS.map(perk => <li key={perk} className="flex items-start gap-3 text-sm text-bx-text"><Icon name="check" className="mt-0.5 h-4 w-4 flex-none text-green-700 dark:text-green-400" /><span>{perk}</span></li>)}
        </ul>
        <div className="flex flex-col-reverse gap-2 border-t border-bx-border px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>Продолжить в Free</Button>
          <Button ref={primaryRef} onClick={() => { onClose(); navigate('/account') }}>Сравнить тарифы</Button>
        </div>
      </div>
    </div>
  )
}

import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TARIFF_MATRIX } from '../../shared/tariffs'
import Icon from '../lib/ui/Icon'
import Button from './ui/Button'
import { Dialog } from './ui/Dialog'
import './system-modals-a9.css'

const formatUzs = (value: number | null) => value === null ? '—' : `${value.toLocaleString('ru-RU')} сум`

const PAID_PERKS = [
  `${TARIFF_MATRIX.standard.companies} компания на Standard или до ${TARIFF_MATRIX.premium.companies} на Premium`,
  `${TARIFF_MATRIX.standard.ai.amount} AI-запросов на Standard или ${TARIFF_MATRIX.premium.ai.amount} на Premium за цикл`,
  `${TARIFF_MATRIX.standard.devicesPerUser} устройства на пользователя`,
  `Standard — ${formatUzs(TARIFF_MATRIX.standard.priceUzs.month)}/мес., Premium — ${formatUzs(TARIFF_MATRIX.premium.priceUzs.month)}/мес.`,
]

export default function PaywallModal({ feature, onClose }: { feature: string; onClose: () => void }) {
  const navigate = useNavigate()
  const primaryRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog
      open
      onClose={onClose}
      title={feature}
      description="Ваши данные сохранятся. Сравните тарифы, когда будете готовы продолжить."
      closeLabel="Закрыть предложение подписки"
      initialFocusRef={primaryRef}
      className="bx-a9-paywall"
      footer={(
        <div className="bx-a9-system-actions">
          <Button variant="secondary" onClick={onClose}>Остаться на Free</Button>
          <Button ref={primaryRef} onClick={() => { onClose(); navigate('/account') }}>Сравнить тарифы</Button>
        </div>
      )}
    >
      <div className="bx-a9-paywall__intro">
        <span className="bx-a9-system-icon" aria-hidden="true"><Icon name="shield" className="h-5 w-5" /></span>
        <div>
          <p className="bx-a9-system-eyebrow">Доступно по подписке</p>
          <p>Оплата сейчас не списывается — на странице тарифа можно спокойно проверить условия.</p>
        </div>
      </div>
      <ul className="bx-a9-paywall__perks" aria-label="Возможности платных тарифов">
        {PAID_PERKS.map(perk => (
          <li key={perk}>
            <Icon name="check" className="h-4 w-4" />
            <span>{perk}</span>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}

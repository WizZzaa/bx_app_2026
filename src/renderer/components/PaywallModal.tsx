import React from 'react'
import { useNavigate } from 'react-router-dom'

// Модалка «Доступно в Pro» — единая точка апселла.

const PRO_PERKS = [
  'Мультикомпания — ведите всех клиентов в одном месте',
  'Безлимитные доски Планировщика с облачной синхронизацией',
  'Контроль оплат: дебиторка, кредиторка, напоминания',
  'AI-Консультант без лимитов + живой специалист',
  'Все шаблоны документов и свои собственные',
  'Проверка ИНН без ограничений',
]

export default function PaywallModal({ feature, onClose }: { feature: string; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#141820] border border-[#2a3447] rounded-2xl w-[440px] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600/25 via-[#141b2e] to-transparent px-6 py-5 border-b border-[#1e2535]">
          <p className="text-[11px] text-blue-300/80 uppercase tracking-widest font-semibold mb-1">Тариф Pro</p>
          <h2 className="text-lg font-bold text-white leading-snug">{feature}</h2>
          <p className="text-xs text-slate-400 mt-1">Эта возможность доступна на тарифе Pro.</p>
        </div>
        <div className="px-6 py-4">
          <ul className="space-y-2">
            {PRO_PERKS.map(p => (
              <li key={p} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#1e2535]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Позже
          </button>
          <button
            onClick={() => { onClose(); navigate('/settings') }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
            Посмотреть тарифы
          </button>
        </div>
      </div>
    </div>
  )
}

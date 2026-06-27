import React, { useState, useEffect } from 'react'
import { getConflicts, resolveConflict } from '../lib/db/syncConflictResolver'
import type { SyncConflict } from '../lib/db/localDb'
import Button from './ui/Button'

interface ConflictModalProps {
  isOpen: boolean
  onClose: () => void
  onResolved: () => void
}

export default function ConflictModal({ isOpen, onClose, onResolved }: ConflictModalProps) {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const [customMerge, setCustomMerge] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const load = async () => {
    const list = await getConflicts()
    setConflicts(list)
    setActiveIdx(0)
    setCustomMerge(null)
  }

  useEffect(() => {
    if (isOpen) {
      load()
    }
  }, [isOpen])

  if (!isOpen || conflicts.length === 0) {
    return null
  }

  const current = conflicts[activeIdx]
  const isTx = current.entity === 'transactions'

  const handleChooseLocal = async () => {
    setLoading(true)
    const success = await resolveConflict(current.id, 'local')
    if (success) {
      onResolved()
      await load()
    }
    setLoading(false)
  }

  const handleChooseServer = async () => {
    setLoading(true)
    const success = await resolveConflict(current.id, 'server')
    if (success) {
      onResolved()
      await load()
    }
    setLoading(false)
  }

  const handleChooseMerge = async () => {
    if (!customMerge) return
    setLoading(true)
    const success = await resolveConflict(current.id, 'merge', customMerge)
    if (success) {
      onResolved()
      await load()
    }
    setLoading(false)
  }

  const handleFieldChange = (field: string, val: any) => {
    setCustomMerge((prev: any) => {
      const base = prev || { ...current.localData }
      return { ...base, [field]: val }
    })
  }

  const getMergeValue = (field: string) => {
    if (customMerge && customMerge[field] !== undefined) {
      return customMerge[field]
    }
    return current.localData[field]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Разрешение конфликтов">
      <div className="bg-[#141820] border border-[#2a3447] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-[#1e2535] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Обнаружены конфликты синхронизации</h2>
            <p className="text-xs text-slate-500 mt-0.5">Данные были изменены и локально, и на сервере. Выберите правильную версию.</p>
          </div>
          <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full font-semibold">
            Конфликтов: {conflicts.length}
          </span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Левый список конфликтов */}
          <aside className="w-56 border-r border-[#1e2535] overflow-y-auto bg-[#0f1117] p-2 space-y-1">
            {conflicts.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setActiveIdx(i); setCustomMerge(null); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                  activeIdx === i ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20' : 'text-slate-400 hover:bg-[#1e2535] hover:text-slate-200'
                }`}
              >
                <p className="truncate">
                  {c.entity === 'transactions' 
                    ? `Транзакция от ${c.localData.date}` 
                    : `Сотрудник: ${c.localData.full_name}`}
                </p>
                <p className="text-[10px] text-slate-600 truncate mt-0.5">ID: {c.targetId.substring(0, 8)}</p>
              </button>
            ))}
          </aside>

          {/* Правая панель сравнения */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-400 pb-2 border-b border-[#1e2535]">
              <div>ПОЛЕ</div>
              <div>ЛОКАЛЬНО (ВАШИ ИЗМЕНЕНИЯ)</div>
              <div>НА СЕРВЕРЕ (ОБЛАКО)</div>
            </div>

            {/* Поля транзакции */}
            {isTx && (
              <div className="space-y-4">
                <CompareFieldRow label="Сумма" field="amount" localVal={current.localData.amount} serverVal={current.serverData.amount} onMerge={handleFieldChange} mergeVal={getMergeValue('amount')} />
                <CompareFieldRow label="Тип" field="type" localVal={current.localData.type} serverVal={current.serverData.type} onMerge={handleFieldChange} mergeVal={getMergeValue('type')} />
                <CompareFieldRow label="Дата" field="date" localVal={current.localData.date} serverVal={current.serverData.date} onMerge={handleFieldChange} mergeVal={getMergeValue('date')} />
                <CompareFieldRow label="Категория" field="category" localVal={current.localData.category} serverVal={current.serverData.category} onMerge={handleFieldChange} mergeVal={getMergeValue('category')} />
                <CompareFieldRow label="Контрагент" field="counterparty" localVal={current.localData.counterparty} serverVal={current.serverData.counterparty} onMerge={handleFieldChange} mergeVal={getMergeValue('counterparty')} />
                <CompareFieldRow label="Описание" field="description" localVal={current.localData.description} serverVal={current.serverData.description} onMerge={handleFieldChange} mergeVal={getMergeValue('description')} />
              </div>
            )}

            {/* Поля сотрудника */}
            {!isTx && (
              <div className="space-y-4">
                <CompareFieldRow label="ФИО" field="full_name" localVal={current.localData.full_name} serverVal={current.serverData.full_name} onMerge={handleFieldChange} mergeVal={getMergeValue('full_name')} />
                <CompareFieldRow label="Должность" field="position" localVal={current.localData.position} serverVal={current.serverData.position} onMerge={handleFieldChange} mergeVal={getMergeValue('position')} />
                <CompareFieldRow label="Оклад" field="salary" localVal={current.localData.salary} serverVal={current.serverData.salary} onMerge={handleFieldChange} mergeVal={getMergeValue('salary')} />
                <CompareFieldRow label="Телефон" field="phone" localVal={current.localData.phone} serverVal={current.serverData.phone} onMerge={handleFieldChange} mergeVal={getMergeValue('phone')} />
                <CompareFieldRow label="Тип занятости" field="employment_type" localVal={current.localData.employment_type} serverVal={current.serverData.employment_type} onMerge={handleFieldChange} mergeVal={getMergeValue('employment_type')} />
              </div>
            )}

            <div className="pt-4 border-t border-[#1e2535] flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleChooseLocal} loading={loading}>
                  Использовать локальную
                </Button>
                <Button variant="ghost" onClick={handleChooseServer} loading={loading}>
                  Использовать серверную
                </Button>
              </div>

              {customMerge && (
                <Button variant="primary" onClick={handleChooseMerge} loading={loading}>
                  Применить объединенную
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Подвал */}
        <div className="px-6 py-4 bg-[#0f1117] border-t border-[#1e2535] flex justify-end gap-3 flex-shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  )
}

interface CompareFieldRowProps {
  label: string
  field: string
  localVal: any
  serverVal: any
  mergeVal: any
  onMerge: (field: string, val: any) => void
}

const CompareFieldRow = ({ label, field, localVal, serverVal, mergeVal, onMerge }: CompareFieldRowProps) => {
  const isDiff = localVal !== serverVal
  return (
    <div className={`grid grid-cols-3 gap-4 items-center py-2.5 rounded-lg px-2 text-xs transition-colors ${
      isDiff ? 'bg-amber-500/5' : ''
    }`}>
      <div className="font-medium text-slate-400">{label}</div>
      <button
        onClick={() => onMerge(field, localVal)}
        className={`text-left p-2 rounded border truncate ${
          mergeVal === localVal 
            ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 font-medium' 
            : 'bg-[#181d28] border-slate-700 hover:border-slate-500 text-slate-300'
        }`}
      >
        {String(localVal ?? '—')}
      </button>
      <button
        onClick={() => onMerge(field, serverVal)}
        className={`text-left p-2 rounded border truncate ${
          mergeVal === serverVal 
            ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 font-medium' 
            : 'bg-[#181d28] border-slate-700 hover:border-slate-500 text-slate-300'
        }`}
      >
        {String(serverVal ?? '—')}
      </button>
    </div>
  )
}

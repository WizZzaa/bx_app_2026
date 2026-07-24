import React, { useState, useEffect } from 'react'
import { getConflicts, resolveConflict } from '../lib/db/syncConflictResolver'
import type { SyncConflict, SyncEntityData } from '../lib/db/localDb'
import Button from './ui/Button'
import { Dialog } from './ui/Dialog'
import './system-modals-a9.css'

interface ConflictModalProps {
  isOpen: boolean
  onClose: () => void
  onResolved: () => void
}

export default function ConflictModal({ isOpen, onClose, onResolved }: ConflictModalProps) {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const [customMerge, setCustomMerge] = useState<SyncEntityData | null>(null)
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

  const handleFieldChange = (field: string, val: unknown) => {
    setCustomMerge((prev) => {
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
    <Dialog
      open
      onClose={loading ? () => undefined : onClose}
      title="Разрешить конфликты синхронизации"
      description="Локальная и облачная версии изменились независимо. Выберите значение для каждого поля — BX ничего не перезапишет без вашего действия."
      closeLabel="Закрыть разрешение конфликтов"
      className="bx-a9-conflict"
      footer={<div className="bx-a9-system-actions"><Button variant="secondary" disabled={loading} onClick={onClose}>Закрыть</Button></div>}
    >
      <div className="bx-a9-conflict__summary">
        <span>Осталось конфликтов</span>
        <strong>{conflicts.length}</strong>
      </div>

      <div className="bx-a9-conflict__workspace">
          <aside className="bx-a9-conflict__list" aria-label="Конфликтующие записи">
            {conflicts.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setActiveIdx(i); setCustomMerge(null); }}
                aria-pressed={activeIdx === i}
                className="bx-a9-conflict__record"
              >
                <span>
                  {c.entity === 'transactions' 
                    ? `Транзакция от ${c.localData.date}` 
                    : `Сотрудник: ${c.localData.full_name}`}
                </span>
                <small>ID: {c.targetId.substring(0, 8)}</small>
              </button>
            ))}
          </aside>

          <section className="bx-a9-conflict__comparison" aria-label="Сравнение версий">
            <div className="bx-a9-conflict__columns" aria-hidden="true">
              <span>Поле</span>
              <span>На устройстве</span>
              <span>В облаке</span>
            </div>

            {isTx && (
              <div className="bx-a9-conflict__fields">
                <CompareFieldRow label="Сумма" field="amount" localVal={current.localData.amount} serverVal={current.serverData.amount} onMerge={handleFieldChange} mergeVal={getMergeValue('amount')} />
                <CompareFieldRow label="Тип" field="type" localVal={current.localData.type} serverVal={current.serverData.type} onMerge={handleFieldChange} mergeVal={getMergeValue('type')} />
                <CompareFieldRow label="Дата" field="date" localVal={current.localData.date} serverVal={current.serverData.date} onMerge={handleFieldChange} mergeVal={getMergeValue('date')} />
                <CompareFieldRow label="Категория" field="category" localVal={current.localData.category} serverVal={current.serverData.category} onMerge={handleFieldChange} mergeVal={getMergeValue('category')} />
                <CompareFieldRow label="Контрагент" field="counterparty" localVal={current.localData.counterparty} serverVal={current.serverData.counterparty} onMerge={handleFieldChange} mergeVal={getMergeValue('counterparty')} />
                <CompareFieldRow label="Описание" field="description" localVal={current.localData.description} serverVal={current.serverData.description} onMerge={handleFieldChange} mergeVal={getMergeValue('description')} />
              </div>
            )}

            {!isTx && (
              <div className="bx-a9-conflict__fields">
                <CompareFieldRow label="ФИО" field="full_name" localVal={current.localData.full_name} serverVal={current.serverData.full_name} onMerge={handleFieldChange} mergeVal={getMergeValue('full_name')} />
                <CompareFieldRow label="Должность" field="position" localVal={current.localData.position} serverVal={current.serverData.position} onMerge={handleFieldChange} mergeVal={getMergeValue('position')} />
                <CompareFieldRow label="Оклад" field="salary" localVal={current.localData.salary} serverVal={current.serverData.salary} onMerge={handleFieldChange} mergeVal={getMergeValue('salary')} />
                <CompareFieldRow label="Телефон" field="phone" localVal={current.localData.phone} serverVal={current.serverData.phone} onMerge={handleFieldChange} mergeVal={getMergeValue('phone')} />
                <CompareFieldRow label="Тип занятости" field="employment_type" localVal={current.localData.employment_type} serverVal={current.serverData.employment_type} onMerge={handleFieldChange} mergeVal={getMergeValue('employment_type')} />
              </div>
            )}

            <div className="bx-a9-conflict__actions">
              <div>
                <Button variant="secondary" onClick={handleChooseLocal} loading={loading}>
                  Всё с устройства
                </Button>
                <Button variant="secondary" onClick={handleChooseServer} loading={loading}>
                  Всё из облака
                </Button>
              </div>

              {customMerge && (
                <Button variant="primary" onClick={handleChooseMerge} loading={loading}>
                  Применить выбранные поля
                </Button>
              )}
            </div>
          </section>
        </div>
    </Dialog>
  )
}

interface CompareFieldRowProps {
  label: string
  field: string
  localVal: unknown
  serverVal: unknown
  mergeVal: unknown
  onMerge: (field: string, val: unknown) => void
}

const CompareFieldRow = ({ label, field, localVal, serverVal, mergeVal, onMerge }: CompareFieldRowProps) => {
  const isDiff = localVal !== serverVal
  return (
    <div className="bx-a9-conflict__field" data-different={isDiff || undefined}>
      <div className="bx-a9-conflict__field-label">{label}</div>
      <button
        type="button"
        onClick={() => onMerge(field, localVal)}
        aria-pressed={mergeVal === localVal}
        className="bx-a9-conflict__value"
      >
        <small>На устройстве</small>
        <span title={String(localVal ?? '—')}>{String(localVal ?? '—')}</span>
      </button>
      <button
        type="button"
        onClick={() => onMerge(field, serverVal)}
        aria-pressed={mergeVal === serverVal}
        className="bx-a9-conflict__value"
      >
        <small>В облаке</small>
        <span title={String(serverVal ?? '—')}>{String(serverVal ?? '—')}</span>
      </button>
    </div>
  )
}

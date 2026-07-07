import React, { useState, useEffect } from 'react'
import { validateInn, validateBankAccount, getBankNameByMfo } from '../../lib/validation'

interface Requisites {
  id: string;
  name: string;
  inn: string;
  okonx: string;
  okpo: string;
  account: string;
  mfo: string;
  bank: string;
  address: string;
  director: string;
  phone: string;
}

const STORAGE_KEY = 'bx_company_requisites';

function loadReqs(): Requisites[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveReqs(list: Requisites[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const EMPTY: Omit<Requisites, 'id'> = {
  name: '', inn: '', okonx: '', okpo: '', account: '', mfo: '', bank: '', address: '', director: '', phone: '',
};

export default function CompanyRequisites() {
  const [list, setList] = useState<Requisites[]>(loadReqs)
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Omit<Requisites, 'id'>>(EMPTY)
  const [copied, setCopied] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const selectedReq = list.find(r => r.id === selected) ?? null

  useEffect(() => { saveReqs(list); }, [list])

  const startNew = () => {
    setForm(EMPTY)
    setSelected(null)
    setEditing(true)
    setValidationErrors({})
  }

  const startEdit = (r: Requisites) => {
    const { id, ...rest } = r
    setForm(rest)
    setSelected(id)
    setEditing(true)
    setValidationErrors({})
  }

  const handleFieldChange = (key: keyof Omit<Requisites, 'id'>, val: string) => {
    setForm(p => {
      const updated = { ...p, [key]: val }
      if (key === 'mfo') {
        const bankName = getBankNameByMfo(val)
        if (bankName) {
          updated.bank = bankName
        }
      }
      return updated
    })
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const save = () => {
    if (!form.name.trim()) return

    const errors: Record<string, string> = {}
    if (form.inn && !validateInn(form.inn)) {
      errors.inn = 'Невалидный ИНН Узбекистана (ошибка контрольной цифры)'
    }
    if (form.account && !validateBankAccount(form.account)) {
      errors.account = 'Расчетный счет должен состоять ровно из 20 цифр'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors({})
    if (selected) {
      setList(l => l.map(r => r.id === selected ? { ...form, id: selected } : r))
    } else {
      const id = Date.now().toString()
      setList(l => [...l, { ...form, id }])
      setSelected(id)
    }
    setEditing(false)
  }

  const remove = (id: string) => {
    setList(l => l.filter(r => r.id !== id))
    if (selected === id) { setSelected(null); setEditing(false); }
  }

  function copyField(label: string, value: string) {
    navigator.clipboard.writeText(value).catch(() => { void 0 })
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  function copyAll(r: Requisites) {
    const text = [
      r.name && `Наименование: ${r.name}`,
      r.inn && `ИНН: ${r.inn}`,
      r.okonx && `ОКОНХ: ${r.okonx}`,
      r.okpo && `ОКПО: ${r.okpo}`,
      r.account && `Р/счёт: ${r.account}`,
      r.mfo && `МФО: ${r.mfo}`,
      r.bank && `Банк: ${r.bank}`,
      r.director && `Директор: ${r.director}`,
      r.address && `Адрес: ${r.address}`,
      r.phone && `Тел.: ${r.phone}`,
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text).catch(() => { void 0 })
    setCopied('all')
    setTimeout(() => setCopied(null), 1500)
  }

  const filtered = list.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.inn.includes(search)
  );

  const fields: { key: keyof Omit<Requisites, 'id'>; label: string; placeholder: string }[] = [
    { key: 'name',     label: 'Наименование организации', placeholder: 'ООО «Рога и копыта»' },
    { key: 'inn',      label: 'ИНН',                      placeholder: '123456789' },
    { key: 'okonx',    label: 'ОКОНХ',                    placeholder: '71100' },
    { key: 'okpo',     label: 'ОКПО',                     placeholder: '123456' },
    { key: 'account',  label: 'Расчётный счёт (р/с)',      placeholder: '20208000000000000000' },
    { key: 'mfo',      label: 'МФО банка',                 placeholder: '00455' },
    { key: 'bank',     label: 'Банк',                      placeholder: 'АКБ «Асакабанк»' },
    { key: 'director', label: 'Директор',                  placeholder: 'Иванов Иван Иванович' },
    { key: 'address',  label: 'Юридический адрес',         placeholder: 'г. Ташкент, ул. Навои, д. 1' },
    { key: 'phone',    label: 'Телефон',                   placeholder: '+998 90 000-00-00' },
  ];

  return (
    <div className="flex gap-0 h-full -m-1">
      {/* Список */}
      <div className="w-52 flex-shrink-0 border-r border-bx-border flex flex-col">
        <div className="p-3 border-b border-bx-border">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full bg-bx-bg text-bx-text px-2.5 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-xs"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(r => (
            <button key={r.id} onClick={() => { setSelected(r.id); setEditing(false); }}
              className={`w-full text-left px-3 py-2.5 border-b border-bx-border transition-colors ${selected === r.id && !editing ? 'bg-blue-600/20 text-blue-400' : 'text-bx-muted hover:bg-bx-surface-2 hover:text-bx-text'}`}>
              <p className="text-xs font-medium truncate">{r.name || 'Без названия'}</p>
              {r.inn && <p className="text-[10px] text-bx-muted mt-0.5">ИНН {r.inn}</p>}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-bx-muted text-center py-6 px-3">
              {list.length === 0 ? 'Нет реквизитов' : 'Не найдено'}
            </p>
          )}
        </div>
        <div className="p-3 border-t border-bx-border">
          <button onClick={startNew}
            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
            + Добавить
          </button>
        </div>
      </div>

      {/* Содержимое */}
      <div className="flex-1 overflow-y-auto p-4">
        {editing ? (
          <div className="space-y-3 max-w-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-bx-text">{selected ? 'Редактировать' : 'Новые реквизиты'}</p>
              <button onClick={() => setEditing(false)} className="text-xs text-bx-muted hover:text-bx-muted">✕ Отмена</button>
            </div>
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs text-bx-muted mb-1">{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`w-full bg-bx-bg text-bx-text px-3 py-2 rounded-lg border ${validationErrors[f.key] ? 'border-red-500/50 focus:border-red-500' : 'border-bx-border-2 focus:border-blue-500/50'} focus:outline-none text-sm`}
                />
                {validationErrors[f.key] && (
                  <p className="text-red-400 text-[10px] mt-1">{validationErrors[f.key]}</p>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={save}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                Сохранить
              </button>
              {selected && (
                <button onClick={() => { remove(selected!); setEditing(false); }}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors">
                  Удалить
                </button>
              )}
            </div>
          </div>
        ) : selectedReq ? (
          <div className="space-y-3 max-w-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-bx-text truncate">{selectedReq.name}</p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => copyAll(selectedReq)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${copied === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}>
                  {copied === 'all' ? '✓ Скопировано' : 'Копировать всё'}
                </button>
                <button onClick={() => startEdit(selectedReq)}
                  className="text-xs px-2.5 py-1 bg-bx-surface-2 text-bx-muted hover:text-bx-text rounded-lg transition-colors">
                  Изменить
                </button>
              </div>
            </div>
            <div className="bg-bx-bg rounded-xl border border-bx-border overflow-hidden divide-y divide-bx-border">
              {fields.filter(f => selectedReq[f.key]).map(f => (
                <div key={f.key} className="flex items-center justify-between px-4 py-2.5 group">
                  <div className="min-w-0">
                    <p className="text-[10px] text-bx-muted">{f.label}</p>
                    <p className="text-sm text-bx-text truncate">{selectedReq[f.key]}</p>
                  </div>
                  <button
                    onClick={() => copyField(f.key, selectedReq[f.key])}
                    className={`ml-3 flex-shrink-0 text-[10px] px-2 py-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${copied === f.key ? 'bg-emerald-500/20 text-emerald-400' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}>
                    {copied === f.key ? '✓' : 'Копировать'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-3xl mb-3">🏢</p>
            <p className="text-sm text-bx-muted">Выберите компанию или добавьте новую</p>
            <p className="text-xs text-bx-muted mt-1">Реквизиты хранятся локально на вашем ПК</p>
          </div>
        )}
      </div>
    </div>
  );
}

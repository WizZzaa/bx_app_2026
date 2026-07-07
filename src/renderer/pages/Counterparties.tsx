import React, { useState, useMemo } from 'react'
import { useCounterparties, type BxCounterparty, type NewCounterparty } from '../lib/db/useCounterparties'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'
import { validateInn, validateBankAccount, getBankNameByMfo } from '../lib/validation'
import Icon from '../lib/ui/Icon'
import CompanyRequisites from './tools/CompanyRequisites'

type OrgTab = 'counterparties' | 'mine'
const ORG_TAB_KEY = 'bx_org_tab'

const calculateRiskScore = (cp: NewCounterparty | BxCounterparty) => {
  let score = 0
  const reasons: string[] = []

  if (!cp.inn || cp.inn.length !== 9 || !validateInn(cp.inn)) {
    score += 40
    reasons.push('Неверный или незаполненный ИНН')
  } else {
    const firstDigit = cp.inn[0]
    if (firstDigit === '4' || firstDigit === '5' || firstDigit === '6') {
      score += 10
      reasons.push('Контрагент является ИП / физическим лицом')
    }
  }

  if (!cp.bank_account) {
    score += 20
    reasons.push('Отсутствует расчетный счет')
  } else if (cp.bank_account.length !== 20 || !validateBankAccount(cp.bank_account)) {
    score += 15
    reasons.push('Некорректный формат расчетного счета')
  }

  if (!cp.mfo) {
    score += 15
    reasons.push('Отсутствует МФО банка')
  }

  if (!cp.phone) {
    score += 10
    reasons.push('Не указан номер телефона')
  }

  if (!cp.address) {
    score += 10
    reasons.push('Не указан юридический адрес')
  }

  return { score, reasons }
}

const EMPTY_CP: NewCounterparty = {
  company_id: null,
  name: '',
  inn: '',
  mfo: '',
  bank_name: '',
  bank_account: '',
  phone: '',
  address: ''
}

const inputCls = 'w-full bg-bx-bg text-bx-text px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm'

export default function Counterparties() {
  const { active } = useCompany()
  const { counterparties, add, update, remove } = useCounterparties(active?.id ?? null)
  const toast = useToast()

  const [orgTab, setOrgTabRaw] = useState<OrgTab>(() =>
    localStorage.getItem(ORG_TAB_KEY) === 'mine' ? 'mine' : 'counterparties')
  const setOrgTab = (t: OrgTab) => { setOrgTabRaw(t); localStorage.setItem(ORG_TAB_KEY, t) }

  const [activeId, setActiveId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<NewCounterparty>(EMPTY_CP)
  const [confirmDel, setConfirmDel] = useState(false)

  // Ошибки валидации
  const [innError, setInnError] = useState(false)
  const [accountError, setAccountError] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return counterparties
    const q = search.toLowerCase()
    return counterparties.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.inn.includes(q) || 
      (c.bank_name || '').toLowerCase().includes(q)
    )
  }, [counterparties, search])

  const current = activeId ? (counterparties.find(c => c.id === activeId) ?? null) : null
  const editing = creating || Boolean(current)
  const data = creating ? form : (current ? toForm(current) : EMPTY_CP)

  function toForm(c: BxCounterparty): NewCounterparty {
    return {
      company_id: c.company_id,
      name: c.name,
      inn: c.inn,
      mfo: c.mfo || '',
      bank_name: c.bank_name || '',
      bank_account: c.bank_account || '',
      phone: c.phone || '',
      address: c.address || ''
    }
  }

  const openNew = () => {
    setCreating(true)
    setActiveId(null)
    setForm({ ...EMPTY_CP, company_id: active?.id ?? null })
    setConfirmDel(false)
    setInnError(false)
    setAccountError(false)
  }

  const openCp = (c: BxCounterparty) => {
    setCreating(false)
    setActiveId(c.id)
    setConfirmDel(false)
    setInnError(false)
    setAccountError(false)
  }

  const handleFieldChange = (key: keyof NewCounterparty, value: string) => {
    let nextVal = value

    if (key === 'inn') {
      nextVal = value.replace(/\D/g, '').slice(0, 9)
      setInnError(nextVal.length === 9 && !validateInn(nextVal))
    }

    if (key === 'bank_account') {
      nextVal = value.replace(/\D/g, '').slice(0, 20)
      setAccountError(nextVal.length === 20 && !validateBankAccount(nextVal))
    }

    if (key === 'mfo') {
      nextVal = value.replace(/\D/g, '').slice(0, 5)
      if (nextVal.length === 5) {
        const bank = getBankNameByMfo(nextVal)
        if (bank) {
          if (creating) {
            setForm(prev => ({ ...prev, mfo: nextVal, bank_name: bank }))
          } else if (current) {
            update(current.id, { mfo: nextVal, bank_name: bank })
          }
          return
        }
      }
    }

    if (creating) {
      setForm(prev => ({ ...prev, [key]: nextVal }))
    } else if (current) {
      update(current.id, { [key]: nextVal })
    }
  }

  const handleSaveNew = async () => {
    if (!form.name.trim() || !form.inn.trim()) {
      toast.error('Название и ИНН обязательны')
      return
    }

    if (form.inn.length !== 9 || !validateInn(form.inn)) {
      toast.error('Неверный ИНН контрагента')
      return
    }

    if (form.bank_account && (form.bank_account.length !== 20 || !validateBankAccount(form.bank_account))) {
      toast.error('Счет должен состоять из 20 цифр')
      return
    }

    const created = await add(form)
    if (created) {
      setCreating(false)
      setActiveId(created.id)
      toast.success('Контрагент успешно добавлен')
    }
  }

  const handleDelete = async () => {
    if (current) {
      await remove(current.id)
      setActiveId(null)
      setConfirmDel(false)
      toast.info('Контрагент удален')
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Вкладки: контрагенты / мои компании */}
      <div className="flex-shrink-0 border-b border-bx-border px-4 py-2.5 flex items-center gap-3">
        <h1 className="text-base font-semibold text-bx-text">Организации</h1>
        <div className="flex bg-bx-bg border border-bx-border rounded-lg p-0.5">
          <button onClick={() => setOrgTab('counterparties')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${orgTab === 'counterparties' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
            Контрагенты
          </button>
          <button onClick={() => setOrgTab('mine')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${orgTab === 'mine' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
            Мои компании
          </button>
        </div>
        <span className="text-[11px] text-bx-muted">
          {orgTab === 'counterparties' ? 'база партнёров с рейтингом риска' : 'реквизиты ваших фирм — р/с, МФО, ОКЭД'}
        </span>
      </div>

      {orgTab === 'mine' ? (
        <div className="flex-1 overflow-hidden p-4">
          <CompanyRequisites />
        </div>
      ) : (
      <div className="flex-1 flex overflow-hidden">
      {/* Список контрагентов */}
      <aside className="w-68 flex-shrink-0 border-r border-bx-border flex flex-col bg-bx-surface/30">
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-base font-semibold text-bx-text">Контрагенты</h1>
          <p className="text-xs text-bx-muted mt-0.5 font-medium">База партнеров и клиентов</p>
        </div>
        <div className="px-3 pb-2 space-y-1.5">
          <button 
            onClick={openNew} 
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            + Добавить партнера
          </button>
        </div>
        <div className="px-3 pb-2">
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Поиск по имени или ИНН..." 
            className={`${inputCls} text-xs py-1.5`} 
          />
        </div>
        
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {filtered.map(c => {
            const { score } = calculateRiskScore(c)
            let dotColor = 'bg-emerald-500'
            if (score > 30 && score <= 60) dotColor = 'bg-yellow-500'
            else if (score > 60) dotColor = 'bg-red-500'
            
            return (
              <button 
                key={c.id} 
                onClick={() => openCp(c)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${activeId === c.id && !creating ? 'bg-blue-600/20' : 'hover:bg-bx-surface-2/50'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${activeId === c.id && !creating ? 'text-blue-400' : 'text-bx-text'}`}>
                    {c.name}
                  </p>
                  <p className="text-[10px] text-bx-muted mt-0.5 truncate">
                    ИНН: {c.inn} {c.bank_name ? `· ${c.bank_name}` : ''}
                  </p>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-[11px] text-bx-muted text-center py-8">Контрагенты не найдены</p>
          )}
        </nav>
      </aside>

      {/* Детали */}
      <div className="flex-1 overflow-y-auto bg-bx-bg/10">
        {!editing ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <p className="text-5xl mb-4">🏢</p>
            <h2 className="text-base font-semibold text-bx-text mb-2">Справочник контрагентов</h2>
            <p className="text-xs text-bx-muted max-w-sm mb-6 leading-relaxed">
              Создайте базу ваших клиентов и поставщиков. Реквизиты контрагентов будут автоматически подставляться при заполнении договоров в разделе документов.
            </p>
            <button 
              onClick={openNew} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Добавить первого партнера
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-bx-text">
                {creating ? 'Новый контрагент' : data.name || 'Карточка контрагента'}
              </h2>
            </div>

            {/* Анализ рисков */}
            {!creating && current && (
              <div className="bg-bx-surface border border-bx-border rounded-xl p-5 mb-4">
                <h3 className="text-xs font-semibold text-bx-muted uppercase tracking-wider mb-2">Оценка надежности партнера</h3>
                {(() => {
                  const { score, reasons } = calculateRiskScore(current)
                  let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  let level = 'Низкий налоговый риск'
                  if (score > 30 && score <= 60) {
                    colorClass = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                    level = 'Средний налоговый риск'
                  } else if (score > 60) {
                    colorClass = 'text-red-400 bg-red-500/10 border-red-500/20'
                    level = 'Высокий налоговый риск'
                  }

                  return (
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between border rounded-lg px-3 py-2.5 ${colorClass}`}>
                        <span className="font-semibold text-sm">{level}</span>
                        <span className="font-mono text-sm">{100 - score} / 100 баллов</span>
                      </div>
                      {reasons.length > 0 ? (
                        <div className="text-[11px] text-bx-muted space-y-1">
                          <p className="font-semibold text-bx-muted">Факторы риска:</p>
                          {reasons.map((r, idx) => (
                            <p key={idx} className="flex items-start gap-1.5">
                              <span className="text-red-400/70 mt-0.5">•</span>
                              <span>{r}</span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-400">✓ Заполнены все основные реквизиты, ИНН и р/с валидны.</p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Карточка */}
            <div className="bg-bx-surface border border-bx-border rounded-xl p-5 space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-bx-muted block mb-1 uppercase tracking-wider">
                  Наименование организации / ФИО партнера *
                </label>
                <input 
                  value={data.name} 
                  onChange={e => handleFieldChange('name', e.target.value)} 
                  placeholder="ООО «Business Partner»" 
                  className={inputCls} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-bx-muted block mb-1 uppercase tracking-wider">
                    ИНН *
                  </label>
                  <input 
                    value={data.inn} 
                    onChange={e => handleFieldChange('inn', e.target.value)} 
                    placeholder="9 цифр" 
                    className={`${inputCls} font-mono ${innError ? 'border-red-500 focus:border-red-500' : ''}`} 
                  />
                  {innError && (
                    <p className="text-[10px] text-red-400 mt-1">Неверная контрольная сумма ИНН РУз</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-bx-muted block mb-1 uppercase tracking-wider">
                    МФО Банка
                  </label>
                  <input 
                    value={data.mfo || ''} 
                    onChange={e => handleFieldChange('mfo', e.target.value)} 
                    placeholder="5 цифр" 
                    className={`${inputCls} font-mono`} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-semibold text-bx-muted block mb-1 uppercase tracking-wider">
                    Название банка (автозаполнение по МФО)
                  </label>
                  <input 
                    value={data.bank_name || ''} 
                    onChange={e => handleFieldChange('bank_name', e.target.value)} 
                    placeholder="АКБ..." 
                    className={inputCls} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-semibold text-bx-muted block mb-1 uppercase tracking-wider">
                    Расчетный счет (20 знаков)
                  </label>
                  <input 
                    value={data.bank_account || ''} 
                    onChange={e => handleFieldChange('bank_account', e.target.value)} 
                    placeholder="20 цифр" 
                    className={`${inputCls} font-mono ${accountError ? 'border-red-500 focus:border-red-500' : ''}`} 
                  />
                  {accountError && (
                    <p className="text-[10px] text-red-400 mt-1">Счет должен содержать ровно 20 цифр</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-bx-muted block mb-1 uppercase tracking-wider">
                    Телефон
                  </label>
                  <input 
                    value={data.phone || ''} 
                    onChange={e => handleFieldChange('phone', e.target.value)} 
                    placeholder="+998" 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-bx-muted block mb-1 uppercase tracking-wider">
                    Юридический адрес
                  </label>
                  <input 
                    value={data.address || ''} 
                    onChange={e => handleFieldChange('address', e.target.value)} 
                    placeholder="Ташкент, ул..." 
                    className={inputCls} 
                  />
                </div>
              </div>
            </div>

            {/* Подвал формы */}
            <div className="flex justify-between items-center">
              {creating ? (
                <div className="flex gap-2 ml-auto">
                  <button 
                    onClick={() => setCreating(false)} 
                    className="px-4 py-2 border border-bx-border-2 text-bx-muted hover:text-bx-text text-xs font-medium rounded-lg hover:bg-bx-surface-2 transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={handleSaveNew} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Сохранить
                  </button>
                </div>
              ) : (
                <>
                  {confirmDel ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-400">Удалить контрагента из базы?</span>
                      <button onClick={handleDelete} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg">Да, удалить</button>
                      <button onClick={() => setConfirmDel(false)} className="text-bx-muted hover:text-bx-text">Отмена</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setConfirmDel(true)} 
                      className="text-xs text-bx-muted hover:text-red-400 transition-colors"
                    >
                      Удалить контрагента
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
      )}
    </div>
  )
}

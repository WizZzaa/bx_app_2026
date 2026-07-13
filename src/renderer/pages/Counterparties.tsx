import React, { useState, useMemo, useEffect } from 'react'
import { useCounterparties, type BxCounterparty, type NewCounterparty } from '../lib/db/useCounterparties'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'
import { validateInn, validateBankAccount, getBankNameByMfo } from '../lib/validation'

type OrgTab = 'counterparties' | 'my_company'

interface CompanyDetails {
  oked: string
  okpo: string
  account: string
  mfo: string
  bank: string
  director: string
  phone: string
  address: string
  notes: string
  users: Array<{ id: string; name: string; role: string; access: string; status: 'active' | 'suspended' }>
}

const DEFAULT_DETAILS: CompanyDetails = {
  oked: '',
  okpo: '',
  account: '',
  mfo: '',
  bank: '',
  director: '',
  phone: '',
  address: '',
  notes: '',
  users: [
    { id: '1', name: 'Иван Иванов', role: 'Директор', access: 'Владелец', status: 'active' },
    { id: '2', name: 'Наталья Петрова', role: 'Главный бухгалтер', access: 'Полный доступ', status: 'active' }
  ]
}

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

const inputCls = 'w-full bg-bx-surface text-bx-text px-3 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 shadow-inner font-semibold text-xs transition-all'

export default function Counterparties() {
  const { active, companies, addCompany, updateCompany, removeCompany, setActive } = useCompany()
  const { counterparties, add, update, remove } = useCounterparties(active?.id ?? null)
  const toast = useToast()

  const [orgTab, setOrgTab] = useState<OrgTab>('counterparties')
  
  // Контрагенты
  const [activeId, setActiveId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<NewCounterparty>(EMPTY_CP)
  const [confirmDel, setConfirmDel] = useState(false)

  const [innError, setInnError] = useState(false)
  const [accountError, setAccountError] = useState(false)

  // Детали Моей Компании
  const [myDetails, setMyDetails] = useState<CompanyDetails>(DEFAULT_DETAILS)
  const [editingCompanyName, setEditingCompanyName] = useState('')
  const [editingCompanyInn, setEditingCompanyInn] = useState('')
  const [editingCompanyRegime, setEditingCompanyRegime] = useState('')
  
  // Добавление сотрудника
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState('Бухгалтер')
  const [newUserAccess, setNewUserAccess] = useState('Чтение/Запись')
  const [showAddUser, setShowAddUser] = useState(false)

  // Создание новой компании в системе
  const [creatingCompany, setCreatingCompany] = useState(false)
  const [newCompName, setNewCompName] = useState('')
  const [newCompInn, setNewCompInn] = useState('')
  const [newCompRegime, setNewCompRegime] = useState('ОСН')

  // Синхронизация реквизитов Моей Компании
  useEffect(() => {
    if (!active) return
    const stored = localStorage.getItem(`bx_company_details_${active.id}`)
    if (stored) {
      try {
        setMyDetails(JSON.parse(stored))
      } catch {
        setMyDetails(DEFAULT_DETAILS)
      }
    } else {
      setMyDetails(DEFAULT_DETAILS)
    }
    setEditingCompanyName(active.name || '')
    setEditingCompanyInn(active.inn || '')
    setEditingCompanyRegime(active.regime || 'ОСН')
  }, [active])

  const saveMyDetails = (updated: CompanyDetails) => {
    if (!active) return
    setMyDetails(updated)
    localStorage.setItem(`bx_company_details_${active.id}`, JSON.stringify(updated))
  }

  const handleUpdateCompanyBase = async () => {
    if (!active) return
    if (!editingCompanyName.trim()) {
      toast.error('Название компании обязательно')
      return
    }
    try {
      await updateCompany(active.id, {
        name: editingCompanyName,
        inn: editingCompanyInn || null,
        regime: editingCompanyRegime || null
      })
      toast.success('Базовые реквизиты обновлены в БД')
    } catch {
      toast.error('Ошибка сохранения базовых реквизитов')
    }
  }

  const handleCreateCompany = async () => {
    if (!newCompName.trim()) {
      toast.error('Укажите название организации')
      return
    }
    try {
      await addCompany({
        name: newCompName,
        inn: newCompInn || undefined,
        regime: newCompRegime
      })
      toast.success('Новая компания добавлена')
      setCreatingCompany(false)
      setNewCompName('')
      setNewCompInn('')
    } catch {
      toast.error('Не удалось добавить компанию')
    }
  }

  const handleDeleteCompany = async () => {
    if (!active) return
    if (confirm(`Вы действительно хотите удалить компанию "${active.name}" и все её данные?`)) {
      try {
        const remaining = companies.filter(c => c.id !== active.id)
        await removeCompany(active.id)
        localStorage.removeItem(`bx_company_details_${active.id}`)
        if (remaining.length > 0) {
          setActive(remaining[0])
        } else {
          setActive(null)
        }
        toast.info('Компания удалена')
      } catch {
        toast.error('Ошибка при удалении')
      }
    }
  }

  // Детали полей моей компании
  const handleDetailFieldChange = (key: keyof Omit<CompanyDetails, 'users'>, val: string) => {
    const updated = { ...myDetails, [key]: val }
    if (key === 'mfo') {
      const bankName = getBankNameByMfo(val)
      if (bankName) {
        updated.bank = bankName
      }
    }
    saveMyDetails(updated)
  }

  // Добавление доступов
  const handleAddUser = () => {
    if (!newUserName.trim()) return
    const newUser = {
      id: Date.now().toString(),
      name: newUserName,
      role: newUserRole,
      access: newUserAccess,
      status: 'active' as const
    }
    saveMyDetails({
      ...myDetails,
      users: [...myDetails.users, newUser]
    })
    setNewUserName('')
    setShowAddUser(false)
    toast.success('Пользователь добавлен')
  }

  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = myDetails.users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? ('suspended' as const) : ('active' as const) }
      }
      return u
    })
    saveMyDetails({ ...myDetails, users: updatedUsers })
  }

  const handleRemoveUser = (userId: string) => {
    const updatedUsers = myDetails.users.filter(u => u.id !== userId)
    saveMyDetails({ ...myDetails, users: updatedUsers })
    toast.info('Доступ отозван')
  }

  // Контрагенты
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
    <div className="flex-1 flex flex-col overflow-hidden bg-bx-bg font-sans text-bx-text">
      
      {/* Шапка табов */}
      <div className="flex-shrink-0 border-b border-bx-border px-5 py-3 flex items-center justify-between gap-4 bg-bx-surface shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-extrabold tracking-wider uppercase">Организации</h1>
          <div className="flex bg-bx-surface-2 border border-bx-border rounded-xl p-0.5 shadow-inner">
            <button onClick={() => setOrgTab('counterparties')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${orgTab === 'counterparties' ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-text'}`}>
              👥 Контрагенты
            </button>
            <button onClick={() => setOrgTab('my_company')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${orgTab === 'my_company' ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-text'}`}>
              🏢 Моя компания
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {orgTab === 'my_company' && (
            <button
              onClick={() => setCreatingCompany(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              ＋ Добавить компанию
            </button>
          )}
          {active && (
            <span className="text-[10px] text-bx-muted font-bold bg-bx-surface-2 border border-bx-border px-2.5 py-1 rounded-lg">
              Текущая фирма: <span className="text-blue-500 font-extrabold">{active.name}</span>
            </span>
          )}
        </div>
      </div>

      {creatingCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bx-surface border border-bx-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-bx-text uppercase tracking-wider">Новая компания в системе</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">Наименование компании</label>
                <input value={newCompName} onChange={e => setNewCompName(e.target.value)} placeholder="ООО «Новая Фирма»" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">ИНН</label>
                <input value={newCompInn} onChange={e => setNewCompInn(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="9 цифр" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">Налоговый режим</label>
                <select value={newCompRegime} onChange={e => setNewCompRegime(e.target.value)} className={inputCls}>
                  <option value="ОСН">ОСН (НДС 12%)</option>
                  <option value="Налог с оборота">Налог с оборота</option>
                  <option value="Упрощенный">Упрощенный</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCreatingCompany(false)} className="px-3.5 py-2 border border-bx-border text-bx-muted hover:text-bx-text text-xs font-bold rounded-xl hover:bg-bx-surface-2 transition-all">Отмена</button>
              <button onClick={handleCreateCompany} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all">Добавить</button>
            </div>
          </div>
        </div>
      )}

      {/* Контент таба Моя компания */}
      {orgTab === 'my_company' ? (
        active ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar max-w-4xl mx-auto w-full">
            
            {/* Базовые настройки */}
            <section className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-bx-border/50 pb-3">
                <div>
                  <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">Базовые параметры компании</h3>
                  <p className="text-[10px] text-bx-muted mt-0.5">Данные, используемые для расчетов налогов и синхронизации с базой</p>
                </div>
                <button onClick={handleUpdateCompanyBase} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-sm">
                  Сохранить базу
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">Название компании</label>
                  <input value={editingCompanyName} onChange={e => setEditingCompanyName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">ИНН организации</label>
                  <input value={editingCompanyInn} onChange={e => setEditingCompanyInn(e.target.value.replace(/\D/g, '').slice(0, 9))} className={inputCls} />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">Налоговый режим</label>
                  <select value={editingCompanyRegime} onChange={e => setEditingCompanyRegime(e.target.value)} className={inputCls}>
                    <option value="ОСН">ОСН (НДС 12% + Прибыль 15%)</option>
                    <option value="Налог с оборота">Налог с оборота (3-4%)</option>
                    <option value="Упрощенный">Упрощенный налог</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Подробные реквизиты компании */}
            <section className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-bx-border/50 pb-3">
                <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">Детальные реквизиты</h3>
                <p className="text-[10px] text-bx-muted mt-0.5">Данные автозаполнения для договоров, актов и бланков</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">ОКЭД (Вид деят.)</label>
                  <input value={myDetails.oked} onChange={e => handleDetailFieldChange('oked', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="5 цифр" className={inputCls} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">ОКПО</label>
                  <input value={myDetails.okpo} onChange={e => handleDetailFieldChange('okpo', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="8 цифр" className={inputCls} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">МФО Банка</label>
                  <input value={myDetails.mfo} onChange={e => handleDetailFieldChange('mfo', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="5 цифр" className={inputCls} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">ФИО Директора</label>
                  <input value={myDetails.director} onChange={e => handleDetailFieldChange('director', e.target.value)} placeholder="Алиев А.А." className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">Наименование обслуживающего банка</label>
                  <input value={myDetails.bank} onChange={e => handleDetailFieldChange('bank', e.target.value)} placeholder="АКБ «Узпромстройбанк»" className={inputCls} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">Расчетный счет организации</label>
                  <input value={myDetails.account} onChange={e => handleDetailFieldChange('account', e.target.value.replace(/\D/g, '').slice(0, 20))} placeholder="20 цифр" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">Юридический адрес</label>
                  <input value={myDetails.address} onChange={e => handleDetailFieldChange('address', e.target.value)} placeholder="Ташкент, Чиланзарский р-н..." className={inputCls} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">Телефон компании</label>
                  <input value={myDetails.phone} onChange={e => handleDetailFieldChange('phone', e.target.value)} placeholder="+998" className={inputCls} />
                </div>
              </div>
            </section>

            {/* Управление доступами к компании */}
            <section className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-bx-border/50 pb-3">
                <div>
                  <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">Управление доступом к организации</h3>
                  <p className="text-[10px] text-bx-muted mt-0.5">Список авторизованных сотрудников, бухгалтеров и аудиторов компании</p>
                </div>
                <button onClick={() => setShowAddUser(true)} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer">
                  ＋ Добавить доступ
                </button>
              </div>

              {showAddUser && (
                <div className="p-4 bg-bx-surface-2 border border-bx-border rounded-2xl flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase">ФИО сотрудника</label>
                    <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Например: Каримов Тимур" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase">Должность</label>
                    <input value={newUserRole} onChange={e => setNewUserRole(e.target.value)} placeholder="Главный Бухгалтер" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-bx-muted block mb-1 uppercase">Права</label>
                    <select value={newUserAccess} onChange={e => setNewUserAccess(e.target.value)} className={inputCls}>
                      <option value="Полный доступ">Полный доступ</option>
                      <option value="Чтение/Запись">Чтение/Запись</option>
                      <option value="Только чтение">Только чтение</option>
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={handleAddUser} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl">Добавить</button>
                    <button onClick={() => setShowAddUser(false)} className="px-3 py-2.5 bg-bx-surface border border-bx-border text-bx-muted text-xs font-bold rounded-xl">Отмена</button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-bx-border bg-bx-bg/40 rounded-2xl border border-bx-border overflow-hidden">
                {myDetails.users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        u.status === 'active' ? 'bg-blue-500/15 text-blue-500' : 'bg-bx-surface-2 text-bx-muted'
                      }`}>
                        👤
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-bx-text flex items-center gap-2">
                          {u.name}
                          {u.status === 'suspended' && (
                            <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 rounded px-1 py-0.5">Приостановлен</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-bx-muted mt-0.5">{u.role} · Права: <span className="font-semibold">{u.access}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleUserStatus(u.id)} className="text-[10px] px-2.5 py-1 bg-bx-surface border border-bx-border hover:bg-bx-surface-2 text-bx-text rounded-lg font-bold">
                        {u.status === 'active' ? 'Заблокировать' : 'Активировать'}
                      </button>
                      {u.access !== 'Владелец' && (
                        <button onClick={() => handleRemoveUser(u.id)} className="text-[10px] px-2 py-1 hover:bg-red-500/10 text-bx-muted hover:text-red-400 rounded-lg">
                          ✕ Отозвать
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Служебные заметки */}
            <section className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">Важная служебная информация</h3>
                <p className="text-[10px] text-bx-muted mt-0.5">Нюансы ведения бухгалтерии, особенности льгот и расписания сдачи отчетности компании</p>
              </div>
              <textarea
                value={myDetails.notes}
                onChange={e => handleDetailFieldChange('notes', e.target.value)}
                placeholder="Например: Компания имеет льготу по налогу на прибыль для экспортеров. Заявки на возмещение импортного НДС подавать строго до 10 числа каждого месяца..."
                rows={4}
                className="w-full bg-bx-bg text-bx-text p-3.5 rounded-2xl border border-bx-border focus:outline-none focus:border-blue-500/50 shadow-inner font-semibold text-xs resize-none"
              />
            </section>

            {/* Зона удаления компании */}
            <div className="pt-4 flex justify-end">
              <button onClick={handleDeleteCompany} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all cursor-pointer">
                ⚠️ Удалить компанию из BX
              </button>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <span className="text-4xl block mb-3">🏢</span>
            <h3 className="text-sm font-bold text-bx-text">В системе пока нет ваших компаний</h3>
            <p className="text-xs text-bx-muted mt-1 max-w-xs">Создайте первую компанию, чтобы вести ее учет, формировать документы и отслеживать налоги</p>
            <button onClick={() => setCreatingCompany(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all">
              ＋ Добавить первую компанию
            </button>
          </div>
        )
      ) : (
        
        // Справочник контрагентов
        <div className="flex-1 flex overflow-hidden">
          {/* Список контрагентов */}
          <aside className="w-68 flex-shrink-0 border-r border-bx-border flex flex-col bg-bx-surface-2/30">
            <div className="px-4 pt-5 pb-2">
              <h1 className="text-xs font-black text-bx-text uppercase tracking-wider">Контрагенты</h1>
              <p className="text-[10px] text-bx-muted mt-0.5 font-bold uppercase">Список партнеров и клиентов</p>
            </div>
            <div className="px-3 pb-2 space-y-1.5">
              <button 
                onClick={openNew} 
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                + Добавить партнера
              </button>
            </div>
            <div className="px-3 pb-2">
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Поиск по имени или ИНН..." 
                className={`${inputCls} text-xs py-2`} 
              />
            </div>
            
            <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
              {filtered.map(c => {
                const { score } = calculateRiskScore(c)
                let dotColor = 'bg-emerald-500'
                if (score > 30 && score <= 60) dotColor = 'bg-yellow-500'
                else if (score > 60) dotColor = 'bg-red-500'
                
                return (
                  <button 
                    key={c.id} 
                    onClick={() => openCp(c)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-start gap-2.5 cursor-pointer ${activeId === c.id && !creating ? 'bg-blue-600/10 border border-blue-500/10' : 'hover:bg-bx-surface-2 border border-transparent'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${activeId === c.id && !creating ? 'text-blue-500 font-extrabold' : 'text-bx-text'}`}>
                        {c.name}
                      </p>
                      <p className="text-[10px] text-bx-muted mt-0.5 truncate font-semibold">
                        ИНН: {c.inn} {c.bank_name ? `· ${c.bank_name}` : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="text-[10px] text-bx-muted text-center py-8 font-bold uppercase">Партнеры не найдены</p>
              )}
            </nav>
          </aside>

          {/* Детали */}
          <div className="flex-1 overflow-y-auto bg-bx-bg/10">
            {!editing ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <p className="text-5xl mb-4">👥</p>
                <h2 className="text-base font-extrabold text-bx-text mb-2 uppercase tracking-wide">Справочник контрагентов</h2>
                <p className="text-xs text-bx-muted max-w-sm mb-6 leading-relaxed font-semibold">
                  Создайте базу ваших клиентов и поставщиков. Реквизиты контрагентов будут автоматически подставляться при заполнении договоров в разделе документов.
                </p>
                <button 
                  onClick={openNew} 
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Добавить первого партнера
                </button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-extrabold text-bx-text uppercase tracking-wide">
                    {creating ? 'Новый контрагент' : data.name || 'Карточка контрагента'}
                  </h2>
                </div>

                {/* Анализ рисков */}
                {!creating && current && (
                  <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 mb-4 shadow-sm">
                    <h3 className="text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-2">Оценка надежности партнера</h3>
                    {(() => {
                      const { score, reasons } = calculateRiskScore(current)
                      let colorClass = 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      let level = 'Низкий налоговый риск'
                      if (score > 30 && score <= 60) {
                        colorClass = 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                        level = 'Средний налоговый риск'
                      } else if (score > 60) {
                        colorClass = 'text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20'
                        level = 'Высокий налоговый риск'
                      }

                      return (
                        <div className="space-y-3">
                          <div className={`flex items-center justify-between border rounded-xl px-3.5 py-3 ${colorClass}`}>
                            <span className="font-extrabold text-xs">{level}</span>
                            <span className="font-mono text-xs font-extrabold">{100 - score} / 100 баллов</span>
                          </div>
                          {reasons.length > 0 ? (
                            <div className="text-[10.5px] text-bx-muted space-y-1 font-semibold">
                              <p className="font-bold text-bx-muted uppercase tracking-wider text-[9px] mb-1">Факторы риска:</p>
                              {reasons.map((r, idx) => (
                                <p key={idx} className="flex items-start gap-1.5">
                                  <span className="text-red-400/70 mt-0.5">•</span>
                                  <span>{r}</span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10.5px] text-emerald-500 font-bold">✓ Заполнены все основные реквизиты, ИНН и р/с валидны.</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Карточка */}
                <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 space-y-4 mb-6 shadow-sm">
                  <div>
                    <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">
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
                      <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">
                        ИНН *
                      </label>
                      <input 
                        value={data.inn} 
                        onChange={e => handleFieldChange('inn', e.target.value)} 
                        placeholder="9 цифр" 
                        className={`${inputCls} font-mono ${innError ? 'border-red-500 focus:border-red-500' : ''}`} 
                      />
                      {innError && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">Неверная контрольная сумма ИНН РУз</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">
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
                      <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">
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
                      <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">
                        Расчетный счет (20 знаков)
                      </label>
                      <input 
                        value={data.bank_account || ''} 
                        onChange={e => handleFieldChange('bank_account', e.target.value)} 
                        placeholder="20 цифр" 
                        className={`${inputCls} font-mono ${accountError ? 'border-red-500 focus:border-red-500' : ''}`} 
                      />
                      {accountError && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">Счет должен содержать ровно 20 цифр</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">
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
                      <label className="text-[9.5px] font-bold text-bx-muted block mb-1 uppercase tracking-wider">
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
                        className="px-4 py-2.5 border border-bx-border text-bx-muted hover:text-bx-text text-xs font-bold rounded-xl hover:bg-bx-surface-2 transition-colors cursor-pointer"
                      >
                        Отмена
                      </button>
                      <button 
                        onClick={handleSaveNew} 
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Сохранить
                      </button>
                    </div>
                  ) : (
                    <>
                      {confirmDel ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-red-500 font-bold">Удалить контрагента из базы?</span>
                          <button onClick={handleDelete} className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer">Да, удалить</button>
                          <button onClick={() => setConfirmDel(false)} className="text-bx-muted hover:text-bx-text font-bold cursor-pointer">Отмена</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setConfirmDel(true)} 
                          className="text-xs text-bx-muted hover:text-red-500 font-bold transition-colors cursor-pointer"
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

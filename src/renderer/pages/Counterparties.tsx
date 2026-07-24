import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCounterparties, type BxCounterparty, type NewCounterparty } from '../lib/db/useCounterparties'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'
import { getBankNameByMfo, validateBankAccount, validateInn } from '../lib/validation'
import { CompanyTeamPanel } from '../components/CompanyTeamPanel'
import { CompanyRoleGuide } from '../components/CompanyRoleGuide'
import { CompanyProfileActivityPanel } from '../components/CompanyProfileActivityPanel'
import Icon from '../lib/ui/Icon'
import {
  ResourceEmpty,
  ResourceHero,
  ResourceLayout,
  ResourceNavItem,
  ResourceSectionTitle,
  ResourceSidebar,
  primaryActionClass,
} from '../components/workspace/ResourceWorkspace'
import {
  companyDetailsCompletion,
  counterpartyHealth,
  EMPTY_COMPANY_DETAILS,
  loadCompanyDetails,
  saveCompanyDetails,
  type CompanyDetailsSnapshot,
} from '../lib/organizationInsights'
import { useConfirmationDialog } from '../components/ui/useConfirmationDialog'

type OrganizationView = 'companies' | 'counterparties' | 'attention'

const EMPTY_COUNTERPARTY: NewCounterparty = {
  company_id: null, name: '', inn: '', mfo: '', bank_name: '', bank_account: '', phone: '', address: '',
}

const inputClass = 'min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-semibold text-bx-text outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15'
const labelClass = 'block text-[10px] font-black uppercase tracking-[0.1em] text-bx-muted'

export default function Counterparties() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: routeId } = useParams<{ id?: string }>()
  const { active, companies, removeCompany, setActive, startCompanyCreation, startCompanyEdit } = useCompany()
  const { counterparties, loading, add, update, remove } = useCounterparties(active?.id ?? null)
  const toast = useToast()
  const { confirm, confirmationDialog } = useConfirmationDialog()
  const [view, setView] = useState<OrganizationView>('companies')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<NewCounterparty>({ ...EMPTY_COUNTERPARTY })
  const [saving, setSaving] = useState(false)
  const [details, setDetails] = useState<CompanyDetailsSnapshot>({ ...EMPTY_COMPANY_DETAILS })

  const isCompanyRoute = location.pathname.startsWith('/companies/')
  const selectedCompany = isCompanyRoute ? companies.find(company => company.id === routeId) ?? null : null
  const selectedCounterparty = !isCompanyRoute && routeId ? counterparties.find(counterparty => counterparty.id === routeId) ?? null : null

  useEffect(() => {
    if (selectedCompany && active?.id !== selectedCompany.id) setActive(selectedCompany)
  }, [active?.id, selectedCompany, setActive])

  useEffect(() => {
    if (selectedCompany) setDetails(loadCompanyDetails(selectedCompany.id))
  }, [selectedCompany])

  useEffect(() => {
    if (selectedCounterparty) setForm(toForm(selectedCounterparty))
  }, [selectedCounterparty])

  const attentionCount = useMemo(() => counterparties.filter(counterparty => counterpartyHealth(counterparty).percent < 80).length, [counterparties])
  const visibleCounterparties = useMemo(() => {
    const query = search.trim().toLowerCase()
    return counterparties.filter(counterparty => {
      if (view === 'attention' && counterpartyHealth(counterparty).percent >= 80) return false
      return !query || [counterparty.name, counterparty.inn, counterparty.bank_name, counterparty.phone].some(value => (value ?? '').toLowerCase().includes(query))
    })
  }, [counterparties, search, view])
  const visibleCompanies = useMemo(() => {
    const query = search.trim().toLowerCase()
    return companies.filter(company => !query || [company.name, company.inn, company.regime].some(value => (value ?? '').toLowerCase().includes(query)))
  }, [companies, search])

  function toForm(counterparty: BxCounterparty): NewCounterparty {
    return {
      company_id: counterparty.company_id,
      name: counterparty.name,
      inn: counterparty.inn,
      mfo: counterparty.mfo ?? '',
      bank_name: counterparty.bank_name ?? '',
      bank_account: counterparty.bank_account ?? '',
      phone: counterparty.phone ?? '',
      address: counterparty.address ?? '',
    }
  }

  function startCounterpartyCreation() {
    setCreating(true)
    setForm({ ...EMPTY_COUNTERPARTY, company_id: active?.id ?? null })
  }

  function changeCounterpartyField(key: keyof NewCounterparty, value: string) {
    let next = value
    if (key === 'inn') next = value.replace(/\D/g, '').slice(0, 9)
    if (key === 'bank_account') next = value.replace(/\D/g, '').slice(0, 20)
    if (key === 'mfo') next = value.replace(/\D/g, '').slice(0, 5)
    setForm(current => {
      const updated = { ...current, [key]: next }
      if (key === 'mfo' && next.length === 5) updated.bank_name = getBankNameByMfo(next) || updated.bank_name
      return updated
    })
  }

  async function saveCounterparty() {
    if (!form.name.trim() || form.inn.length !== 9 || !validateInn(form.inn)) {
      toast.error('Укажите название и корректный ИНН из 9 цифр')
      return
    }
    if (form.bank_account && (form.bank_account.length !== 20 || !validateBankAccount(form.bank_account))) {
      toast.error('Расчётный счёт должен состоять из 20 корректных цифр')
      return
    }
    setSaving(true)
    try {
      if (selectedCounterparty) {
        await update(selectedCounterparty.id, form)
        toast.success('Карточка контрагента обновлена')
      } else {
        const created = await add(form)
        if (created) {
          setCreating(false)
          toast.success('Контрагент добавлен')
          navigate(`/counterparties/${created.id}`)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  function changeCompanyDetail(key: keyof CompanyDetailsSnapshot, value: string) {
    if (!selectedCompany) return
    const next = { ...details, [key]: value }
    if (key === 'mfo' && value.length === 5) next.bank = getBankNameByMfo(value) || next.bank
    setDetails(next)
    saveCompanyDetails(selectedCompany.id, next)
  }

  async function deleteSelectedCompany() {
    if (!selectedCompany) return
    const confirmed = await confirm({
      title: 'Архивировать компанию?',
      description: `«${selectedCompany.name}» исчезнет из активного списка. Связанные документы, задачи и история сохранятся.`,
      confirmLabel: 'Перенести в архив',
    })
    if (!confirmed) return
    await removeCompany(selectedCompany.id)
    toast.info('Компания перенесена в архив')
    navigate('/counterparties')
  }

  const sidebar = <ResourceSidebar icon="building" title="Организации" subtitle="Свои компании и деловые связи" search={search} searchPlaceholder="Название, ИНН или банк" onSearch={setSearch} onClear={() => setSearch('')} label="Рабочие разделы" footer={<button type="button" onClick={view === 'companies' ? () => startCompanyCreation() : startCounterpartyCreation} className={`${primaryActionClass} w-full`}><Icon name="plus" className="h-4 w-4" />{view === 'companies' ? 'Добавить компанию' : 'Добавить контрагента'}</button>}>
    <ResourceNavItem icon="building" label="Мои компании" count={companies.length} active={view === 'companies'} onClick={() => { setView('companies'); navigate('/counterparties') }} />
    <ResourceNavItem icon="users" label="Контрагенты" count={counterparties.length} active={view === 'counterparties'} onClick={() => { setView('counterparties'); navigate('/counterparties') }} />
    <ResourceNavItem icon="alert" label="Требуют внимания" count={attentionCount} active={view === 'attention'} onClick={() => { setView('attention'); navigate('/counterparties') }} />
  </ResourceSidebar>

  if (selectedCompany) return <><CompanyDetail company={selectedCompany} details={details} completion={companyDetailsCompletion(details)} onBack={() => navigate('/counterparties')} onEdit={() => startCompanyEdit(selectedCompany)} onChange={changeCompanyDetail} onDelete={() => void deleteSelectedCompany()} onNavigate={navigate} />{confirmationDialog}</>

  if (selectedCounterparty || creating) return <><CounterpartyDetail counterparty={selectedCounterparty} form={form} saving={saving} onBack={() => { setCreating(false); navigate('/counterparties') }} onChange={changeCounterpartyField} onSave={() => void saveCounterparty()} onDelete={selectedCounterparty ? async () => {
    if (!await confirm({
      title: 'Удалить контрагента?',
      description: `«${selectedCounterparty.name}» будет удалён из справочника организаций.`,
      confirmLabel: 'Удалить контрагента',
      tone: 'destructive',
    })) return
    await remove(selectedCounterparty.id)
    toast.info('Контрагент удалён')
    navigate('/counterparties')
  } : undefined} onNavigate={navigate} />{confirmationDialog}</>

  const showingCompanies = view === 'companies'
  return <div className="bx-a6-organizations contents"><ResourceLayout sidebar={sidebar}>
    <div className="bx-a6-organizations__workspace space-y-6">
      <ResourceHero eyebrow="Единая карта бизнеса" title="Все организации, реквизиты и связи в одном месте" description="Мои компании управляют календарём и документами BX. Контрагенты используются в шаблонах, оплатах и быстрых проверках — без повторного ввода реквизитов." icon="building" stats={[{ value: companies.length, label: 'своих компаний' }, { value: counterparties.length, label: 'контрагентов' }, { value: attentionCount, label: 'нужно дополнить' }]} actions={<button type="button" onClick={showingCompanies ? () => startCompanyCreation() : startCounterpartyCreation} className={primaryActionClass}><Icon name="plus" className="h-4 w-4" />{showingCompanies ? 'Новая компания' : 'Новый контрагент'}</button>} />
      <section className="space-y-4">
        <ResourceSectionTitle title={showingCompanies ? 'Мои компании' : view === 'attention' ? 'Карточки требуют внимания' : 'Контрагенты'} subtitle={showingCompanies ? 'Откройте компанию, чтобы увидеть профиль, реквизиты, команду и связанные разделы' : 'Откройте внутреннюю карточку для проверки и изменения реквизитов'} count={showingCompanies ? visibleCompanies.length : visibleCounterparties.length} />
        {loading && !showingCompanies ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[20px] border border-bx-border bg-bx-surface" />)}</div> : showingCompanies ? (
          visibleCompanies.length ? <div className="bx-a6-company-list space-y-2">{visibleCompanies.map(company => {
            return <button type="button" key={company.id} onClick={() => { setActive(company); navigate(`/companies/${company.id}`) }} className="bx-a6-company-row group flex min-h-16 w-full items-center gap-3 rounded-2xl border border-bx-border bg-bx-surface p-3 text-left shadow-sm outline-none transition-colors hover:border-blue-500/35 focus-visible:ring-2 focus-visible:ring-blue-500">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name="building" className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-bx-text group-hover:text-blue-600 dark:group-hover:text-blue-300">{company.name}</span><span className="mt-1 block truncate text-xs text-bx-muted">ИНН {company.inn || 'не указан'} · {company.regime || 'режим не указан'}</span></span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${company.id === active?.id ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-bx-border bg-bx-surface-2 text-bx-muted'}`}>{company.id === active?.id ? 'Активная' : 'Рабочая'}</span><Icon name="arrowR" className="h-4 w-4 text-bx-muted" />
            </button>
          })}</div> : <ResourceEmpty icon="building" title="Компаний пока нет" description="Создайте профиль компании — BX построит для неё календарь обязательств и рабочий контур." action={<button type="button" onClick={() => startCompanyCreation()} className={primaryActionClass}>Добавить компанию</button>} />
        ) : visibleCounterparties.length ? <div className="bx-a6-counterparty-grid grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{visibleCounterparties.map(counterparty => {
          const health = counterpartyHealth(counterparty)
          return <button type="button" key={counterparty.id} onClick={() => navigate(`/counterparties/${counterparty.id}`)} className="bx-a6-counterparty-card group flex min-h-52 flex-col rounded-[20px] border border-bx-border bg-bx-surface p-4 text-left shadow-sm outline-none transition-colors hover:border-blue-500/35 focus-visible:ring-2 focus-visible:ring-blue-500">
            <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name="users" className="h-[18px] w-[18px]" /></span><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${health.tone === 'good' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : health.tone === 'attention' ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300'}`}>{health.percent}% данных</span></div>
            <h2 className="mt-4 line-clamp-2 text-sm font-black text-bx-text group-hover:text-blue-600 dark:group-hover:text-blue-300">{counterparty.name}</h2><p className="mt-1 text-[11px] font-bold text-bx-muted">ИНН {counterparty.inn}</p><p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-bx-muted">{health.missing.length ? `Добавить: ${health.missing.join(', ')}` : counterparty.bank_name || 'Карточка заполнена'}</p><span className="mt-auto flex items-center gap-1 border-t border-bx-border pt-3 text-[10px] font-black text-blue-600 dark:text-blue-300">Открыть карточку <Icon name="arrowR" className="h-3.5 w-3.5" /></span>
          </button>
        })}</div> : <ResourceEmpty icon="users" title="Организации не найдены" description={search ? 'Измените поиск или очистите фильтр.' : 'Добавьте первого контрагента, чтобы использовать его в документах и оплатах.'} action={<button type="button" onClick={startCounterpartyCreation} className={primaryActionClass}>Добавить контрагента</button>} />}
      </section>
    </div>
  </ResourceLayout></div>
}

function CompanyDetail({ company, details, completion, onBack, onEdit, onChange, onDelete, onNavigate }: {
  company: NonNullable<ReturnType<typeof useCompany>['active']>
  details: CompanyDetailsSnapshot
  completion: ReturnType<typeof companyDetailsCompletion>
  onBack: () => void
  onEdit: () => void
  onChange: (key: keyof CompanyDetailsSnapshot, value: string) => void
  onDelete: () => void
  onNavigate: (path: string) => void
}) {
  const fields: Array<[keyof CompanyDetailsSnapshot, string, string]> = [
    ['director', 'Руководитель', 'ФИО подписанта'], ['phone', 'Телефон', '+998…'], ['address', 'Юридический адрес', 'Город, район, улица'], ['oked', 'ОКЭД', '5 цифр'], ['okpo', 'ОКПО', '8 цифр'], ['mfo', 'МФО банка', '5 цифр'], ['bank', 'Обслуживающий банк', 'Название банка'], ['account', 'Расчётный счёт', '20 цифр'],
  ]
  return <div className="bx-a6-organization-detail flex flex-1 overflow-y-auto bg-bx-bg text-bx-text custom-scrollbar"><div className="bx-page-container w-full space-y-5 py-5">
    <header className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm"><button type="button" onClick={onBack} className="inline-flex min-h-9 items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-bx-muted hover:text-bx-text"><Icon name="arrowL" className="h-3.5 w-3.5" />Все организации</button><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Внутренняя карточка компании</p><h1 className="mt-1 text-2xl font-black tracking-tight">{company.name}</h1><p className="mt-1 text-xs text-bx-muted">ИНН {company.inn || 'не указан'} · {company.regime || 'налоговый режим не указан'} · {company.is_vat_payer ? 'плательщик НДС' : 'без НДС'}</p></div><button type="button" onClick={onEdit} className={primaryActionClass}><Icon name="settings" className="h-4 w-4" />Изменить профиль</button></div></header>
    {!company.legal_form && <section className="flex flex-col gap-3 rounded-[20px] border border-amber-500/25 bg-amber-500/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black text-bx-text">Уточните форму предприятия</p><p className="mt-1 text-[11px] leading-relaxed text-bx-muted">Профиль создан до появления выбора ООО, ЯТТ, СП и других форм. Уточнение сделает поля и календарь точнее; старые задачи не исчезнут.</p></div><button type="button" onClick={onEdit} className="min-h-11 shrink-0 rounded-xl bg-amber-500 px-4 text-xs font-black text-slate-950 hover:bg-amber-400">Уточнить форму</button></section>}
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[20px] border border-bx-border bg-bx-surface p-5 shadow-sm"><div><h2 className="text-base font-black">Реквизиты для документов</h2><p className="mt-1 text-[11px] text-bx-muted">Необязательные поля можно заполнить тогда, когда они понадобятся конкретному документу.</p></div><div className="mt-5 grid gap-4 md:grid-cols-2">{fields.map(([key, label, placeholder]) => <label key={key} className={labelClass}>{label}<input value={details[key]} onChange={event => onChange(key, key === 'mfo' ? event.target.value.replace(/\D/g, '').slice(0, 5) : key === 'account' ? event.target.value.replace(/\D/g, '').slice(0, 20) : event.target.value)} placeholder={placeholder} className={`${inputClass} mt-1.5`} /></label>)}</div><label className={`${labelClass} mt-4`}>Служебные заметки<textarea value={details.notes} onChange={event => onChange('notes', event.target.value)} rows={4} placeholder="Льготы, особенности работы, порядок согласования…" className={`${inputClass} mt-1.5 resize-y py-3`} /></label></section>
      <aside className="space-y-4"><section className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm"><h2 className="text-sm font-black">Для документов</h2><p className="mt-2 text-[11px] leading-relaxed text-bx-muted">{completion.missing.length ? `При создании документов BX попросит добавить: ${completion.missing.join(', ')}.` : 'Основные реквизиты доступны для подстановки в документы.'}</p></section><section className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm"><h2 className="text-sm font-black">Связанные разделы</h2><div className="mt-3 space-y-2">{[['templates', 'Создать документ', '/documents/templates'], ['note', 'Мои документы', '/documents/my'], ['finance', 'Контроль оплат', '/finance'], ['planner', 'Календарь и задачи', '/planner']].map(([icon, label, path]) => <button type="button" key={path} onClick={() => onNavigate(path)} className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-bx-border bg-bx-bg px-3 text-left text-xs font-bold hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-300"><Icon name={icon} className="h-4 w-4" />{label}<Icon name="arrowR" className="ml-auto h-3.5 w-3.5" /></button>)}</div></section><button type="button" onClick={onDelete} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-xs font-bold text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"><Icon name="folder" className="h-4 w-4" />Архивировать компанию</button></aside>
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[20px] border border-bx-border bg-bx-surface p-5 shadow-sm"><CompanyTeamPanel /></section>
      <CompanyRoleGuide />
    </div>
    <CompanyProfileActivityPanel company={company} />
  </div></div>
}

function CounterpartyDetail({ counterparty, form, saving, onBack, onChange, onSave, onDelete, onNavigate }: {
  counterparty: BxCounterparty | null
  form: NewCounterparty
  saving: boolean
  onBack: () => void
  onChange: (key: keyof NewCounterparty, value: string) => void
  onSave: () => void
  onDelete?: () => void | Promise<void>
  onNavigate: (path: string) => void
}) {
  const health = counterpartyHealth({ ...form, id: '', created_at: '', updated_at: '' } as BxCounterparty)
  const fields: Array<[keyof NewCounterparty, string, string]> = [['name', 'Контрагент', 'ООО «Контрагент»'], ['inn', 'ИНН контрагента', '9 цифр'], ['phone', 'Телефон', '+998…'], ['address', 'Юридический адрес', 'Город, район, улица'], ['mfo', 'МФО', '5 цифр'], ['bank_name', 'Банк', 'Название банка'], ['bank_account', 'Расчётный счёт', '20 цифр']]
  return <div className="flex flex-1 overflow-y-auto bg-bx-bg text-bx-text custom-scrollbar"><div className="bx-reading-container w-full space-y-5 py-5"><button type="button" onClick={onBack} className="inline-flex min-h-9 items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-bx-muted hover:text-bx-text"><Icon name="arrowL" className="h-3.5 w-3.5" />Все организации</button><header className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">{counterparty ? 'Карточка контрагента' : 'Новый контрагент'}</p><h1 className="mt-1 text-2xl font-black">{counterparty?.name || 'Заполните реквизиты контрагента'}</h1><p className="mt-1 text-xs text-bx-muted">Данные используются в шаблонах документов и контроле оплат.</p></div></header><div className="grid gap-4 lg:grid-cols-[1fr_300px]"><section className="rounded-[20px] border border-bx-border bg-bx-surface p-5 shadow-sm"><h2 className="text-base font-black">Основные и банковские реквизиты</h2><p className="mt-1 text-[11px] text-bx-muted">Изменения применятся после сохранения карточки.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{fields.map(([key, label, placeholder]) => <label key={key} className={`${labelClass} ${key === 'name' || key === 'address' ? 'md:col-span-2' : ''}`}>{label}{key === 'name' || key === 'inn' ? ' *' : ''}<input value={String(form[key] ?? '')} onChange={event => onChange(key, event.target.value)} placeholder={placeholder} className={`${inputClass} mt-1.5`} /></label>)}</div><div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={onSave} className={primaryActionClass}><Icon name="save" className="h-4 w-4" />{saving ? 'Сохраняю…' : 'Сохранить карточку'}</button>{onDelete && <button type="button" onClick={() => void onDelete()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-xs font-bold text-red-600 hover:bg-red-500/15 dark:text-red-300"><Icon name="trash" className="h-4 w-4" />Удалить контрагента</button>}</div></section><aside className="space-y-4"><section className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm"><h2 className="text-sm font-black">Для документов и оплат</h2>{health.missing.length ? <p className="mt-2 text-[11px] leading-relaxed text-bx-muted">При необходимости BX попросит добавить: {health.missing.join(', ')}.</p> : <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300">Основные реквизиты доступны для подстановки.</p>}</section><section className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm"><h2 className="text-sm font-black">Что можно сделать</h2><div className="mt-3 space-y-2">{[['templates', 'Создать документ', '/documents/templates'], ['finance', 'Добавить оплату', '/finance'], ['search', 'Проверить ИНН', '/tools']].map(([icon, label, path]) => <button type="button" key={label} onClick={() => onNavigate(path)} className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-bx-border bg-bx-bg px-3 text-left text-xs font-bold hover:border-blue-500/30 hover:text-blue-600"><Icon name={icon} className="h-4 w-4" />{label}<Icon name="arrowR" className="ml-auto h-3.5 w-3.5" /></button>)}</div></section></aside></div></div></div>
}

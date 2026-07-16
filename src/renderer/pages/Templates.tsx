import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/db/localDb'
import { useCompany } from '../lib/CompanyContext'
import { useCounterparties } from '../lib/db/useCounterparties'
import { useToast } from '../lib/ui/ToastContext'
import Icon from '../lib/ui/Icon'
import DocumentWorkflowBridge from '../components/documents/DocumentWorkflowBridge'
import { TEMPLATES, TEMPLATE_CATEGORIES, type DocTemplate, type TemplateVar } from '../data/templates'
import { toWordsRu } from '../lib/numToWords'
import mammoth from 'mammoth'
import { useDocuments } from '../lib/useDocuments'
import { usePlan } from '../lib/plan'
import {
  FIELD_GROUP_META,
  getFieldHint,
  getMissingVars,
  getTemplateGuide,
  groupTemplateVars,
} from '../lib/templateGuidance'
import {
  ResourceEmpty,
  ResourceHero,
  ResourceLayout,
  ResourceNavItem,
  ResourceSectionTitle,
  ResourceSidebar,
  primaryActionClass,
  secondaryActionClass,
} from '../components/workspace/ResourceWorkspace'

const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

const CAT_META: Record<string, { icon: string; color: string; desc: string }> = {
  'Договоры':         { icon: 'contract', color: 'blue',    desc: 'Купля-продажа, услуги, аренда, займ' },
  'Акты и счета':     { icon: 'receipt',  color: 'emerald', desc: 'Акты работ, счета, сверка' },
  'Кадровые приказы': { icon: 'users',    color: 'amber',   desc: 'Приём, увольнение, отпуск, командировка' },
  'Доверенности':     { icon: 'stamp',    color: 'purple',  desc: 'Доверенность на представление' },
  'ВЭД':              { icon: 'globe',    color: 'cyan',    desc: 'Инвойс для внешней торговли' },
}

const COLOR: Record<string, { text: string; bg: string; border: string }> = {
  blue:    { text: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  amber:   { text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  purple:  { text: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  cyan:    { text: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30' },
}

const catMeta = (c: string) => CAT_META[c] ?? { icon: 'file', color: 'blue', desc: '' }
const catColor = (c: string) => COLOR[catMeta(c).color] ?? COLOR.blue

type StoredCompanyDetails = Partial<{
  director: string
  bank: string
  account: string
  mfo: string
  address: string
  phone: string
}>

function formatDateParts(iso: string): { d: string; m: string; y: string } {
  if (!iso) return { d: '___', m: '_______', y: '____' }
  const [y, mo, d] = iso.split('-')
  return { d: d || '___', m: RU_MONTHS[parseInt(mo, 10) - 1] || '_______', y: y || '____' }
}

function substituteVars(body: string, vals: Record<string, string>, vars: TemplateVar[]): string {
  let out = body
  for (const v of vars) {
    if (v.type === 'date') {
      const parts = formatDateParts(vals[v.key] || '')
      out = out.replaceAll(`{{${v.key}_d}}`, parts.d)
      out = out.replaceAll(`{{${v.key}_m}}`, parts.m)
      out = out.replaceAll(`{{${v.key}_y}}`, parts.y)
    }
  }
  const rate = parseFloat(vals['rate'] || '0')
  out = out.replaceAll('{{rate_type}}', rate === 0 ? 'беспроцентным' : `процентным (${rate}% годовых)`)
  const dd = parseInt(vals['delivery_days'] || '0', 10)
  const ddWords: Record<number, string> = { 1:'одного',2:'двух',3:'трех',4:'четырех',5:'пяти',7:'семи',10:'десяти',14:'четырнадцати',21:'двадцати одного',30:'тридцати' }
  out = out.replaceAll('{{delivery_days_w}}', ddWords[dd] || `${dd}`)
  for (const v of vars) {
    const val = vals[v.key] ?? ''
    out = out.replaceAll(`{{${v.key}}}`, val || `[${v.label}]`)
  }
  return out
}

const ruLabels: Record<string, string> = {
  contract_num: 'Номер договора',
  contract_date: 'Дата договора',
  city: 'Город',
  seller_name: 'Продавец',
  seller_tin: 'ИНН продавца',
  seller_rep: 'ФИО представителя продавца',
  buyer_name: 'Покупатель',
  buyer_tin: 'ИНН покупателя',
  buyer_rep: 'ФИО представителя покупателя',
  amount: 'Сумма договора',
  amount_words: 'Сумма прописью',
  goods: 'Наименование товара/услуги',
  company_name: 'Наше название',
  company_tin: 'Наш ИНН',
  director_name: 'ФИО директора'
}

function InputField({ v, value, onChange }: { v: TemplateVar; value: string; onChange: (val: string) => void }) {
  const fieldId = `template-field-${v.key}`
  const missing = !value.trim()
  const cls = `min-h-11 w-full rounded-xl border bg-bx-surface-2 px-3 py-2.5 text-xs font-medium text-bx-text outline-none transition-colors focus:ring-2 focus:ring-blue-500/20 ${missing ? 'border-amber-500/45 focus:border-amber-500' : 'border-bx-border focus:border-blue-500/60'}`
  if (v.type === 'textarea') return <textarea id={fieldId} aria-describedby={`${fieldId}-hint`} value={value} onChange={e => onChange(e.target.value)} placeholder={v.placeholder} rows={3} className={`${cls} resize-y`} />
  if (v.type === 'select' && v.options) return <select id={fieldId} aria-describedby={`${fieldId}-hint`} value={value} onChange={e => onChange(e.target.value)} className={cls}>{v.options.map(o => <option key={o} value={o}>{o}</option>)}</select>
  return <input id={fieldId} aria-describedby={`${fieldId}-hint`} type={v.type === 'date' ? 'date' : v.type === 'number' ? 'number' : 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={v.placeholder} className={cls} />
}

const extractVars = (body: string): TemplateVar[] => {
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g
  const matches = new Set<string>()
  let match
  while ((match = regex.exec(body)) !== null) {
    const key = match[1]
    if (!key.endsWith('_d') && !key.endsWith('_m') && !key.endsWith('_y') && key !== 'rate_type' && key !== 'delivery_days_w') {
      matches.add(key)
    }
  }
  return Array.from(matches).map(key => {
    let label = key.replace(/_/g, ' ')
    label = label.replace(/\b\w/g, c => c.toUpperCase())
    return {
      key,
      label: ruLabels[key] || label,
      type: key.includes('date') ? 'date' : key.includes('amount') || key.includes('salary') || key.includes('price') ? 'number' : 'text',
      placeholder: `Введите ${ruLabels[key] || label}`
    }
  })
}

export default function Templates() {
  const navigate = useNavigate()
  const { active, companies } = useCompany()
  const { counterparties } = useCounterparties(active?.id ?? null)
  const { documents, loadDocuments, uploadDocument } = useDocuments()
  const { limits } = usePlan()
  
  // Динамически загружаем полные реквизиты для всех компаний пользователя из настроек
  const myCompanies = useMemo(() => {
    return companies.map(c => {
      let details: StoredCompanyDetails = {}
      try {
        const stored = localStorage.getItem(`bx_company_details_${c.id}`)
        if (stored) details = JSON.parse(stored) as StoredCompanyDetails
      } catch (err) {
        console.warn('Ignore details parse error', err)
      }
      return {
        id: c.id,
        name: c.name || '',
        inn: c.inn || '',
        director: details.director || '',
        bank: details.bank || '',
        account: details.account || '',
        mfo: details.mfo || '',
        address: details.address || '',
        phone: details.phone || '',
      }
    })
  }, [companies])

  const [category, setCategory] = useState('Все')
  const [search,   setSearch]   = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [vals,     setVals]     = useState<Record<string, string>>({})
  const [copied,   setCopied]   = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState(active?.id ?? '')
  const [savingDocument, setSavingDocument] = useState(false)
  
  // Custom templates states
  const [customTpls, setCustomTpls] = useState<DocTemplate[]>([])
  const [creatingTpl, setCreatingTpl] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState('Договоры')
  const [newIcon, setNewIcon] = useState('DOC')
  const [newBody, setNewBody] = useState('')

  const toast = useToast()

  const loadCustom = async () => {
    try {
      const list = await db.templates.toArray()
      setCustomTpls(list)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadCustom()
    void loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    if (active?.id) setSelectedCompanyId(active.id)
  }, [active?.id])

  const allTemplates = useMemo(() => [...TEMPLATES, ...customTpls], [customTpls])

  const MY_PREFIXES = ['seller', 'provider', 'landlord', 'lender', 'executor', 'org1', 'company']
  const CP_PREFIXES = ['buyer', 'client', 'tenant', 'borrower', 'customer', 'recipient', 'org2']

  interface PartyData {
    name: string; inn: string; rep?: string; bank?: string;
    account?: string; mfo?: string; address?: string; phone?: string;
  }

  function fillParty(prefixes: string[], data: PartyData, extra: Record<string, string | undefined> = {}) {
    if (!tpl) return
    const bySuffix: Record<string, string | undefined> = {
      name: data.name, tin: data.inn, inn: data.inn, rep: data.rep,
      bank: data.bank, account: data.account, mfo: data.mfo,
      address: data.address, phone: data.phone,
    }
    setVals(prev => {
      const next = { ...prev }
      for (const v of tpl.vars) {
        const extraValue = extra[v.key]
        if (extraValue !== undefined) { next[v.key] = extraValue; continue }
        const m = v.key.match(/^([a-z0-9]+)_([a-z]+)$/)
        if (!m) continue
        const [, prefix, suffix] = m
        if (!prefixes.includes(prefix)) continue
        const val = bySuffix[suffix]
        if (val) next[v.key] = val
      }
      return next
    })
  }

  const handleApplyMyCompany = (reqId: string) => {
    if (!reqId) return
    const r = myCompanies.find(x => x.id === reqId)
    if (!r) return
    setSelectedCompanyId(reqId)
    fillParty(MY_PREFIXES, {
      name: r.name, inn: r.inn, rep: r.director, bank: r.bank,
      account: r.account, mfo: r.mfo, address: r.address, phone: r.phone,
    }, {
      company_name: r.name, company_tin: r.inn,
      director_name: r.director, rep_name: r.director,
    })
    toast.success('Реквизиты вашей компании применены')
  }

  const handleApplyCounterparty = (cpId: string) => {
    if (!cpId) return
    const cp = counterparties.find(c => c.id === cpId)
    if (!cp) return
    fillParty(CP_PREFIXES, {
      name: cp.name, inn: cp.inn, bank: cp.bank_name || undefined,
      account: cp.bank_account || undefined, mfo: cp.mfo || undefined,
      address: cp.address || undefined, phone: cp.phone || undefined,
    })
    toast.success('Реквизиты контрагента применены')
  }

  const filtered = useMemo(() => {
    let list = category === 'Все' ? allTemplates : allTemplates.filter(t => t.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }
    return list
  }, [category, search, allTemplates])

  const tpl: DocTemplate | null = activeId ? (allTemplates.find(t => t.id === activeId) ?? null) : null

  const handleSelectTemplate = (t: DocTemplate) => {
    setActiveId(t.id)
    setCopied(false)
    const defaults: Record<string, string> = {}
    for (const v of t.vars) defaults[v.key] = v.default ?? ''
    const selectedCompany = myCompanies.find(company => company.id === (selectedCompanyId || active?.id))
    if (selectedCompany) {
      const valuesBySuffix: Record<string, string> = {
        name: selectedCompany.name,
        tin: selectedCompany.inn,
        inn: selectedCompany.inn,
        rep: selectedCompany.director,
        bank: selectedCompany.bank,
        account: selectedCompany.account,
        mfo: selectedCompany.mfo,
        address: selectedCompany.address,
        phone: selectedCompany.phone,
      }
      for (const variable of t.vars) {
        const match = variable.key.match(/^([a-z0-9]+)_([a-z]+)$/)
        if (match && MY_PREFIXES.includes(match[1]) && valuesBySuffix[match[2]]) defaults[variable.key] = valuesBySuffix[match[2]]
      }
      if (t.vars.some(variable => variable.key === 'company_name')) defaults.company_name = selectedCompany.name
      if (t.vars.some(variable => variable.key === 'company_tin')) defaults.company_tin = selectedCompany.inn
      if (t.vars.some(variable => variable.key === 'director_name')) defaults.director_name = selectedCompany.director
      if (t.vars.some(variable => variable.key === 'rep_name')) defaults.rep_name = selectedCompany.director
      setSelectedCompanyId(selectedCompany.id)
    }
    setVals(defaults)
  }

  const handleSetVal = (key: string, val: string) => {
    setVals(prev => {
      const next = { ...prev, [key]: val }
      const wordsKey = `${key}_words`
      if (tpl?.vars.some(v => v.key === wordsKey)) {
        const n = parseFloat(val.replace(/\s/g, '').replace(',', '.'))
        if (!isNaN(n) && n >= 0) {
          const curStr = (next['currency'] ?? '').toUpperCase()
          const cur = curStr.includes('USD') ? 'usd' : curStr.includes('EUR') ? 'eur' : 'sum'
          next[wordsKey] = toWordsRu(n, cur)
        }
      }
      return next
    })
  }

  const preview = useMemo(() => tpl ? substituteVars(tpl.body, vals, tpl.vars) : '', [tpl, vals])
  const filledCount = tpl ? tpl.vars.filter(v => (vals[v.key] ?? '').trim()).length : 0
  const progress = tpl && tpl.vars.length ? Math.round(filledCount / tpl.vars.length * 100) : 0
  const missingVars = useMemo(() => tpl ? getMissingVars(tpl, vals) : [], [tpl, vals])
  const fieldGroups = useMemo(() => tpl ? groupTemplateVars(tpl.vars) : [], [tpl])
  const guide = tpl ? getTemplateGuide(tpl) : null

  const ensureComplete = () => {
    if (missingVars.length === 0) return true
    const first = missingVars[0]
    document.getElementById(`template-field-${first.key}`)?.focus()
    toast.error(`Заполните обязательные поля: осталось ${missingVars.length}. Первое — «${first.label}».`)
    return false
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(preview).catch(() => { void 0 })
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handlePrintDoc = () => {
    if (!ensureComplete()) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(docHtml())
    w.document.close()
    w.focus()
    w.print()
  }

  const handleDownloadDoc = () => {
    if (!ensureComplete()) return
    const blob = new Blob(['﻿' + docHtml()], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(tpl?.title ?? 'Документ').replace(/[^а-яa-z0-9 ]/gi, '')}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const docHtml = (): string => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tpl?.title ?? 'Документ'}</title><style>
      body{font-family:'Times New Roman',serif;font-size:13px;line-height:1.6;margin:40px;color:#000}
      pre{white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:inherit}
      @media print{body{margin:18mm}}</style></head><body><pre>${preview.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`
  }

  const handleExportPDF = async () => {
    if (!ensureComplete()) return
    if (!window.bx?.pdf?.generate) {
      toast.error('Экспорт PDF доступен только в Electron')
      return
    }
    const cleanTitle = (tpl?.title ?? 'Документ').replace(/[^а-яa-z0-9 ]/gi, '')
    const ok = await window.bx.pdf.generate(docHtml(), `${cleanTitle}.pdf`)
    if (ok) {
      toast.success('Документ успешно сохранен в PDF')
    }
  }

  const handleSaveToDocuments = async () => {
    if (!tpl || !ensureComplete()) return
    if (!selectedCompanyId) {
      toast.error('Выберите вашу компанию — документ должен быть привязан к организации.')
      return
    }
    if (documents.length >= limits.documentsMax) {
      toast.error(`Достигнут лимит хранилища: ${limits.documentsMax} документов.`)
      return
    }
    setSavingDocument(true)
    try {
      const safeTitle = tpl.title.replace(/[^а-яa-z0-9 _-]/gi, '').trim() || 'Документ'
      const file = new File(['\uFEFF' + docHtml()], `${safeTitle}.doc`, { type: 'application/msword' })
      const category = tpl.category === 'Договоры' ? 'Договор' : tpl.category === 'Акты и счета' ? 'Акт' : 'Другое'
      await uploadDocument(file, selectedCompanyId, category, ['из-шаблона', tpl.id])
      toast.success('Готовый документ сохранён в разделе «Документы»')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить документ')
    } finally {
      setSavingDocument(false)
    }
  }

  const handleSaveCustom = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error('Название и Текст обязательны')
      return
    }

    const vars = extractVars(newBody)
    const id = `custom-${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)}`
    
    const newTemplate: DocTemplate = {
      id,
      category: newCat,
      icon: newIcon || 'DOC',
      title: newTitle,
      description: newDesc,
      vars,
      body: newBody
    }

    await db.templates.put(newTemplate)
    toast.success('Кастомный шаблон успешно сохранен')
    
    setNewTitle('')
    setNewDesc('')
    setNewBody('')
    setCreatingTpl(false)
    await loadCustom()
    setActiveId(id)
  }

  const handleDeleteCustom = async (id: string) => {
    if (confirm('Вы действительно хотите удалить этот шаблон?')) {
      await db.templates.delete(id)
      toast.info('Шаблон удален')
      await loadCustom()
      setActiveId(null)
    }
  }

  const handleDocxImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const arrayBuffer = evt.target?.result as ArrayBuffer
      if (!arrayBuffer) return
      try {
        const result = await mammoth.extractRawText({ arrayBuffer })
        if (result.value) {
          setNewBody(result.value)
          toast.success('Текст из .docx успешно импортирован!')
        } else {
          toast.info('В файле .docx не найдено текста')
        }
      } catch (err) {
        console.error(err)
        toast.error('Не удалось разобрать .docx файл')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ── Режим создания шаблона ──
  if (creatingTpl) {
    return (
      <div className="flex flex-1 gap-4 overflow-hidden bg-bx-bg p-4 text-bx-text">
        {/* Форма слева */}
        <div className="flex w-80 flex-shrink-0 flex-col space-y-4 rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm">
          <div>
            <button onClick={() => setCreatingTpl(false)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-bx-muted hover:text-bx-text mb-3 cursor-pointer">
              <Icon name="arrowL" className="w-3 h-3" />Назад к списку
            </button>
            <h2 className="text-sm font-extrabold text-bx-text uppercase tracking-wider">Новый шаблон</h2>
            <p className="text-[11px] text-bx-muted mt-0.5">Создание динамического бланка</p>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Название шаблона *</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Договор оказания услуг..." className="w-full bg-bx-surface-2 text-bx-text border border-bx-border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500/50 font-medium" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Краткое описание</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Для разовых ИТ или консалтинговых услуг..." className="w-full bg-bx-surface-2 text-bx-text border border-bx-border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500/50" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Категория</label>
                <select value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full bg-bx-surface-2 text-bx-text border border-bx-border rounded-xl px-2.5 py-2.5 text-xs focus:outline-none focus:border-blue-500/50 font-semibold">
                  {TEMPLATE_CATEGORIES.filter(c => c !== 'Все').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Короткий знак</label>
                <input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="DOC" maxLength={4} className="w-full bg-bx-surface-2 text-bx-text border border-bx-border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none text-center focus:border-blue-500/50 font-bold uppercase" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-bx-border">
            <button onClick={handleSaveCustom} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer">
              Сохранить шаблон
            </button>
          </div>
        </div>

        {/* Редактор текста справа */}
        <div className="flex min-w-0 flex-1 flex-col space-y-4 overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface/40 p-5">
          <div className="flex-shrink-0 flex items-start justify-between bg-bx-surface border border-bx-border rounded-2xl p-4.5 shadow-sm">
            <div className="max-w-xl">
              <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">Текст шаблона документа</h3>
              <p className="text-[11px] text-bx-muted mt-1 leading-relaxed">
                Используйте двойные фигурные скобки для вставки динамических переменных. Пример: <code className="text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-500/10 px-1 py-0.5 rounded">{"{{buyer_name}}"}</code>, <code className="text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-500/10 px-1 py-0.5 rounded">{"{{amount}}"}</code>, <code className="text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-500/10 px-1 py-0.5 rounded">{"{{contract_date}}"}</code>.
              </p>
            </div>
            <div>
              <label className="px-3.5 py-2 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Импорт из .docx
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleDocxImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="ДОГОВОР № {{contract_num}}&#10;&#10;г. {{city}}                  «{{contract_date}}»&#10;&#10;Мы, нижеподписавшиеся..."
              className="w-full h-full bg-bx-surface text-bx-text border border-bx-border rounded-2xl p-5 text-xs font-mono focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed shadow-sm"
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Режим заполнения ──
  if (tpl) {
    const cc = catColor(tpl.category)
    const isCustom = tpl.id.startsWith('custom-')
    return (
      <div className="flex flex-1 overflow-y-auto bg-bx-bg text-bx-text custom-scrollbar">
        <div className="bx-page-container w-full space-y-5 py-5">
          <header className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border ${cc.bg} ${cc.text} ${cc.border}`}><Icon name={isCustom ? 'file' : catMeta(tpl.category).icon} className="h-5 w-5" /></span>
                <div>
                  <button type="button" onClick={() => setActiveId(null)} className="mb-1 inline-flex min-h-8 items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-bx-muted hover:text-bx-text"><Icon name="arrowL" className="h-3 w-3" />Все шаблоны</button>
                  <h1 className="text-xl font-black tracking-tight text-bx-text">{tpl.title}</h1>
                  <p className="mt-1 max-w-3xl text-xs leading-relaxed text-bx-muted">{guide?.whenToUse}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-bx-border bg-bx-surface-2 p-1.5" aria-label="Этапы подготовки документа">
                {['1. Стороны', '2. Условия', '3. Проверка'].map((step, index) => <span key={step} className={`rounded-lg px-3 py-2 text-[10px] font-black ${progress >= [1, 50, 100][index] ? 'bg-blue-600 text-white' : 'text-bx-muted'}`}>{step}</span>)}
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_240px]">
              <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-bx-muted">1. Подставить нашу компанию
                <select value={selectedCompanyId} onChange={e => handleApplyMyCompany(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-bold text-bx-text outline-none focus:border-blue-500">
                  <option value="">Выберите организацию</option>{myCompanies.map(r => <option key={r.id} value={r.id}>{r.name}{r.inn ? ` · ИНН ${r.inn}` : ''}</option>)}
                </select>
              </label>
              <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-bx-muted">2. Подставить контрагента
                <select defaultValue="" onChange={e => handleApplyCounterparty(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-bold text-bx-text outline-none focus:border-blue-500">
                  <option value="">Выберите из справочника</option>{counterparties.map(c => <option key={c.id} value={c.id}>{c.name} · ИНН {c.inn}</option>)}
                </select>
              </label>
              <div className="rounded-xl border border-bx-border bg-bx-surface-2 p-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider"><span>Готовность</span><span className={missingVars.length ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}>{progress}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bx-border"><div className={`h-full rounded-full transition-all ${missingVars.length ? 'bg-blue-600' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-[10px] text-bx-muted">{missingVars.length ? `Осталось заполнить: ${missingVars.length}` : 'Все поля заполнены — можно сохранять'}</p>
              </div>
            </div>
          </header>

          <DocumentWorkflowBridge current="templates" />

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(420px,0.9fr)_minmax(560px,1.1fr)]">
            <div className="space-y-4">
              <section className="rounded-[20px] border border-blue-500/20 bg-blue-500/[0.055] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Что получится</p>
                <p className="mt-1 text-xs font-bold leading-relaxed text-bx-text">{guide?.result}</p>
              </section>
              {fieldGroups.length ? fieldGroups.map((group, groupIndex) => {
                const meta = FIELD_GROUP_META[group.id]
                const groupMissing = group.vars.filter(variable => !(vals[variable.key] ?? '').trim()).length
                return <section key={group.id} className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Блок {groupIndex + 1}</p><h2 className="mt-0.5 text-sm font-black text-bx-text">{meta.title}</h2><p className="mt-0.5 text-[11px] text-bx-muted">{meta.description}</p></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${groupMissing ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>{groupMissing ? `${groupMissing} не заполнено` : 'Готово'}</span></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {group.vars.map(v => <div key={v.key} className={v.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label htmlFor={`template-field-${v.key}`} className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-bx-text">{v.label} <span className="text-amber-600" aria-label="обязательное поле">*</span></label>
                      <InputField v={v} value={vals[v.key] ?? ''} onChange={val => handleSetVal(v.key, val)} />
                      <p id={`template-field-${v.key}-hint`} className="mt-1.5 text-[10px] leading-relaxed text-bx-muted">{getFieldHint(v)}</p>
                    </div>)}
                  </div>
                </section>
              }) : <ResourceEmpty icon="file" title="В этом шаблоне нет переменных" description="Текст уже готов: проверьте его справа и выгрузите удобным способом." />}
            </div>

            <div className="space-y-4 xl:sticky xl:top-5">
              <section className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-bx-muted">Предпросмотр</p><h2 className="mt-0.5 text-sm font-black text-bx-text">Проверьте документ целиком</h2></div><span className="text-[10px] font-bold text-bx-muted">Поля в [скобках] ещё не заполнены</span></div>
                <div className="mt-4 max-h-[620px] overflow-y-auto rounded-xl border border-bx-border bg-white p-8 text-gray-900 custom-scrollbar"><pre className="whitespace-pre-wrap break-words text-xs font-medium leading-relaxed" style={{ fontFamily: "'Times New Roman', serif" }}>{preview}</pre></div>
              </section>
              <section className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm">
                <h2 className="text-sm font-black text-bx-text">Перед сохранением проверьте</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">{guide?.checks.map((check, index) => <div key={check} className="flex gap-2 rounded-xl border border-bx-border bg-bx-surface-2 p-3 text-[10px] font-semibold leading-relaxed text-bx-text"><span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-blue-600 text-[9px] font-black text-white">{index + 1}</span>{check}</div>)}</div>
                {missingVars.length > 0 && <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-[11px] font-bold text-amber-800 dark:text-amber-200"><Icon name="alert" className="mt-0.5 h-4 w-4 flex-shrink-0" />Нельзя выгрузить неполный бланк. Заполните ещё {missingVars.length}: {missingVars.slice(0, 3).map(v => v.label).join(', ')}{missingVars.length > 3 ? '…' : ''}</div>}
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <button type="button" disabled={savingDocument || missingVars.length > 0} onClick={handleSaveToDocuments} className="sm:col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"><Icon name="save" className="h-4 w-4" />{savingDocument ? 'Сохраняю…' : 'Сохранить в Документы'}</button>
                  <button type="button" onClick={handleExportPDF} className={secondaryActionClass}><Icon name="download" className="h-4 w-4" />PDF</button>
                  <button type="button" onClick={handleDownloadDoc} className={secondaryActionClass}><Icon name="word" className="h-4 w-4" />Word</button>
                  <button type="button" onClick={handlePrintDoc} className={secondaryActionClass}><Icon name="printer" className="h-4 w-4" />Печать</button>
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2"><button type="button" onClick={handleCopyText} className="inline-flex min-h-10 items-center gap-2 px-2 text-[10px] font-black text-bx-muted hover:text-bx-text"><Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />{copied ? 'Текст скопирован' : 'Скопировать текст'}</button><button type="button" onClick={() => navigate('/documents')} className="inline-flex min-h-10 items-center gap-1 px-2 text-[10px] font-black text-blue-600 dark:text-blue-300">Открыть Документы <Icon name="arrowR" className="h-3.5 w-3.5" /></button></div>
                {isCustom && <button type="button" onClick={() => handleDeleteCustom(tpl.id)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-600 hover:bg-red-500/15 dark:text-red-300"><Icon name="trash" className="h-4 w-4" />Удалить личный шаблон</button>}
              </section>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Галерея ──
  const sidebar = (
    <ResourceSidebar icon="templates" title="Шаблоны" subtitle={`${allTemplates.length} готовых и личных бланков`} search={search} searchPlaceholder="Найти документ" onSearch={setSearch} onClear={() => setSearch('')} label="Категории документов" footer={<button type="button" onClick={() => setCreatingTpl(true)} className={`${primaryActionClass} w-full`}><Icon name="plus" className="h-4 w-4" />Создать шаблон</button>}>
      {TEMPLATE_CATEGORIES.map(c => {
        const count = allTemplates.filter(t => c === 'Все' || t.category === c).length
        return <ResourceNavItem key={c} icon={c === 'Все' ? 'folder' : catMeta(c).icon} label={c === 'Все' ? 'Все шаблоны' : c} count={count} active={category === c && !search.trim()} onClick={() => { setCategory(c); setSearch('') }} />
      })}
    </ResourceSidebar>
  )

  return (
    <ResourceLayout sidebar={sidebar}>
      <div className="space-y-6">
        <ResourceHero eyebrow="Документ из реквизитов за несколько минут" title="Бланки, которые не приходится собирать заново" description="Выберите документ, подставьте свою компанию и контрагента, проверьте поля и выгрузите готовый результат. Личные шаблоны живут рядом со встроенными." icon="templates" stats={[{ value: allTemplates.length, label: 'шаблонов' }, { value: customTpls.length, label: 'создано вами' }, { value: filtered.length, label: search ? 'найдено' : 'в категории' }]} actions={<button type="button" onClick={() => setCreatingTpl(true)} className={primaryActionClass}><Icon name="plus" className="h-4 w-4" />Создать шаблон</button>} />
        <DocumentWorkflowBridge current="templates" />
        <section className="space-y-3.5">
          <ResourceSectionTitle title={search.trim() ? `Результаты по запросу «${search.trim()}»` : category === 'Все' ? 'Все шаблоны' : category} subtitle="Откройте бланк, заполните реквизиты и проверьте предпросмотр перед выгрузкой" count={filtered.length} action={search.trim() ? <button type="button" onClick={() => setSearch('')} className={secondaryActionClass}>Очистить поиск</button> : undefined} />
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map(t => {
                const cc = catColor(t.category)
                const isCustom = t.id.startsWith('custom-')
                const cardGuide = getTemplateGuide(t)
                return (
                  <button type="button" key={t.id} onClick={() => handleSelectTemplate(t)} className="group flex min-h-[240px] cursor-pointer flex-col rounded-[20px] border border-bx-border bg-bx-surface p-4.5 text-left shadow-sm outline-none transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.035] focus-visible:ring-2 focus-visible:ring-blue-500">
                    <div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl border ${cc.bg} ${cc.text} ${cc.border}`}><Icon name={isCustom ? 'file' : catMeta(t.category).icon} className="h-[18px] w-[18px]" /></span><span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${cc.bg} ${cc.text} ${cc.border}`}>{t.category}</span></div>
                    <h4 className="mt-4 text-[13px] font-black leading-snug text-bx-text transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">{t.title}</h4>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-bx-muted">{cardGuide.whenToUse}</p>
                    <div className="mt-3 rounded-xl border border-bx-border bg-bx-surface-2 p-2.5"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-bx-muted">На выходе</p><p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-relaxed text-bx-text">{cardGuide.result}</p></div>
                    <div className="mt-auto flex items-center justify-between border-t border-bx-border pt-3 text-[10px] font-bold"><span className="text-bx-muted">{t.vars.length} полей</span><span className="flex items-center gap-1 text-blue-600 dark:text-blue-300">Заполнить <Icon name="arrowR" className="h-3.5 w-3.5" /></span></div>
                  </button>
                )
              })}
            </div>
          ) : <ResourceEmpty icon="file" title="Шаблоны не найдены" description="Измените запрос, выберите другую категорию или создайте собственный документ." action={<button type="button" onClick={() => { setSearch(''); setCategory('Все') }} className={secondaryActionClass}>Показать все шаблоны</button>} />}
        </section>
      </div>
    </ResourceLayout>
  )
}

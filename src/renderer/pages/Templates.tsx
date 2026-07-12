import React, { useState, useMemo, useEffect } from 'react'
import { TEMPLATES, TEMPLATE_CATEGORIES, type DocTemplate, type TemplateVar } from '../data/templates'
import { useToast } from '../lib/ui/ToastContext'
import mammoth from 'mammoth'
import { useCompany } from '../lib/CompanyContext'
import { useCounterparties } from '../lib/db/useCounterparties'
import { db } from '../lib/db/localDb'
import { toWordsRu } from '../lib/numToWords'

const RU_MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

// ── SVG-иконки ──────────────────────────────────────────────────────────────
const PATHS: Record<string, React.ReactNode> = {
  contract: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M8 7h8M8 11h8M8 15h5" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  stamp: <><path d="M5 22h14M6 18h12v-2a4 4 0 0 0-1.4-3l-1.6-1.3a3 3 0 0 1-1-2.3V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v4.4a3 3 0 0 1-1 2.3L7.4 13A4 4 0 0 0 6 16Z" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  printer: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></>,
  word: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13l1.5 5 1.5-4 1.5 4 1.5-5" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  arrowL: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
  trash: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></>
}
function Icon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{PATHS[name] ?? null}</svg>
}

const CAT_META: Record<string, { icon: string; color: string; desc: string }> = {
  'Договоры':         { icon: 'contract', color: 'blue',    desc: 'Купля-продажа, услуги, аренда, займ' },
  'Акты и счета':     { icon: 'receipt',  color: 'emerald', desc: 'Акты работ, счета, сверка' },
  'Кадровые приказы': { icon: 'users',    color: 'amber',   desc: 'Приём, увольнение, отпуск, командировка' },
  'Доверенности':     { icon: 'stamp',    color: 'purple',  desc: 'Доверенность на представление' },
  'ВЭД':              { icon: 'globe',    color: 'cyan',    desc: 'Инвойс для внешней торговли' },
}
const COLOR: Record<string, { text: string; bg: string; ring: string }> = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    ring: 'hover:border-blue-500/40' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'hover:border-emerald-500/40' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'hover:border-amber-500/40' },
  purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  ring: 'hover:border-purple-500/40' },
  cyan:    { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    ring: 'hover:border-cyan-500/40' },
}
const catMeta = (c: string) => CAT_META[c] ?? { icon: 'file', color: 'blue', desc: '' }
const catColor = (c: string) => COLOR[catMeta(c).color] ?? COLOR.blue

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
  const ddWords: Record<number, string> = { 1:'одного',2:'двух',3:'трёх',4:'четырёх',5:'пяти',7:'семи',10:'десяти',14:'четырнадцати',21:'двадцати одного',30:'тридцати' }
  out = out.replaceAll('{{delivery_days_w}}', ddWords[dd] || `${dd}`)
  for (const v of vars) {
    const val = vals[v.key] ?? ''
    out = out.replaceAll(`{{${v.key}}}`, val || `[${v.label}]`)
  }
  return out
}

function InputField({ v, value, onChange }: { v: TemplateVar; value: string; onChange: (val: string) => void }) {
  const cls = 'w-full bg-bx-bg text-bx-text border border-bx-border-2 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 transition-colors'
  if (v.type === 'textarea') return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={v.placeholder} rows={3} className={`${cls} resize-none`} />
  if (v.type === 'select' && v.options) return <select value={value} onChange={e => onChange(e.target.value)} className={cls}>{v.options.map(o => <option key={o} value={o}>{o}</option>)}</select>
  return <input type={v.type === 'date' ? 'date' : v.type === 'number' ? 'number' : 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={v.placeholder} className={cls} />
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
    return {
      key,
      label: ruLabels[key] || label,
      type: key.includes('date') ? 'date' : key.includes('amount') || key.includes('salary') || key.includes('price') ? 'number' : 'text',
      placeholder: `Введите ${ruLabels[key] || label}`
    }
  })
}

export default function Templates() {
  const { active } = useCompany()
  const { counterparties } = useCounterparties(active?.id ?? null)
  // «Мои компании» из раздела Организации (localStorage)
  const [myCompanies] = useState<Array<{ id: string; name: string; inn: string; director: string; bank: string; account: string; mfo: string; address: string; phone: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('bx_company_requisites') || '[]') } catch { return [] }
  })
  const [category, setCategory] = useState('Все')
  const [search,   setSearch]   = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [vals,     setVals]     = useState<Record<string, string>>({})
  const [copied,   setCopied]   = useState(false)
  
  // Custom templates states
  const [customTpls, setCustomTpls] = useState<DocTemplate[]>([])
  const [creatingTpl, setCreatingTpl] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState('Договоры')
  const [newIcon, setNewIcon] = useState('📄')
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
  }, [])

  const allTemplates = useMemo(() => [...TEMPLATES, ...customTpls], [customTpls])

  // ── Автозаполнение сторон договора ──
  // «Моя сторона» — продавец/исполнитель/арендодатель; контрагент — покупатель/заказчик.
  // Заполняем строго по префиксу стороны, чтобы контрагент не затирал реквизиты продавца.
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
        if (extra[v.key] !== undefined) { next[v.key] = extra[v.key]!; continue }
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
    setVals(defaults)
  }

  const handleSetVal = (key: string, val: string) => {
    setVals(prev => {
      const next = { ...prev, [key]: val }
      // Автопрописью: если в шаблоне есть поле `<key>_words`, генерируем из числа
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

  const handleCopyText = () => {
    navigator.clipboard.writeText(preview).catch(() => { void 0 })
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handlePrintDoc = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(docHtml())
    w.document.close()
    w.focus()
    w.print()
  }

  const handleDownloadDoc = () => {
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
      icon: newIcon || '📄',
      title: newTitle,
      description: newDesc,
      vars,
      body: newBody
    }

    await db.templates.put(newTemplate)
    toast.success('Кастомный шаблон успешно сохранен')
    
    // Сбрасываем форму
    setNewTitle('')
    setNewDesc('')
    setNewBody('')
    setCreatingTpl(false)
    await loadCustom()
    setActiveId(id)
  }

  const handleDeleteCustom = async (id: string) => {
    await db.templates.delete(id)
    toast.info('Кастомный шаблон удален')
    await loadCustom()
    setActiveId(null)
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
      <div className="flex-1 flex overflow-hidden bg-bx-bg">
        {/* Форма слева */}
        <div className="w-80 flex-shrink-0 border-r border-bx-border flex flex-col p-4 bg-bx-surface/30 space-y-4">
          <div>
            <button onClick={() => setCreatingTpl(false)} className="flex items-center gap-1.5 text-[11px] text-bx-muted hover:text-bx-text mb-2">
              <Icon name="arrowL" className="w-3 h-3" />Назад
            </button>
            <h2 className="text-sm font-bold text-bx-text">Новый шаблон</h2>
            <p className="text-[10px] text-bx-muted">Создание динамического бланка</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-bx-muted uppercase tracking-wider mb-1">Название *</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Договор субподряда..." className="w-full bg-bx-bg text-bx-text border border-bx-border-2 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-bx-muted uppercase tracking-wider mb-1">Описание</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Для выполнения отдельных ИТ-работ..." className="w-full bg-bx-bg text-bx-text border border-bx-border-2 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-bx-muted uppercase tracking-wider mb-1">Категория</label>
                <select value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full bg-bx-bg text-bx-text border border-bx-border-2 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500/50">
                  {TEMPLATE_CATEGORIES.filter(c => c !== 'Все').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-bx-muted uppercase tracking-wider mb-1">Эмодзи-иконка</label>
                <input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="📄" className="w-full bg-bx-bg text-bx-text border border-bx-border-2 rounded-lg px-3 py-1.5 text-xs focus:outline-none text-center focus:border-blue-500/50" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleSaveCustom} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors shadow-lg">
              Сохранить шаблон
            </button>
          </div>
        </div>

        {/* Редактор текста справа */}
        <div className="flex-1 flex flex-col p-6 space-y-4">
          <div className="flex-shrink-0 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-bx-text">Текст шаблона документа</h3>
              <p className="text-xs text-bx-muted mt-0.5">
                Вставляйте переменные в двойных фигурных скобках. Например: <code className="text-blue-400 font-mono font-bold bg-blue-500/10 px-1 py-0.5 rounded">{"{{buyer_name}}"}</code>, <code className="text-blue-400 font-mono font-bold bg-blue-500/10 px-1 py-0.5 rounded">{"{{amount}}"}</code>, <code className="text-blue-400 font-mono font-bold bg-blue-500/10 px-1 py-0.5 rounded">{"{{contract_date}}"}</code>.
              </p>
            </div>
            <div>
              <label className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Импорт .docx
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
              className="w-full h-full bg-bx-surface text-bx-text border border-bx-border-2 rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
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
      <div className="flex-1 flex overflow-hidden bg-bx-bg">
        {/* Форма */}
        <div className="w-80 flex-shrink-0 border-r border-bx-border flex flex-col bg-bx-surface/10">
          <div className="px-4 py-3 border-b border-bx-border">
            <button onClick={() => setActiveId(null)} className="flex items-center gap-1.5 text-[11px] text-bx-muted hover:text-bx-text mb-2">
              <Icon name="arrowL" className="w-3 h-3" />Все шаблоны
            </button>
            <div className="flex items-center gap-2.5">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cc.bg} ${cc.text}`}>
                {isCustom ? <span className="text-lg">{tpl.icon}</span> : <Icon name={catMeta(tpl.category).icon} className="w-5 h-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-bx-text leading-tight truncate">{tpl.title}</p>
                <p className="text-[10px] text-bx-muted">{tpl.category}</p>
              </div>
            </div>
            {/* Автозаполнение сторон из Организаций */}
            {myCompanies.length > 0 && (
              <div className="mt-3">
                <label className="block text-[10px] font-semibold text-bx-muted mb-1 uppercase tracking-wider">Моя компания (продавец / исполнитель)</label>
                <select
                  onChange={e => handleApplyMyCompany(e.target.value)}
                  defaultValue=""
                  className="w-full bg-bx-bg text-bx-text text-[11px] rounded-lg border border-bx-border-2 px-2 py-1.5 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">-- Выберите компанию --</option>
                  {myCompanies.map(r => (
                    <option key={r.id} value={r.id}>{r.name}{r.inn ? ` (ИНН: ${r.inn})` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            {counterparties.length > 0 && (
              <div className="mt-2">
                <label className="block text-[10px] font-semibold text-bx-muted mb-1 uppercase tracking-wider">Контрагент (покупатель / заказчик)</label>
                <select
                  onChange={e => handleApplyCounterparty(e.target.value)}
                  defaultValue=""
                  className="w-full bg-bx-bg text-bx-text text-[11px] rounded-lg border border-bx-border-2 px-2 py-1.5 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">-- Выберите контрагента --</option>
                  {counterparties.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (ИНН: {c.inn})</option>
                  ))}
                </select>
              </div>
            )}
            {myCompanies.length === 0 && (
              <p className="mt-3 text-[10px] text-bx-muted">
                Добавьте свою фирму в «Организации → Мои компании» — реквизиты будут подставляться сюда одним кликом.
              </p>
            )}
            {/* Прогресс */}
            {tpl.vars.length > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-bx-muted mb-1"><span>Заполнено</span><span>{filledCount}/{tpl.vars.length}</span></div>
                <div className="h-1.5 bg-bx-bg rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {tpl.vars.length === 0 ? (
              <p className="text-xs text-bx-muted text-center py-8">В этом шаблоне нет переменных для заполнения.</p>
            ) : (
              tpl.vars.map(v => (
                <div key={v.key}>
                  <label className="block text-[10px] font-medium text-bx-muted mb-1">{v.label}</label>
                  <InputField v={v} value={vals[v.key] ?? ''} onChange={val => handleSetVal(v.key, val)} />
                </div>
              ))
            )}
          </div>
          
          <div className="px-4 py-3 border-t border-bx-border space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              <button onClick={handlePrintDoc} className="flex flex-col items-center gap-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded-lg transition-colors">
                <Icon name="printer" className="w-4 h-4" />Печать
              </button>
              <button onClick={handleExportPDF} className="flex flex-col items-center gap-1 py-2 bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text text-[10px] rounded-lg transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                PDF
              </button>
              <button onClick={handleDownloadDoc} className="flex flex-col items-center gap-1 py-2 bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text text-[10px] rounded-lg transition-colors">
                <Icon name="word" className="w-4 h-4" />Word
              </button>
              <button onClick={handleCopyText} className={`flex flex-col items-center gap-1 py-2 text-[10px] rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text'}`}>
                <Icon name={copied ? 'check' : 'copy'} className="w-4 h-4" />{copied ? 'Готово' : 'Копир.'}
              </button>
            </div>
            
            {isCustom && (
              <button onClick={() => handleDeleteCustom(tpl.id)} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 hover:bg-red-500/15 text-red-400 text-[10px] rounded-lg border border-red-500/15 transition-colors">
                <Icon name="trash" className="w-3.5 h-3.5" />Удалить этот шаблон
              </button>
            )}
          </div>
        </div>

        {/* Предпросмотр */}
        <div className="flex-1 overflow-y-auto bg-bx-bg p-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] text-bx-muted mb-3 text-center">Предпросмотр · незаполненные поля показаны [в скобках]</p>
            <div className="bg-white rounded-xl shadow-2xl p-10">
              <pre className="text-[11px] leading-relaxed text-gray-900 whitespace-pre-wrap break-words" style={{ fontFamily: "'Times New Roman', serif" }}>{preview}</pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Галерея ──
  return (
    <div className="flex-1 overflow-y-auto bg-bx-bg">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="text-center mb-8 relative">
          <button onClick={() => setCreatingTpl(true)} className="absolute right-0 top-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer">
            + Создать шаблон
          </button>

          <span className="inline-flex w-14 h-14 rounded-2xl bg-blue-600/15 text-blue-400 items-center justify-center mb-4">
            <Icon name="file" className="w-7 h-7" />
          </span>
          <h1 className="text-2xl font-bold text-bx-text mb-2">Шаблоны документов</h1>
          <p className="text-sm text-bx-muted max-w-lg mx-auto mb-6">Готовые бланки для бухгалтера РУз. Заполните поля — документ соберётся сам. Печать, Word и копирование.</p>
          <div className="relative max-w-xl mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bx-muted"><Icon name="search" className="w-5 h-5" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Найти шаблон: договор, приказ, акт..."
              className="w-full bg-bx-surface text-bx-text pl-12 pr-4 py-3.5 rounded-2xl border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm shadow-lg transition-colors" />
          </div>
        </div>

        {/* Фильтр категорий */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-8">
          {TEMPLATE_CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setSearch(''); }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${category === c && !search ? 'bg-blue-600 text-white' : 'bg-bx-surface border border-bx-border text-bx-muted hover:text-bx-text'}`}>{c}</button>
          ))}
        </div>

        {/* Сетка шаблонов */}
        {search.trim() && <p className="text-xs text-bx-muted mb-3">Найдено: {filtered.length}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(t => {
            const cc = catColor(t.category)
            const isCustom = t.id.startsWith('custom-')
            return (
              <button key={t.id} onClick={() => handleSelectTemplate(t)}
                className={`text-left bg-bx-surface border border-bx-border ${cc.ring} rounded-2xl p-4 transition-colors group flex items-start gap-3`}>
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cc.bg} ${cc.text}`}>
                  {isCustom ? <span className="text-lg">{t.icon}</span> : <Icon name={catMeta(t.category).icon} className="w-5 h-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-bx-text group-hover:text-white transition-colors leading-tight truncate">{t.title}</p>
                  <p className="text-[11px] text-bx-muted mt-1 leading-snug line-clamp-2">{t.description}</p>
                  <p className={`text-[10px] mt-2 ${cc.text}`}>{t.category} · {t.vars.length} полей</p>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <p className="text-sm text-bx-muted text-center py-10 col-span-2">Шаблоны не найдены</p>}
        </div>
      </div>
    </div>
  )
}

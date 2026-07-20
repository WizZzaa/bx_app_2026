import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../lib/CompanyContext'
import { useDocuments, type BxUserDocument } from '../lib/useDocuments'
import { usePlan } from '../lib/plan'
import { TARIFF_MATRIX } from '../../shared/tariffs'
import Icon from '../lib/ui/Icon'
import DocumentsTabs from '../components/documents/DocumentsTabs'
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

const CATEGORIES = ['Договор', 'Акт', 'Устав', 'Справка', 'Другое']
const CATEGORY_ICON: Record<string, string> = { Договор: 'contract', Акт: 'receipt', Устав: 'government', Справка: 'note', Другое: 'file' }

export default function Documents() {
  const navigate = useNavigate()
  const { companies, active } = useCompany()
  const { limits, plan } = usePlan()
  const { documents, loading, loadDocuments, uploadDocument, deleteDocument, downloadDocument } = useDocuments()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [customName, setCustomName] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [category, setCategory] = useState('Другое')
  const [tagsInput, setTagsInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxFileBytes = TARIFF_MATRIX[plan].maxFileBytes

  useEffect(() => { void loadDocuments() }, [loadDocuments])
  useEffect(() => {
    if (active) {
      setTargetCompany(active.id)
      setFilterCompany(active.id)
    } else if (companies.length > 0) {
      setTargetCompany(companies[0].id)
    }
  }, [active, companies])

  const chooseFile = (file: File) => {
    if (maxFileBytes <= 0) {
      setUploadError('Загрузка собственных файлов недоступна на тарифе Free.')
      setUploadOpen(true)
      return
    }
    if (file.size > maxFileBytes) {
      setUploadError(`Файл больше лимита тарифа — ${maxFileBytes / 1024 / 1024} МБ.`)
      setUploadOpen(true)
      return
    }
    setSelectedFile(file)
    setCustomName(file.name)
    setUploadOpen(true)
    setUploadError(null)
    setUploadSuccess(false)
  }

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(event.type === 'dragenter' || event.type === 'dragover')
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) chooseFile(file)
  }

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFile || !targetCompany || !customName.trim()) return
    if (documents.length >= limits.documentsMax) {
      setUploadError(`Достигнут лимит тарифа: ${limits.documentsMax} документов.`)
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean)
      const finalFile = customName.trim() === selectedFile.name ? selectedFile : new File([selectedFile], customName.trim(), { type: selectedFile.type })
      await uploadDocument(finalFile, targetCompany, category, tags)
      setSelectedFile(null)
      setCustomName('')
      setTagsInput('')
      setCategory('Другое')
      setUploadSuccess(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Не удалось загрузить файл. Проверьте формат и размер по лимиту тарифа.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (document: BxUserDocument) => {
    if (!window.confirm(`Удалить «${document.file_name}»? Восстановить файл не получится.`)) return
    try { await deleteDocument(document.id, document.file_url) } catch (error) { window.alert(error instanceof Error ? error.message : 'Не удалось удалить документ') }
  }

  const filteredDocs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return documents.filter(document => {
      if (query && !document.file_name.toLowerCase().includes(query) && !(document.tags ?? []).some(tag => tag.toLowerCase().includes(query))) return false
      if (filterCompany && document.company_id !== filterCompany) return false
      if (filterCategory && document.category !== filterCategory) return false
      return true
    })
  }, [documents, filterCategory, filterCompany, search])

  const companyMap = useMemo(() => new Map(companies.map(company => [company.id, company.name])), [companies])
  const usedPercent = Number.isFinite(limits.documentsMax) && limits.documentsMax > 0 ? Math.min(100, Math.round(documents.length / limits.documentsMax * 100)) : 0
  const resetFilters = () => { setSearch(''); setFilterCategory(''); setFilterCompany('') }

  const sidebar = <ResourceSidebar icon="note" title="Документы" subtitle="Готовые файлы и созданные бланки" search={search} searchPlaceholder="Название или тег" onSearch={setSearch} onClear={() => setSearch('')} label="Тип документа" footer={<button type="button" onClick={() => setUploadOpen(open => !open)} className={`${secondaryActionClass} w-full`}><Icon name={uploadOpen ? 'crossSmall' : 'plus'} className="h-4 w-4" />{uploadOpen ? 'Закрыть загрузку' : 'Загрузить файл'}</button>}>
    <ResourceNavItem icon="folder" label="Все документы" count={documents.length} active={!filterCategory} onClick={() => setFilterCategory('')} />
    {CATEGORIES.map(item => <ResourceNavItem key={item} icon={CATEGORY_ICON[item]} label={item} count={documents.filter(document => document.category === item).length} active={filterCategory === item} onClick={() => setFilterCategory(item)} />)}
  </ResourceSidebar>

  return <ResourceLayout sidebar={sidebar}>
    <div className="space-y-6">
      <DocumentsTabs current="documents" />
      <ResourceHero eyebrow="Мои документы" title="Готовые файлы в одном архиве" description="Создайте документ из шаблона или загрузите готовый файл. Каждый документ привязан к организации, категории и поисковым меткам." icon="note" stats={[{ value: documents.length, label: 'всего файлов' }, { value: filteredDocs.length, label: 'видно сейчас' }, { value: Number.isFinite(limits.documentsMax) ? `${usedPercent}%` : 'Без лимита', label: 'занято по тарифу' }]} actions={<><button type="button" onClick={() => navigate('/documents/templates')} className={primaryActionClass}><Icon name="templates" className="h-4 w-4" />Создать по шаблону</button><button type="button" onClick={() => setUploadOpen(true)} className={secondaryActionClass}><Icon name="download" className="h-4 w-4 rotate-180" />Загрузить готовый</button></>} />

      {uploadOpen && <form onSubmit={handleUpload} className="rounded-[22px] border border-blue-500/20 bg-bx-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Загрузка готового файла</p><h2 className="mt-1 text-base font-black text-bx-text">Сначала файл, затем понятные реквизиты</h2><p className="mt-1 text-[11px] text-bx-muted">{maxFileBytes ? `PDF, Word или изображение до ${maxFileBytes / 1024 / 1024} МБ.` : 'На тарифе Free загрузка файлов недоступна.'} Поля со звёздочкой обязательны.</p></div>{uploadSuccess && <span role="status" className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-700 dark:text-emerald-300"><Icon name="check" className="h-4 w-4" />Документ сохранён</span>}</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="relative">
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={event => { const file = event.target.files?.[0]; if (file) chooseFile(file) }} className="sr-only" tabIndex={-1} />
            <button type="button" onClick={() => fileInputRef.current?.click()} onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} className={`flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${isDragActive ? 'border-blue-500 bg-blue-500/10' : selectedFile ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-bx-border-2 bg-bx-bg hover:border-blue-500/45'}`}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name={selectedFile ? 'check' : 'download'} className={`h-5 w-5 ${selectedFile ? '' : 'rotate-180'}`} /></span>
            <span className="mt-3 max-w-full truncate text-xs font-black text-bx-text">{selectedFile ? selectedFile.name : 'Выбрать или перетащить файл'}</span>
            <span className="mt-1 text-[10px] text-bx-muted">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} МБ · нажмите, чтобы заменить` : 'PDF · DOC/DOCX · JPG/PNG'}</span>
            </button>
          </div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-bx-text">Название *<input required value={customName} onChange={event => setCustomName(event.target.value)} placeholder="Например: Договор аренды 2026.docx" className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-semibold text-bx-text outline-none focus:border-blue-500" /></label>
            <label className="text-[10px] font-black uppercase tracking-wider text-bx-text">Организация *<select required value={targetCompany} onChange={event => setTargetCompany(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-semibold text-bx-text outline-none focus:border-blue-500"><option value="">Выберите организацию</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}{company.inn ? ` · ИНН ${company.inn}` : ''}</option>)}</select></label>
            <label className="text-[10px] font-black uppercase tracking-wider text-bx-text">Тип документа *<select value={category} onChange={event => setCategory(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-semibold text-bx-text outline-none focus:border-blue-500">{CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="text-[10px] font-black uppercase tracking-wider text-bx-text">Теги<input value={tagsInput} onChange={event => setTagsInput(event.target.value)} placeholder="аренда, 2026, оригинал" className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-semibold text-bx-text outline-none focus:border-blue-500" /><span className="mt-1.5 block normal-case tracking-normal text-bx-muted">Через запятую — для быстрого поиска.</span></label>
            {uploadError && <div role="alert" className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-[11px] font-bold text-red-700 dark:text-red-300"><Icon name="alert" className="h-4 w-4 flex-shrink-0" />{uploadError}</div>}
            <button type="submit" disabled={!selectedFile || uploading} className={`${primaryActionClass} sm:col-span-2 sm:justify-self-start`}><Icon name="save" className="h-4 w-4" />{uploading ? 'Сохраняю…' : 'Сохранить в Документы'}</button>
          </div>
        </div>
      </form>}

      <section className="space-y-4">
        <ResourceSectionTitle headingLevel="h2" title="Мои документы" subtitle="Фильтры работают вместе: поиск, организация и тип документа" count={filteredDocs.length} action={(search || filterCategory || filterCompany) ? <button type="button" onClick={resetFilters} className={secondaryActionClass}>Сбросить фильтры</button> : undefined} />
        <div className="flex flex-wrap items-end gap-3 rounded-[18px] border border-bx-border bg-bx-surface p-3">
          <label className="min-w-[220px] flex-1 text-[9px] font-black uppercase tracking-wider text-bx-muted">Организация<select value={filterCompany} onChange={event => setFilterCompany(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold text-bx-text outline-none focus:border-blue-500"><option value="">Все организации</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
          <div className="rounded-xl border border-bx-border bg-bx-bg px-3 py-2 text-[10px] text-bx-muted"><span className="block font-black uppercase tracking-wider">Хранилище</span><span className="mt-1 block font-bold text-bx-text">{documents.length} {Number.isFinite(limits.documentsMax) ? `из ${limits.documentsMax}` : 'файлов · без лимита'}</span></div>
        </div>

        {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl border border-bx-border bg-bx-surface" />)}</div> : filteredDocs.length === 0 ? <ResourceEmpty icon="folder" title={documents.length ? 'По этим фильтрам ничего нет' : 'Архив пока пуст'} description={documents.length ? 'Сбросьте фильтры или попробуйте другое название и теги.' : 'Создайте первый документ по шаблону или загрузите готовый файл.'} action={<button type="button" onClick={documents.length ? resetFilters : () => navigate('/documents/templates')} className={primaryActionClass}>{documents.length ? 'Показать все' : 'Выбрать шаблон'}</button>} /> : <div className="space-y-2">
          {filteredDocs.map(document => <article key={document.id} className="group flex flex-col gap-3 rounded-2xl border border-bx-border bg-bx-surface p-3 shadow-sm transition-colors hover:border-blue-500/35 md:flex-row md:items-center">
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-blue-500/15 bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name={CATEGORY_ICON[document.category] ?? 'file'} className="h-[18px] w-[18px]" /></span><div className="min-w-0"><h3 title={document.file_name} className="line-clamp-2 text-xs font-black leading-snug text-bx-text">{document.file_name}</h3><p className="mt-1 truncate text-[10px] text-bx-muted">{companyMap.get(document.company_id ?? '') ?? 'Без организации'}</p></div></div>
            <div className="flex flex-1 flex-wrap gap-1.5"><span className="rounded-md border border-blue-500/15 bg-blue-500/10 px-2 py-1 text-[9px] font-black text-blue-600 dark:text-blue-300">{document.category}</span>{(document.tags ?? []).slice(0, 2).map(tag => <span key={tag} className="rounded-md border border-bx-border bg-bx-surface-2 px-2 py-1 text-[9px] font-bold text-bx-muted">#{tag}</span>)}</div>
            <div className="flex items-center justify-between gap-2 md:justify-end"><time className="text-[10px] font-bold tabular-nums text-bx-muted">{new Date(document.created_at).toLocaleDateString('ru-RU')}</time><div className="flex gap-1.5"><button type="button" onClick={() => void downloadDocument(document.file_url, document.file_name)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[10px] font-black text-white hover:bg-blue-700"><Icon name="download" className="h-3.5 w-3.5" />Скачать</button><button type="button" onClick={() => void handleDelete(document)} aria-label={`Удалить ${document.file_name}`} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white dark:text-red-300"><Icon name="trash" className="h-4 w-4" /></button></div></div>
          </article>)}
        </div>}
      </section>
    </div>
  </ResourceLayout>
}

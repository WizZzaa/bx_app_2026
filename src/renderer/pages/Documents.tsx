import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../lib/CompanyContext'
import { useDocuments, type BxUserDocument } from '../lib/useDocuments'
import { usePlan } from '../lib/plan'
import { TARIFF_MATRIX } from '../../shared/tariffs'
import Icon from '../lib/ui/Icon'
import DocumentsTabs from '../components/documents/DocumentsTabs'
import { Sheet } from '../components/ui/Sheet'
import { Upload } from '../components/ui/FormControls'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog'
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
import './documents/DocumentsA3.css'

const CATEGORIES = ['Договор', 'Акт', 'Устав', 'Справка', 'Другое']
const CATEGORY_ICON: Record<string, string> = { Договор: 'contract', Акт: 'receipt', Устав: 'government', Справка: 'note', Другое: 'file' }
const INLINE_IMAGE_PATTERN = /\.(png|jpe?g|webp|gif)$/i
const INLINE_PDF_PATTERN = /\.pdf$/i

const fileExtension = (fileName: string) => fileName.split('.').pop()?.toUpperCase() || 'ФАЙЛ'
const canPreviewInline = (fileName: string) => INLINE_PDF_PATTERN.test(fileName) || INLINE_IMAGE_PATTERN.test(fileName)

export default function Documents() {
  const navigate = useNavigate()
  const { companies, active } = useCompany()
  const { limits, plan } = usePlan()
  const {
    documents,
    loading,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentPreviewUrl,
  } = useDocuments()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [customName, setCustomName] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [category, setCategory] = useState('Другое')
  const [tagsInput, setTagsInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [previewDocument, setPreviewDocument] = useState<BxUserDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BxUserDocument | null>(null)
  const [deleting, setDeleting] = useState(false)
  const previewRequestRef = useRef(0)
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

  const openUpload = () => {
    setUploadError(null)
    setUploadSuccess(false)
    setUploadOpen(true)
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
      const finalFile = customName.trim() === selectedFile.name
        ? selectedFile
        : new File([selectedFile], customName.trim(), { type: selectedFile.type })
      await uploadDocument(finalFile, targetCompany, category, tags)
      setSelectedFile(null)
      setCustomName('')
      setTagsInput('')
      setCategory('Другое')
      setUploadSuccess(true)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Не удалось загрузить файл. Проверьте формат и размер по лимиту тарифа.')
    } finally {
      setUploading(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteDocument(pendingDelete.id, pendingDelete.file_url)
      setPendingDelete(null)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Не удалось удалить документ')
    } finally {
      setDeleting(false)
    }
  }

  const openPreview = async (document: BxUserDocument) => {
    const requestId = previewRequestRef.current + 1
    previewRequestRef.current = requestId
    setPreviewDocument(document)
    setPreviewUrl('')
    setPreviewError(null)
    if (!canPreviewInline(document.file_name)) return
    setPreviewLoading(true)
    try {
      const signedUrl = await getDocumentPreviewUrl(document.file_url)
      if (previewRequestRef.current === requestId) setPreviewUrl(signedUrl)
    } catch (error) {
      if (previewRequestRef.current === requestId) {
        setPreviewError(error instanceof Error ? error.message : 'Не удалось открыть безопасный предпросмотр')
      }
    } finally {
      if (previewRequestRef.current === requestId) setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    previewRequestRef.current += 1
    setPreviewDocument(null)
    setPreviewUrl('')
    setPreviewError(null)
    setPreviewLoading(false)
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
  const usedPercent = Number.isFinite(limits.documentsMax) && limits.documentsMax > 0
    ? Math.min(100, Math.round(documents.length / limits.documentsMax * 100))
    : 0
  const resetFilters = () => { setSearch(''); setFilterCategory(''); setFilterCompany('') }

  const sidebar = (
    <ResourceSidebar
      icon="note"
      title="Документы"
      subtitle="Готовые файлы и созданные бланки"
      search={search}
      searchPlaceholder="Название или тег"
      onSearch={setSearch}
      onClear={() => setSearch('')}
      label="Тип документа"
      footer={<button type="button" onClick={openUpload} className={`${secondaryActionClass} w-full`}><Icon name="plus" className="h-4 w-4" />Загрузить файл</button>}
    >
      <ResourceNavItem icon="folder" label="Все документы" count={documents.length} active={!filterCategory} onClick={() => setFilterCategory('')} />
      {CATEGORIES.map(item => (
        <ResourceNavItem
          key={item}
          icon={CATEGORY_ICON[item]}
          label={item}
          count={documents.filter(document => document.category === item).length}
          active={filterCategory === item}
          onClick={() => setFilterCategory(item)}
        />
      ))}
    </ResourceSidebar>
  )

  return (
    <ResourceLayout sidebar={sidebar}>
      <div className="bx-documents-a3 bx-document-archive space-y-6">
        <DocumentsTabs current="documents" stage={3} />
        <ResourceHero
          eyebrow="Мои документы"
          title="Архив, в котором всё находится сразу"
          description="Шаблоны, загруженные файлы и безопасный предпросмотр собраны по организациям, типам и тегам."
          icon="note"
          stats={[
            { value: documents.length, label: 'всего файлов' },
            { value: filteredDocs.length, label: 'видно сейчас' },
            { value: Number.isFinite(limits.documentsMax) ? `${usedPercent}%` : 'Без лимита', label: 'занято по тарифу' },
          ]}
          actions={<>
            <button type="button" onClick={() => navigate('/documents/templates')} className={primaryActionClass}><Icon name="templates" className="h-4 w-4" />Создать по шаблону</button>
            <button type="button" onClick={openUpload} className={secondaryActionClass}><Icon name="download" className="h-4 w-4 rotate-180" />Загрузить файл</button>
          </>}
        />

        <section className="space-y-4">
          <ResourceSectionTitle
            headingLevel="h2"
            title="Мои документы"
            subtitle="Поиск и фильтры работают вместе; предпросмотр не делает файл публичным"
            count={filteredDocs.length}
            action={(search || filterCategory || filterCompany) ? <button type="button" onClick={resetFilters} className={secondaryActionClass}>Сбросить фильтры</button> : undefined}
          />
          <div className="bx-document-filterbar flex flex-wrap items-end gap-3 rounded-[18px] border border-bx-border bg-bx-surface p-3">
            <label className="min-w-[220px] flex-1 text-[9px] font-black uppercase tracking-wider text-bx-muted">
              Организация
              <select value={filterCompany} onChange={event => setFilterCompany(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold text-bx-text outline-none focus:border-blue-500">
                <option value="">Все организации</option>
                {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </label>
            <div className="rounded-xl border border-bx-border bg-bx-bg px-3 py-2 text-[10px] text-bx-muted">
              <span className="block font-black uppercase tracking-wider">Хранилище</span>
              <span className="mt-1 block font-bold text-bx-text">{documents.length} {Number.isFinite(limits.documentsMax) ? `из ${limits.documentsMax}` : 'файлов · без лимита'}</span>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[20px] border border-bx-border bg-bx-surface" />)}
            </div>
          ) : filteredDocs.length === 0 ? (
            <ResourceEmpty
              icon="folder"
              title={documents.length ? 'По этим фильтрам ничего нет' : 'Архив пока пуст'}
              description={documents.length ? 'Сбросьте фильтры или попробуйте другое название и теги.' : 'Создайте первый документ по шаблону или загрузите готовый файл.'}
              action={<button type="button" onClick={documents.length ? resetFilters : () => navigate('/documents/templates')} className={primaryActionClass}>{documents.length ? 'Показать все' : 'Выбрать шаблон'}</button>}
            />
          ) : (
            <div className="bx-document-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDocs.map(document => (
                <article key={document.id} className="bx-document-card group flex min-h-48 flex-col rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border border-blue-500/15 bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name={CATEGORY_ICON[document.category] ?? 'file'} className="h-[18px] w-[18px]" /></span>
                    <span className="rounded-full border border-bx-border bg-bx-surface-2 px-2.5 py-1 text-[9px] font-black text-bx-muted">{fileExtension(document.file_name)}</span>
                  </div>
                  <button type="button" onClick={() => void openPreview(document)} className="mt-4 min-h-0 text-left outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500">
                    <h3 title={document.file_name} className="line-clamp-2 text-[13px] font-black leading-snug text-bx-text group-hover:text-blue-600 dark:group-hover:text-blue-300">{document.file_name}</h3>
                    <p className="mt-1.5 truncate text-[10px] text-bx-muted">{companyMap.get(document.company_id ?? '') ?? 'Без организации'} · {document.category}</p>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(document.tags ?? []).slice(0, 3).map(tag => <span key={tag} className="rounded-md border border-bx-border bg-bx-surface-2 px-2 py-1 text-[9px] font-bold text-bx-muted">#{tag}</span>)}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-bx-border pt-3">
                    <time className="text-[10px] font-bold tabular-nums text-bx-muted">{new Date(document.created_at).toLocaleDateString('ru-RU')}</time>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => void openPreview(document)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-bx-border bg-bx-bg px-3 text-[10px] font-black text-bx-text hover:text-blue-600"><Icon name="search" className="h-3.5 w-3.5" />Открыть</button>
                      <button type="button" onClick={() => setPendingDelete(document)} aria-label={`Удалить ${document.file_name}`} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white dark:text-red-300"><Icon name="trash" className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <Sheet
          open={uploadOpen}
          onClose={() => { if (!uploading) setUploadOpen(false) }}
          title="Загрузить документ"
          description={maxFileBytes ? `PDF, Word, Excel или изображение до ${maxFileBytes / 1024 / 1024} МБ.` : 'На тарифе Free загрузка собственных файлов недоступна.'}
          className="bx-documents-a3__sheet"
          footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={uploading} onClick={() => setUploadOpen(false)} className={secondaryActionClass}>Отмена</button>
            <button type="submit" form="bx-document-upload-form" disabled={!selectedFile || uploading} className={primaryActionClass}><Icon name="save" className="h-4 w-4" />{uploading ? 'Сохраняю…' : 'Сохранить в архив'}</button>
          </div>}
        >
          <form id="bx-document-upload-form" onSubmit={handleUpload} className="bx-documents-a3 space-y-4">
            {uploadSuccess && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"><Icon name="check" className="h-4 w-4 flex-shrink-0" />Документ сохранён. Можно загрузить следующий или закрыть окно.</div>}
            <Upload
              label="Файл документа"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              disabled={uploading || maxFileBytes <= 0}
              files={selectedFile ? [selectedFile] : []}
              onFiles={files => { if (files[0]) chooseFile(files[0]) }}
              chooseLabel="Выбрать документ"
              dropLabel="или перетащите PDF, Word, Excel или изображение"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-text">Название *<input required value={customName} onChange={event => setCustomName(event.target.value)} placeholder="Договор аренды 2026.docx" className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-semibold text-bx-text outline-none" /></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-text">Организация *<select required value={targetCompany} onChange={event => setTargetCompany(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-semibold text-bx-text outline-none"><option value="">Выберите организацию</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}{company.inn ? ` · ИНН ${company.inn}` : ''}</option>)}</select></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-text">Тип документа *<select value={category} onChange={event => setCategory(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-semibold text-bx-text outline-none">{CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-text">Теги<input value={tagsInput} onChange={event => setTagsInput(event.target.value)} placeholder="аренда, 2026, оригинал" className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-surface-2 px-3 text-xs font-semibold text-bx-text outline-none" /><span className="mt-1.5 block normal-case tracking-normal text-bx-muted">Через запятую — для быстрого поиска.</span></label>
            </div>
            {uploadError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-[11px] font-bold text-red-700 dark:text-red-300"><Icon name="alert" className="h-4 w-4 flex-shrink-0" />{uploadError}</div>}
          </form>
        </Sheet>

        <ConfirmationDialog
          open={Boolean(pendingDelete)}
          onClose={() => { if (!deleting) setPendingDelete(null) }}
          onConfirm={() => void confirmDelete()}
          title="Удалить документ?"
          description={pendingDelete ? `«${pendingDelete.file_name}» будет удалён из архива. Восстановить файл не получится.` : ''}
          confirmLabel="Удалить безвозвратно"
          tone="destructive"
          loading={deleting}
        />

        <Sheet
          open={Boolean(previewDocument)}
          onClose={closePreview}
          title={previewDocument?.file_name ?? 'Документ'}
          description={previewDocument ? `${companyMap.get(previewDocument.company_id ?? '') ?? 'Без организации'} · ${previewDocument.category} · ${fileExtension(previewDocument.file_name)}` : undefined}
          className="bx-documents-a3__preview-sheet"
          footer={previewDocument && <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={closePreview} className={secondaryActionClass}>Закрыть</button>
            <button type="button" onClick={() => void downloadDocument(previewDocument.file_url, previewDocument.file_name)} className={primaryActionClass}><Icon name="download" className="h-4 w-4" />Скачать оригинал</button>
          </div>}
        >
          <div className="bx-documents-a3 min-h-64">
            {previewLoading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-bx-muted"><span className="h-8 w-8 animate-spin rounded-full border-2 border-bx-border border-t-blue-600" /><p className="text-xs font-bold">Готовим безопасный предпросмотр…</p></div>
            ) : previewError ? (
              <div role="alert" className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center"><Icon name="alert" className="h-6 w-6 text-red-600" /><p className="mt-3 text-sm font-black text-bx-text">Предпросмотр недоступен</p><p className="mt-1 max-w-md text-xs text-bx-muted">{previewError}</p></div>
            ) : previewDocument && INLINE_IMAGE_PATTERN.test(previewDocument.file_name) && previewUrl ? (
              <img src={previewUrl} alt={`Предпросмотр ${previewDocument.file_name}`} className="bx-document-preview-image" />
            ) : previewDocument && INLINE_PDF_PATTERN.test(previewDocument.file_name) && previewUrl ? (
              <iframe src={previewUrl} title={`Предпросмотр ${previewDocument.file_name}`} className="bx-document-preview-frame" />
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-bx-border-2 bg-bx-bg p-6 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-bx-surface text-blue-600 shadow-sm"><Icon name="word" className="h-6 w-6" /></span>
                <p className="mt-4 text-sm font-black text-bx-text">Откройте оригинал в приложении</p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-bx-muted">Встроенный просмотр доступен для PDF и изображений. Word и Excel остаются приватными и скачиваются по временной защищённой ссылке.</p>
              </div>
            )}
          </div>
        </Sheet>
      </div>
    </ResourceLayout>
  )
}

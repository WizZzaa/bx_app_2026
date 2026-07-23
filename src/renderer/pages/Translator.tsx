import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../lib/ui/Icon'
import { supabase } from '../lib/db/supabase'
import { useCompany } from '../lib/CompanyContext'
import { useDocuments } from '../lib/useDocuments'
import { usePlan } from '../lib/plan'
import { useToast } from '../lib/ui/ToastContext'
import { BxMotion } from '../lib/ui/BxMotion'
import { primaryActionClass, secondaryActionClass } from '../components/workspace/ResourceWorkspace'
import { TARIFF_MATRIX } from '../../shared/tariffs'
import { parseUsageSnapshot, type UsageSnapshot } from '../lib/usageSnapshot'
import { loadMammoth, loadPdfJsWithInlineWorker, loadXlsx } from '../lib/documentDependencyLoaders'
import { Sheet } from '../components/ui/Sheet'
import './assistants/AssistantsA4.css'
import {
  TRANSLATION_LANGUAGES,
  TRANSLATION_MODES,
  MAX_TRANSLATION_CHARS,
  MAX_TRANSLATION_GLOSSARY_CHARS,
  buildPlainLanguagePrompt,
  buildTranslationRequest,
  countWords,
  normalizeArchiveFileName,
  readTranslationFailure,
  translatedFileName,
  type TranslationLanguage,
  type TranslationMode,
} from '../lib/translator'

interface TranslationHistoryItem {
  id: string
  createdAt: string
  source: TranslationLanguage
  target: TranslationLanguage
  mode: TranslationMode
  title: string
  sourceText: string
  resultText: string
}

const HISTORY_KEY = 'bx_translation_history'
const HISTORY_ENABLED_KEY = 'bx_translation_history_enabled'
const TUTORIAL_KEY = 'bx_translator_tutorial_v2'
const DOCUMENT_CATEGORIES = ['Договор', 'Акт', 'Устав', 'Справка', 'Другое']

function loadHistory(): TranslationHistoryItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(value) ? value.slice(0, 10) : []
  } catch { return [] }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось выполнить перевод'
}

async function extractFileText(file: File, maxFileBytes: number) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension) throw new Error('Не удалось определить формат файла')
  if (maxFileBytes <= 0) throw new Error('Загрузка файлов недоступна на тарифе Free. Вставьте текст вручную или выберите тариф выше.')
  if (file.size > maxFileBytes) throw new Error(`Файл больше ${(maxFileBytes / 1024 / 1024).toLocaleString('ru-RU')} МБ — лимита вашего тарифа.`)

  if (['txt', 'csv', 'json', 'xml'].includes(extension)) return file.text()
  if (extension === 'docx') {
    const mammoth = await loadMammoth()
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }
  if (extension === 'xlsx' || extension === 'xls') {
    const XLSX = await loadXlsx()
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    return workbook.SheetNames.map(name => `Лист: ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n\n')
  }
  if (extension === 'pdf') {
    const pdfjsLib = await loadPdfJsWithInlineWorker()
    const document = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      const text = content.items.map(item => ('str' in item ? item.str : '')).join(' ')
      pages.push(`Страница ${pageNumber}\n${text}`)
    }
    return pages.join('\n\n')
  }
  throw new Error('Поддерживаются PDF, DOCX, XLS/XLSX, TXT, CSV, JSON и XML.')
}

export default function Translator() {
  const navigate = useNavigate()
  const toast = useToast()
  const { companies, active, startCompanyCreation } = useCompany()
  const { documents, loadDocuments, uploadDocument } = useDocuments()
  const { limits, plan } = usePlan()
  const [source, setSource] = useState<TranslationLanguage>('uz-latn')
  const [target, setTarget] = useState<TranslationLanguage>('ru')
  const [mode, setMode] = useState<TranslationMode>('official')
  const [sourceText, setSourceText] = useState('')
  const [resultText, setResultText] = useState('')
  const [plainText, setPlainText] = useState('')
  const [glossary, setGlossary] = useState('')
  const [preserveStructure, setPreserveStructure] = useState(true)
  const [activeResult, setActiveResult] = useState<'translation' | 'plain'>('translation')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [retryableError, setRetryableError] = useState(false)
  const [historyEnabled, setHistoryEnabled] = useState(() => localStorage.getItem(HISTORY_ENABLED_KEY) === 'true')
  const [tutorialEnabled, setTutorialEnabled] = useState(() => localStorage.getItem(TUTORIAL_KEY) !== 'hidden')
  const [consentedText, setConsentedText] = useState('')
  const [resultExported, setResultExported] = useState(true)
  const [mobilePane, setMobilePane] = useState<'source' | 'result'>('source')
  const [usage, setUsage] = useState<UsageSnapshot | null>(null)
  const [history, setHistory] = useState<TranslationHistoryItem[]>(loadHistory)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiveCompanyId, setArchiveCompanyId] = useState('')
  const [archiveName, setArchiveName] = useState('')
  const [archiveCategory, setArchiveCategory] = useState('Другое')
  const [archiveTags, setArchiveTags] = useState('перевод, переводчик')
  const [archiveSaving, setArchiveSaving] = useState(false)
  const [archiveSaved, setArchiveSaved] = useState(false)
  const [archiveError, setArchiveError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxFileBytes = TARIFF_MATRIX[plan].maxFileBytes
  const consentGranted = Boolean(sourceText.trim()) && consentedText === sourceText

  const refreshUsage = async () => {
    const { data } = await supabase.rpc('bx_get_my_usage_snapshot')
    setUsage(parseUsageSnapshot(data))
  }

  useEffect(() => { void loadDocuments() }, [loadDocuments])
  useEffect(() => { void refreshUsage() }, [])
  const displayedResult = activeResult === 'translation' ? resultText : plainText
  const sourceWordCount = countWords(sourceText)
  const resultWordCount = countWords(displayedResult)
  const sourceNumbers = useMemo(() => sourceText.match(/[\d][\d\s.,/%-]*/g) ?? [], [sourceText])
  const preservedNumbers = useMemo(() => sourceNumbers.filter(value => resultText.includes(value.trim())).length, [resultText, sourceNumbers])

  const setSourceLanguage = (next: TranslationLanguage) => {
    if (next === target) setTarget(source)
    setSource(next)
  }

  const setTargetLanguage = (next: TranslationLanguage) => {
    if (next === source) setSource(target)
    setTarget(next)
  }

  const swapLanguages = () => {
    setSource(target)
    setTarget(source)
    setSourceText(resultText)
    setResultText(sourceText)
    setPlainText('')
    setActiveResult('translation')
  }

  const handleFile = async (file: File) => {
    setExtracting(true)
    setError('')
    setRetryableError(false)
    setFileName(file.name)
    setFileSize(file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} МБ` : `${(file.size / 1024).toFixed(1)} КБ`)
    try {
      const text = await extractFileText(file, maxFileBytes)
      if (!text.trim()) throw new Error('В документе не найден текст. Для скана используйте OCR в разделе «Утилиты».')
      if (text.trim().length > MAX_TRANSLATION_CHARS) throw new Error(`В документе больше ${MAX_TRANSLATION_CHARS.toLocaleString('ru-RU')} знаков. Разделите его на несколько частей.`)
      setSourceText(text.trim())
      setResultText('')
      setPlainText('')
      setConsentedText('')
      setResultExported(true)
    } catch (fileError) {
      setFileName('')
      setFileSize('')
      setError(getErrorMessage(fileError))
    } finally { setExtracting(false) }
  }

  const saveHistoryItem = (translated: string) => {
    if (!historyEnabled) return
    const item: TranslationHistoryItem = {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), source, target, mode,
      title: fileName || sourceText.slice(0, 54).replace(/\s+/g, ' ') || 'Перевод', sourceText, resultText: translated,
    }
    const next = [item, ...history].slice(0, 10)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }

  const translate = async () => {
    if (!sourceText.trim() || translating || !consentGranted) return
    setTranslating(true)
    setError('')
    setRetryableError(false)
    setPlainText('')
    setActiveResult('translation')
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('translator', {
        body: buildTranslationRequest({ source, target, mode, text: sourceText, glossary, preserveStructure }),
        headers: { 'Idempotency-Key': crypto.randomUUID(), 'X-BX-External-AI-Consent': 'document' },
      })
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.message || data.error)
      const translated = String(data?.text || '').trim()
      if (!translated) throw new Error('Сервис вернул пустой перевод. Повторите попытку.')
      setResultText(translated)
      setResultExported(false)
      setMobilePane('result')
      saveHistoryItem(translated)
    } catch (translationError) {
      const failure = await readTranslationFailure(translationError)
      setRetryableError(failure.retryable)
      setError(`${failure.message} Исходный текст сохранён на экране.`)
    } finally { setTranslating(false); void refreshUsage() }
  }

  const explainPlainly = async () => {
    if (!resultText.trim() || explaining) return
    setExplaining(true)
    setError('')
    setActiveResult('plain')
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai-consultant', { body: { messages: [{ role: 'user', content: buildPlainLanguagePrompt(resultText, target) }] } })
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.message || data.error)
      setPlainText(String(data?.text || '').trim())
    } catch (plainError) {
      setActiveResult('translation')
      setError(`Не удалось подготовить объяснение: ${getErrorMessage(plainError)}`)
    } finally { setExplaining(false); void refreshUsage() }
  }

  const copyResult = async () => {
    if (!displayedResult) return
    await navigator.clipboard.writeText(displayedResult)
    setResultExported(true)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const downloadResult = () => {
    if (!displayedResult) return
    const blob = new Blob([displayedResult], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = activeResult === 'plain' ? `explanation_${translatedFileName(fileName || 'document', target)}` : translatedFileName(fileName || 'document', target)
    link.click()
    URL.revokeObjectURL(url)
    setResultExported(true)
  }

  const openArchive = () => {
    if (!displayedResult.trim()) return
    const suggestedName = activeResult === 'plain'
      ? `Объяснение_${translatedFileName(fileName || 'document', target)}`
      : translatedFileName(fileName || 'document', target)
    setArchiveName(suggestedName)
    setArchiveCompanyId(active?.id || companies[0]?.id || '')
    setArchiveSaved(false)
    setArchiveError('')
    setArchiveOpen(true)
  }

  const saveToDocuments = async () => {
    if (!displayedResult.trim() || archiveSaving) return
    if (!archiveCompanyId) {
      setArchiveError('Выберите организацию, чтобы документ не потерял рабочий контекст.')
      return
    }
    if (documents.length >= limits.documentsMax) {
      setArchiveError(`Достигнут лимит хранилища: ${limits.documentsMax} документов.`)
      return
    }
    setArchiveSaving(true)
    setArchiveError('')
    try {
      const finalName = normalizeArchiveFileName(archiveName)
      const tags = Array.from(new Set([
        ...archiveTags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean),
        activeResult === 'plain' ? 'объяснение' : 'готовый перевод',
        `язык-${target}`,
      ]))
      const file = new File(['\uFEFF' + displayedResult], finalName, { type: 'text/plain;charset=utf-8' })
      const saved = await uploadDocument(file, archiveCompanyId, archiveCategory, tags)
      if (!saved) throw new Error('Архив не подтвердил сохранение файла')
      setArchiveSaved(true)
      setResultExported(true)
      toast.success('Готовый перевод добавлен в Документы')
    } catch (saveError) {
      setArchiveError(getErrorMessage(saveError))
    } finally {
      setArchiveSaving(false)
    }
  }

  const reset = () => {
    if (resultText.trim() && !resultExported && !window.confirm('Результат ещё не выгружен. Очистить без экспорта?')) return
    setSourceText(''); setResultText(''); setPlainText(''); setFileName(''); setFileSize(''); setError(''); setRetryableError(false); setActiveResult('translation'); setConsentedText(''); setResultExported(true); setMobilePane('source')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleHistory = () => {
    const next = !historyEnabled
    setHistoryEnabled(next)
    localStorage.setItem(HISTORY_ENABLED_KEY, String(next))
  }

  const dismissTutorial = () => {
    setTutorialEnabled(false)
    localStorage.setItem(TUTORIAL_KEY, 'hidden')
  }

  const restoreHistory = (item: TranslationHistoryItem) => {
    setSource(item.source); setTarget(item.target); setMode(item.mode); setSourceText(item.sourceText); setResultText(item.resultText); setPlainText(''); setFileName(item.title); setActiveResult('translation'); setConsentedText(''); setResultExported(true)
  }

  const clearHistory = () => { setHistory([]); localStorage.removeItem(HISTORY_KEY) }

  const selectedMode = TRANSLATION_MODES.find(item => item.id === mode) ?? TRANSLATION_MODES[0]

  return (
    <div className="bx-translator-a4 custom-scrollbar flex-1 overflow-y-auto bg-bx-bg text-bx-text">
      <div className="bx-translator-shell space-y-4 px-4 py-4 sm:px-5 lg:px-7 lg:py-6">
        <BxMotion preset="raise" className="bx-translator-hero">
          <header className="relative overflow-hidden rounded-[28px] border border-bx-border bg-bx-surface p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="bx-translator-eyebrow">Переводчик документов</p>
                <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">Документ на другом языке — без лишних шагов</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-bx-muted">Выберите языки, добавьте текст и проверьте готовый результат. Исходный файл разбирается на устройстве; наружу уходит только текст после вашего согласия.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <HeroMetric icon="shield" label="Файл" value="На устройстве" />
                <HeroMetric icon="languages" label="Лимит" value={usage ? `${usage.resources.translations.remaining} доступно` : 'Проверяется'} />
              </div>
            </div>
          </header>
        </BxMotion>

        {tutorialEnabled && <BxMotion preset="fade" className="rounded-[22px] border border-bx-border bg-bx-surface p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="bx-translator-icon"><Icon name="info" className="h-4 w-4" /></span>
              <div><p className="bx-translator-eyebrow">Первый запуск · 3 шага</p><h2 className="mt-1 text-sm font-black">Языки → текст → проверка результата</h2><p className="mt-1 text-xs leading-5 text-bx-muted">Для договора выберите юридический режим, для счёта — бухгалтерский. Перед отправкой сверьте суммы и реквизиты.</p></div>
            </div>
            <button type="button" onClick={dismissTutorial} className={primaryActionClass}>Начать перевод</button>
          </div>
        </BxMotion>}

        <section className="bx-translator-control-bar" aria-label="Направление и настройки перевода">
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] sm:items-end">
            <LanguageSelect label="С языка" value={source} onChange={setSourceLanguage} />
            <button type="button" onClick={swapLanguages} aria-label="Поменять языки местами" className="bx-translator-swap"><Icon name="exchange" className="h-4 w-4" /></button>
            <LanguageSelect label="На язык" value={target} onChange={setTargetLanguage} />
          </div>
          <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Режим<select value={mode} onChange={event => setMode(event.target.value as TranslationMode)} className="mt-1.5 min-h-12 w-full rounded-xl border border-bx-border bg-bx-surface px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none">{TRANSLATION_MODES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <details className="group rounded-xl border border-bx-border bg-bx-surface">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-black outline-none [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><Icon name="settings" className="h-4 w-4 text-bx-muted" />Термины и структура</span><Icon name="arrowR" className="h-4 w-4 rotate-90 text-bx-muted transition-transform group-open:-rotate-90" /></summary>
            <div className="border-t border-bx-border p-3"><TranslatorAdvancedSettings glossary={glossary} preserveStructure={preserveStructure} onGlossaryChange={setGlossary} onPreserveStructureChange={setPreserveStructure} /></div>
          </details>
        </section>

        <div className="grid grid-cols-2 gap-1 rounded-xl border border-bx-border bg-bx-surface p-1 xl:hidden" aria-label="Область перевода"><button type="button" onClick={() => setMobilePane('source')} aria-pressed={mobilePane === 'source'} className={`min-h-11 rounded-lg text-xs font-black ${mobilePane === 'source' ? 'bg-[var(--bx-brand-action)] text-[var(--bx-on-brand)]' : 'text-bx-muted'}`}>Исходник</button><button type="button" onClick={() => setMobilePane('result')} aria-pressed={mobilePane === 'result'} className={`min-h-11 rounded-lg text-xs font-black ${mobilePane === 'result' ? 'bg-[var(--bx-brand-action)] text-[var(--bx-on-brand)]' : 'text-bx-muted'}`}>Результат</button></div>

        {error && <BxMotion preset="fade" role="alert" aria-live="assertive" className="bx-translator-error">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-700 dark:text-red-300"><Icon name="alert" className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-black">Перевод не выполнен</p><p className="mt-1 text-xs leading-5 text-bx-muted">{error}</p></div>
          {retryableError && <button type="button" onClick={() => void translate()} disabled={translating} className={secondaryActionClass}><Icon name="refresh" className="h-4 w-4" />Повторить</button>}
        </BxMotion>}

        <section className="bx-translator-workbench" aria-label="Рабочая область перевода">
          <article className={`${mobilePane === 'source' ? 'flex' : 'hidden'} bx-translator-pane xl:flex`}>
            <div className="bx-translator-pane-header"><div><p className="bx-translator-eyebrow">Исходник</p><p className="mt-1 text-xs text-bx-muted">{sourceWordCount.toLocaleString('ru-RU')} слов · {sourceText.length.toLocaleString('ru-RU')} из {MAX_TRANSLATION_CHARS.toLocaleString('ru-RU')} знаков</p></div><button type="button" onClick={reset} disabled={!sourceText && !fileName} className={`${secondaryActionClass} disabled:cursor-not-allowed disabled:opacity-40`}><Icon name="trash" className="h-4 w-4" />Очистить</button></div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <label className={`bx-translator-dropzone ${extracting ? 'is-loading' : ''}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void handleFile(file) }}>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.xlsx,.xls,.txt,.csv,.json,.xml" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) void handleFile(file) }} />
                <span className="bx-translator-icon"><Icon name={extracting ? 'clock' : 'download'} className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block truncate text-xs font-black">{extracting ? 'Извлекаю текст…' : fileName || 'Загрузить документ'}</span><span className="mt-1 block text-xs text-bx-muted">{fileName ? `${fileSize} · нажмите, чтобы заменить` : maxFileBytes ? `PDF, DOCX, XLS/XLSX, TXT · до ${maxFileBytes / 1024 / 1024} МБ` : 'На Free вставьте текст вручную'}</span></span>
              </label>
              <label className="mt-4 flex flex-1 flex-col text-[10px] font-black uppercase tracking-wider text-bx-muted">Текст
                <textarea value={sourceText} maxLength={MAX_TRANSLATION_CHARS} onChange={event => { setSourceText(event.target.value); setError(''); setRetryableError(false); setConsentedText(''); setResultExported(resultText ? false : true) }} rows={14} placeholder="Вставьте текст или загрузите документ…" className="custom-scrollbar mt-1.5 min-h-[360px] flex-1 resize-y rounded-2xl border border-bx-border bg-bx-bg p-4 text-sm font-medium leading-6 normal-case tracking-normal text-bx-text outline-none placeholder:text-bx-muted" />
              </label>
              {sourceText.trim() && <label className="bx-translator-consent"><input type="checkbox" checked={consentGranted} onChange={event => setConsentedText(event.target.checked ? sourceText : '')} className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--bx-brand-action)]" /><span><strong>Разрешаю перевести этот текст через внешний AI.</strong> Исходный файл не отправляется и результат автоматически не сохраняется.</span></label>}
              <button type="button" onClick={() => void translate()} disabled={!sourceText.trim() || !consentGranted || translating || extracting || usage?.resources.translations.remaining === 0} className={`${primaryActionClass} mt-3 w-full disabled:cursor-not-allowed disabled:opacity-45`}><Icon name={translating ? 'clock' : 'languages'} className="h-4 w-4" />{translating ? 'Перевожу документ…' : `Перевести · ${selectedMode.label}`}</button>
            </div>
          </article>

          <article className={`${mobilePane === 'result' ? 'flex' : 'hidden'} bx-translator-pane xl:flex`}>
            <div className="bx-translator-pane-header"><div className="flex rounded-xl border border-bx-border bg-bx-bg p-1"><ResultTab active={activeResult === 'translation'} label="Перевод" icon="languages" onClick={() => setActiveResult('translation')} /><ResultTab active={activeResult === 'plain'} label="Простыми словами" icon="ai" onClick={() => setActiveResult('plain')} /></div><p className="text-xs text-bx-muted">{resultWordCount.toLocaleString('ru-RU')} слов · {displayedResult.length.toLocaleString('ru-RU')} знаков</p></div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              {activeResult === 'plain' && !plainText ? <div className="grid min-h-[420px] flex-1 place-items-center rounded-2xl border border-dashed border-bx-border bg-bx-bg p-6 text-center"><div><span className="bx-translator-icon mx-auto"><Icon name="ai" className="h-5 w-5" /></span><h2 className="mt-3 text-base font-black">Объяснить простыми словами</h2><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-bx-muted">BX выделит суть, суммы, сроки, обязанности и риски. Это отдельный AI-запрос{usage ? `; осталось ${usage.resources.ai.remaining}` : ''}.</p><button type="button" onClick={() => void explainPlainly()} disabled={!resultText || explaining || usage?.resources.ai.remaining === 0} className={`${primaryActionClass} mt-4 disabled:opacity-45`}><Icon name={explaining ? 'clock' : 'ai'} className="h-4 w-4" />{explaining ? 'Готовлю объяснение…' : 'Объяснить результат'}</button></div></div> : <label className="flex flex-1 flex-col text-[10px] font-black uppercase tracking-wider text-bx-muted">{activeResult === 'translation' ? 'Редактируемый результат' : 'Понятное объяснение'}<textarea value={displayedResult} onChange={event => { activeResult === 'translation' ? setResultText(event.target.value) : setPlainText(event.target.value); setResultExported(false) }} rows={14} placeholder={translating ? 'Перевод появится здесь…' : 'Здесь появится готовый перевод'} className="custom-scrollbar mt-1.5 min-h-[420px] flex-1 resize-y rounded-2xl border border-bx-border bg-bx-bg p-4 text-sm font-medium leading-6 normal-case tracking-normal text-bx-text outline-none placeholder:text-bx-muted" /></label>}
              <div className="mt-4 grid gap-2 sm:grid-cols-2 2xl:grid-cols-4"><button type="button" onClick={() => void copyResult()} disabled={!displayedResult} className={`${secondaryActionClass} disabled:opacity-40`}><Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />{copied ? 'Скопировано' : 'Копировать'}</button><button type="button" onClick={downloadResult} disabled={!displayedResult} className={`${secondaryActionClass} disabled:opacity-40`}><Icon name="download" className="h-4 w-4" />Скачать TXT</button><button type="button" onClick={openArchive} disabled={!displayedResult} className={`${primaryActionClass} disabled:opacity-40`}><Icon name="save" className="h-4 w-4" />В Документы</button><button type="button" onClick={() => void explainPlainly()} disabled={!resultText || explaining} className={`${secondaryActionClass} disabled:opacity-40`}><Icon name="ai" className="h-4 w-4" />Объяснить</button></div>
            </div>
          </article>
        </section>

        {(resultText || historyEnabled || history.length > 0) && <details className="group rounded-2xl border border-bx-border bg-bx-surface shadow-sm">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Icon name="shield" className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-black text-bx-text">Проверка и история</span><span className="mt-0.5 block truncate text-[10px] text-bx-muted">Числа, структура, глоссарий и последние переводы</span></span></span><Icon name="arrowR" className="h-4 w-4 flex-shrink-0 rotate-90 text-bx-muted transition-transform duration-200 group-open:-rotate-90" /></summary>
          <section className="grid gap-4 border-t border-bx-border p-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-2xl border border-bx-border bg-bx-bg p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Icon name="shield" className="h-4 w-4" /></span><div><h2 className="text-sm font-black">Контроль качества перевода</h2><p className="mt-0.5 text-[10px] text-bx-muted">Автоматические ориентиры перед использованием документа</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><QualityItem label="Структура" value={preserveStructure ? 'Сохраняется' : 'Можно улучшать'} ok={preserveStructure} /><QualityItem label="Числа и суммы" value={sourceNumbers.length ? `${preservedNumbers} из ${sourceNumbers.length}` : 'Не найдены'} ok={!sourceNumbers.length || preservedNumbers === sourceNumbers.length} /><QualityItem label="Глоссарий" value={glossary.trim() ? 'Подключён' : 'Не задан'} ok={!!glossary.trim()} /></div><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3 text-[10px] leading-relaxed text-amber-950 dark:text-amber-100"><strong>Важно:</strong> перед подписанием договора или отправкой официального документа проверьте перевод вручную. BX помогает подготовить текст, но не заменяет дипломированного переводчика.</p></div>
            <div className="rounded-2xl border border-bx-border bg-bx-bg p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-black">Локальная история</h2><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">Выключена по умолчанию. При включении до 10 переводов сохраняются только на этом устройстве.</p></div><button type="button" onClick={toggleHistory} aria-pressed={historyEnabled} className={`min-h-10 rounded-xl border px-3 text-[10px] font-black ${historyEnabled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-bx-border bg-bx-surface text-bx-muted'}`}>{historyEnabled ? 'История включена' : 'Включить историю'}</button></div>{history.length ? <div className="mt-4 space-y-2">{history.slice(0, 4).map(item => <button type="button" key={item.id} onClick={() => restoreHistory(item)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-bx-border bg-bx-surface px-3 text-left hover:border-blue-500/30"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-blue-500/10 text-[9px] font-black text-blue-600 dark:text-blue-300">{TRANSLATION_LANGUAGES.find(language => language.id === item.target)?.short}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black">{item.title}</span><span className="mt-0.5 block text-[9px] text-bx-muted">{new Date(item.createdAt).toLocaleString('ru-RU')}</span></span><Icon name="arrowR" className="h-3.5 w-3.5 text-bx-muted" /></button>)}<button type="button" onClick={clearHistory} className="min-h-10 text-[10px] font-bold text-red-600 dark:text-red-300">Очистить историю</button></div> : <div className="mt-4 rounded-xl border border-dashed border-bx-border p-5 text-center text-[10px] text-bx-muted">Сохранённых переводов пока нет.</div>}</div>
          </section>
        </details>}
      </div>

      <Sheet
        open={archiveOpen}
        onClose={() => { if (!archiveSaving) setArchiveOpen(false) }}
        title={archiveSaved ? 'Перевод сохранён' : 'Добавить в Документы'}
        description={archiveSaved ? 'Файл привязан к организации и доступен в общем архиве.' : 'Укажите организацию и имя — перевод не потеряется среди рабочих файлов.'}
        className="bx-translator-a4__archive-sheet"
      >
          {archiveSaved ? <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setArchiveOpen(false)} className={secondaryActionClass}>Остаться в переводчике</button><button type="button" onClick={() => navigate('/documents/my')} className={primaryActionClass}><Icon name="note" className="h-4 w-4" />Открыть Документы</button></div> : <>
            {companies.length ? <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Организация<select autoFocus value={archiveCompanyId} onChange={event => setArchiveCompanyId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none focus:border-blue-500"><option value="">Выберите организацию</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Категория<select value={archiveCategory} onChange={event => setArchiveCategory(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none focus:border-blue-500">{DOCUMENT_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted sm:col-span-2">Имя готового файла<input value={archiveName} onChange={event => setArchiveName(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none focus:border-blue-500" /></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted sm:col-span-2">Метки через запятую<input value={archiveTags} onChange={event => setArchiveTags(event.target.value)} placeholder="перевод, договор, клиент" className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none placeholder:font-normal focus:border-blue-500" /></label>
            </div> : <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-4"><p className="text-xs font-black text-bx-text">Сначала добавьте организацию</p><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">Так готовый перевод получит владельца, рабочий контекст и не смешается с файлами других компаний.</p><button type="button" onClick={() => { setArchiveOpen(false); startCompanyCreation() }} className={`${primaryActionClass} mt-3`}><Icon name="plus" className="h-4 w-4" />Заполнить компанию</button></div>}
            {archiveError && <div role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-[11px] font-bold text-red-700 dark:text-red-300">{archiveError}</div>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={archiveSaving} onClick={() => setArchiveOpen(false)} className={secondaryActionClass}>Отмена</button><button type="button" disabled={!companies.length || !archiveCompanyId || !archiveName.trim() || archiveSaving} onClick={() => void saveToDocuments()} className={`${primaryActionClass} disabled:cursor-not-allowed disabled:opacity-45`}><Icon name={archiveSaving ? 'clock' : 'save'} className="h-4 w-4" />{archiveSaving ? 'Сохраняю…' : 'Добавить в Документы'}</button></div>
          </>}
      </Sheet>
    </div>
  )
}

function LanguageSelect({ label, value, onChange }: { label: string; value: TranslationLanguage; onChange: (value: TranslationLanguage) => void }) {
  return <label className="min-w-0 text-[10px] font-black uppercase tracking-wider text-bx-muted">{label}<select value={value} onChange={event => onChange(event.target.value as TranslationLanguage)} className="mt-1.5 min-h-12 w-full rounded-xl border border-bx-border bg-bx-surface px-4 text-sm font-black normal-case tracking-normal text-bx-text outline-none">{TRANSLATION_LANGUAGES.map(language => <option key={language.id} value={language.id}>{language.short} · {language.label}</option>)}</select></label>
}

function TranslatorAdvancedSettings({ glossary, preserveStructure, onGlossaryChange, onPreserveStructureChange }: { glossary: string; preserveStructure: boolean; onGlossaryChange: (value: string) => void; onPreserveStructureChange: (value: boolean) => void }) {
  return <div className="grid gap-3"><label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Обязательный глоссарий<textarea value={glossary} maxLength={MAX_TRANSLATION_GLOSSARY_CHARS} onChange={event => onGlossaryChange(event.target.value)} rows={3} placeholder={'Например: QQS = НДС\nMChJ = ООО'} className="mt-1.5 w-full resize-y rounded-xl border border-bx-border bg-bx-bg px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-bx-text outline-none placeholder:font-normal" /></label><label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold"><input type="checkbox" checked={preserveStructure} onChange={event => onPreserveStructureChange(event.target.checked)} className="h-4 w-4 accent-[var(--bx-brand-action)]" />Сохранять структуру документа</label></div>
}

function ResultTab({ active, label, icon, onClick }: { active: boolean; label: string; icon: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[10px] font-black ${active ? 'bg-[var(--bx-brand-action)] text-[var(--bx-on-brand)]' : 'text-bx-muted hover:text-bx-text'}`}><Icon name={icon} className="h-3.5 w-3.5" />{label}</button>
}

function HeroMetric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="bx-translator-metric flex min-w-[9.5rem] items-center gap-3 rounded-2xl border border-bx-border bg-bx-bg/70 p-3"><span className="bx-translator-icon"><Icon name={icon} className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-[10px] font-bold text-bx-muted">{label}</span><span className="bx-translator-metric__value mt-0.5 block text-xs font-black text-bx-text">{value}</span></span></div>
}

function QualityItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return <div className="rounded-xl border border-bx-border bg-bx-bg p-3"><div className="flex items-center gap-1.5"><Icon name={ok ? 'check' : 'info'} className={`h-3.5 w-3.5 ${ok ? 'text-emerald-600' : 'text-amber-600'}`} /><span className="text-[9px] font-black uppercase tracking-wider text-bx-muted">{label}</span></div><p className="mt-1.5 text-[11px] font-black text-bx-text">{value}</p></div>
}

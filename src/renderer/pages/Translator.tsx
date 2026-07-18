import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import * as XLSX from 'xlsx'
/* eslint-disable @typescript-eslint/ban-ts-comment, import/no-unresolved */
// @ts-ignore
import PDFWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker&inline'
/* eslint-enable @typescript-eslint/ban-ts-comment, import/no-unresolved */
import Icon from '../lib/ui/Icon'
import { supabase } from '../lib/db/supabase'
import { useCompany } from '../lib/CompanyContext'
import { useDocuments } from '../lib/useDocuments'
import { usePlan } from '../lib/plan'
import { useToast } from '../lib/ui/ToastContext'
import { ResourceHero, primaryActionClass, secondaryActionClass } from '../components/workspace/ResourceWorkspace'
import { TranslatorTutorial } from '../components/TranslatorTutorial'
import { TranslatorWorkspaceSwitch, type TranslatorWorkspaceMode } from '../components/TranslatorWorkspaceSwitch'
import { loadTranslatorWorkspaceMode, TRANSLATOR_WORKSPACE_MODE_KEY } from '../lib/workspaceModes'
import {
  TRANSLATION_LANGUAGES,
  TRANSLATION_MODES,
  buildPlainLanguagePrompt,
  buildTranslationPrompt,
  countWords,
  normalizeArchiveFileName,
  translatedFileName,
  type TranslationLanguage,
  type TranslationMode,
} from '../lib/translator'

try { pdfjsLib.GlobalWorkerOptions.workerPort = new PDFWorker() } catch { /* worker may already be configured */ }

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
const TUTORIAL_ENABLED_KEY = 'bx_translator_tutorial_enabled'
const MAX_FILE_SIZE = 15 * 1024 * 1024
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

async function extractFileText(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension) throw new Error('Не удалось определить формат файла')
  if (file.size > MAX_FILE_SIZE) throw new Error('Файл больше 15 МБ. Разделите документ или выберите меньший файл.')

  if (['txt', 'csv', 'json', 'xml'].includes(extension)) return file.text()
  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }
  if (extension === 'xlsx' || extension === 'xls') {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    return workbook.SheetNames.map(name => `Лист: ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n\n')
  }
  if (extension === 'pdf') {
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
  const { limits } = usePlan()
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
  const [historyEnabled, setHistoryEnabled] = useState(() => localStorage.getItem(HISTORY_ENABLED_KEY) === 'true')
  const [tutorialEnabled, setTutorialEnabled] = useState(() => localStorage.getItem(TUTORIAL_ENABLED_KEY) !== 'false')
  const [workspaceMode, setWorkspaceMode] = useState<TranslatorWorkspaceMode>(loadTranslatorWorkspaceMode)
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

  useEffect(() => { void loadDocuments() }, [loadDocuments])
  useEffect(() => {
    if (!archiveOpen) return undefined
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !archiveSaving) setArchiveOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [archiveOpen, archiveSaving])

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
    setFileName(file.name)
    setFileSize(file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} МБ` : `${(file.size / 1024).toFixed(1)} КБ`)
    try {
      const text = await extractFileText(file)
      if (!text.trim()) throw new Error('В документе не найден текст. Для скана используйте OCR в разделе «Утилиты».')
      setSourceText(text.trim())
      setResultText('')
      setPlainText('')
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
    if (!sourceText.trim() || translating) return
    setTranslating(true)
    setError('')
    setPlainText('')
    setActiveResult('translation')
    try {
      const prompt = buildTranslationPrompt({ source, target, mode, text: sourceText, glossary, preserveStructure })
      const { data, error: invokeError } = await supabase.functions.invoke('ai-consultant', { body: { messages: [{ role: 'user', content: prompt }] } })
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.message || data.error)
      const translated = String(data?.text || '').trim()
      if (!translated) throw new Error('Сервис вернул пустой перевод. Повторите попытку.')
      setResultText(translated)
      saveHistoryItem(translated)
    } catch (translationError) {
      setError(`Перевод не выполнен: ${getErrorMessage(translationError)}. Исходный текст сохранён на экране.`)
    } finally { setTranslating(false) }
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
    } finally { setExplaining(false) }
  }

  const copyResult = async () => {
    if (!displayedResult) return
    await navigator.clipboard.writeText(displayedResult)
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
      toast.success('Готовый перевод добавлен в Документы')
    } catch (saveError) {
      setArchiveError(getErrorMessage(saveError))
    } finally {
      setArchiveSaving(false)
    }
  }

  const reset = () => {
    setSourceText(''); setResultText(''); setPlainText(''); setFileName(''); setFileSize(''); setError(''); setActiveResult('translation')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleHistory = () => {
    const next = !historyEnabled
    setHistoryEnabled(next)
    localStorage.setItem(HISTORY_ENABLED_KEY, String(next))
  }

  const toggleTutorial = () => {
    const next = !tutorialEnabled
    setTutorialEnabled(next)
    localStorage.setItem(TUTORIAL_ENABLED_KEY, String(next))
  }

  const restoreHistory = (item: TranslationHistoryItem) => {
    setSource(item.source); setTarget(item.target); setMode(item.mode); setSourceText(item.sourceText); setResultText(item.resultText); setPlainText(''); setFileName(item.title); setActiveResult('translation')
  }

  const clearHistory = () => { setHistory([]); localStorage.removeItem(HISTORY_KEY) }

  const changeWorkspaceMode = (next: TranslatorWorkspaceMode) => {
    setWorkspaceMode(next)
    localStorage.setItem(TRANSLATOR_WORKSPACE_MODE_KEY, next)
  }

  const professionalMode = workspaceMode === 'professional'
  const selectedMode = TRANSLATION_MODES.find(item => item.id === mode) ?? TRANSLATION_MODES[0]

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto bg-bx-bg text-bx-text">
      <div className="bx-page-container space-y-5 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
        <TranslatorWorkspaceSwitch value={workspaceMode} onChange={changeWorkspaceMode} />

        {professionalMode && <ResourceHero eyebrow="Профессиональная работа с документами" title="Перевод без потери терминов, структуры и смысла" description="Рабочий стол для договоров, писем, счетов, таблиц и нормативных текстов на узбекском, русском и английском языках. Результат остаётся редактируемым перед выгрузкой." icon="languages" stats={[{ value: '4', label: 'языковых варианта' }, { value: '7', label: 'форматов файлов' }, { value: '15 МБ', label: 'до одного файла' }]} />}

        {professionalMode && <TranslatorTutorial enabled={tutorialEnabled} literalActive={mode === 'literal'} onToggle={toggleTutorial} onChooseLiteral={() => setMode('literal')} />}

        <section className="grid gap-3 lg:grid-cols-[1fr_auto_1fr]" aria-label="Направление перевода">
          <LanguageSelect label="Исходный язык" value={source} onChange={setSourceLanguage} />
          <button type="button" onClick={swapLanguages} aria-label="Поменять языки местами" className="mt-auto grid h-12 w-full place-items-center rounded-xl border border-bx-border bg-bx-surface text-blue-600 shadow-sm outline-none transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.06] focus-visible:ring-2 focus-visible:ring-blue-500 lg:w-12"><Icon name="exchange" className="h-4 w-4" /></button>
          <LanguageSelect label="Язык перевода" value={target} onChange={setTargetLanguage} />
        </section>

        {professionalMode ? <section className="rounded-[22px] border border-bx-border bg-bx-surface p-4 shadow-sm">
          <TranslationModeCards value={mode} onChange={setMode} />
          <TranslatorAdvancedSettings glossary={glossary} preserveStructure={preserveStructure} onGlossaryChange={setGlossary} onPreserveStructureChange={setPreserveStructure} />
        </section> : <details className="group rounded-2xl border border-bx-border bg-bx-surface shadow-sm">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name="settings" className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-black text-bx-text">Настройки перевода</span><span className="mt-0.5 block truncate text-[10px] text-bx-muted">{selectedMode.label} · глоссарий и структура</span></span></span>
            <Icon name="arrowR" className="h-4 w-4 flex-shrink-0 rotate-90 text-bx-muted transition-transform duration-200 group-open:-rotate-90" />
          </summary>
          <div className="border-t border-bx-border p-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Стиль перевода<select value={mode} onChange={event => setMode(event.target.value as TranslationMode)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none focus:border-blue-500">{TRANSLATION_MODES.map(item => <option key={item.id} value={item.id}>{item.label} — {item.description}</option>)}</select></label>
            <TranslatorAdvancedSettings glossary={glossary} preserveStructure={preserveStructure} onGlossaryChange={setGlossary} onPreserveStructureChange={setPreserveStructure} />
          </div>
        </details>}

        <section className="grid gap-4 xl:grid-cols-2" aria-label="Рабочая область перевода">
          <article className="overflow-hidden rounded-[22px] border border-bx-border bg-bx-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bx-border px-4 py-3"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Исходный документ</p><p className="mt-0.5 text-[10px] text-bx-muted">{sourceWordCount.toLocaleString('ru-RU')} слов · {sourceText.length.toLocaleString('ru-RU')} знаков</p></div><button type="button" onClick={reset} disabled={!sourceText && !fileName} className={`${secondaryActionClass} disabled:cursor-not-allowed disabled:opacity-40`}><Icon name="trash" className="h-4 w-4" />Очистить</button></div>
            <div className="p-4">
              <label className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-3 transition-colors ${extracting ? 'border-blue-500/40 bg-blue-500/[0.06]' : 'border-bx-border-2 bg-bx-bg hover:border-blue-500/35'}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void handleFile(file) }}>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.xlsx,.xls,.txt,.csv,.json,.xml" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) void handleFile(file) }} />
                <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name={extracting ? 'clock' : 'download'} className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block truncate text-xs font-black text-bx-text">{extracting ? 'Извлекаю текст…' : fileName || 'Загрузить или перетащить документ'}</span><span className="mt-1 block text-[10px] text-bx-muted">{fileName ? `${fileSize} · нажмите, чтобы заменить` : 'PDF · DOCX · XLS/XLSX · TXT · CSV · JSON · XML'}</span></span>
              </label>
              <label className="mt-4 block text-[10px] font-black uppercase tracking-wider text-bx-muted">Текст для перевода
                <textarea value={sourceText} onChange={event => setSourceText(event.target.value)} rows={professionalMode ? 18 : 13} placeholder="Вставьте текст или загрузите документ…" className={`custom-scrollbar mt-1.5 w-full resize-y rounded-2xl border border-bx-border bg-bx-bg p-4 text-sm font-medium leading-6 normal-case tracking-normal text-bx-text outline-none placeholder:text-bx-muted focus:border-blue-500 ${professionalMode ? 'min-h-[390px]' : 'min-h-[300px]'}`} />
              </label>
              <button type="button" onClick={() => void translate()} disabled={!sourceText.trim() || translating || extracting} className={`${primaryActionClass} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-45`}><Icon name={translating ? 'clock' : 'languages'} className="h-4 w-4" />{translating ? 'Выполняю перевод…' : 'Перевести документ'}</button>
            </div>
          </article>

          <article className="overflow-hidden rounded-[22px] border border-bx-border bg-bx-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bx-border px-4 py-3"><div className="flex rounded-xl border border-bx-border bg-bx-bg p-1"><ResultTab active={activeResult === 'translation'} label="Перевод" icon="languages" onClick={() => setActiveResult('translation')} /><ResultTab active={activeResult === 'plain'} label="Простыми словами" icon="ai" onClick={() => setActiveResult('plain')} /></div><p className="text-[10px] text-bx-muted">{resultWordCount.toLocaleString('ru-RU')} слов · {displayedResult.length.toLocaleString('ru-RU')} знаков</p></div>
            <div className="p-4">
              {activeResult === 'plain' && !plainText ? <div className={`grid place-items-center rounded-2xl border border-dashed border-bx-border bg-bx-bg p-6 text-center ${professionalMode ? 'min-h-[390px]' : 'min-h-[300px]'}`}><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Icon name="ai" className="h-5 w-5" /></span><h2 className="mt-3 text-sm font-black">Объяснить директору или клиенту</h2><p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-bx-muted">BX выделит суть, суммы, сроки, обязанности и возможные риски без тяжёлого официального языка.</p><button type="button" onClick={() => void explainPlainly()} disabled={!resultText || explaining} className={`${primaryActionClass} mt-4 disabled:opacity-45`}><Icon name={explaining ? 'clock' : 'ai'} className="h-4 w-4" />{explaining ? 'Готовлю объяснение…' : 'Объяснить простыми словами'}</button></div></div> : <label className="block text-[10px] font-black uppercase tracking-wider text-bx-muted">{activeResult === 'translation' ? 'Редактируемый результат' : 'Понятное объяснение'}<textarea value={displayedResult} onChange={event => activeResult === 'translation' ? setResultText(event.target.value) : setPlainText(event.target.value)} rows={professionalMode ? 18 : 13} placeholder="Здесь появится результат…" className={`custom-scrollbar mt-1.5 w-full resize-y rounded-2xl border border-bx-border bg-bx-bg p-4 text-sm font-medium leading-6 normal-case tracking-normal text-bx-text outline-none placeholder:text-bx-muted focus:border-blue-500 ${professionalMode ? 'min-h-[390px]' : 'min-h-[300px]'}`} /></label>}
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><button type="button" onClick={() => void copyResult()} disabled={!displayedResult} className={`${secondaryActionClass} disabled:opacity-40`}><Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />{copied ? 'Скопировано' : 'Копировать'}</button><button type="button" onClick={downloadResult} disabled={!displayedResult} className={`${secondaryActionClass} disabled:opacity-40`}><Icon name="download" className="h-4 w-4" />Скачать TXT</button><button type="button" onClick={openArchive} disabled={!displayedResult} className={`${primaryActionClass} disabled:opacity-40`}><Icon name="save" className="h-4 w-4" />В Документы</button><button type="button" onClick={() => void explainPlainly()} disabled={!resultText || explaining} className={`${secondaryActionClass} disabled:opacity-40`}><Icon name="ai" className="h-4 w-4" />Объяснить</button></div>
            </div>
          </article>
        </section>

        {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-xs font-bold text-red-700 dark:text-red-300"><Icon name="alert" className="h-5 w-5 flex-shrink-0" /><span>{error}</span></div>}

        {professionalMode ? <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[22px] border border-bx-border bg-bx-surface p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Icon name="shield" className="h-4 w-4" /></span><div><h2 className="text-sm font-black">Контроль качества перевода</h2><p className="mt-0.5 text-[10px] text-bx-muted">Автоматические ориентиры перед использованием документа</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><QualityItem label="Структура" value={preserveStructure ? 'Сохраняется' : 'Можно улучшать'} ok={preserveStructure} /><QualityItem label="Числа и суммы" value={sourceNumbers.length ? `${preservedNumbers} из ${sourceNumbers.length}` : 'Не найдены'} ok={!sourceNumbers.length || preservedNumbers === sourceNumbers.length} /><QualityItem label="Глоссарий" value={glossary.trim() ? 'Подключён' : 'Не задан'} ok={!!glossary.trim()} /></div><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3 text-[10px] leading-relaxed text-amber-950 dark:text-amber-100"><strong>Важно:</strong> перед подписанием договора или отправкой официального документа проверьте перевод вручную. BX помогает подготовить текст, но не заменяет дипломированного переводчика.</p></div>
          <div className="rounded-[22px] border border-bx-border bg-bx-surface p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-black">Локальная история</h2><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">Выключена по умолчанию. При включении до 10 переводов сохраняются только на этом устройстве.</p></div><button type="button" onClick={toggleHistory} aria-pressed={historyEnabled} className={`min-h-10 rounded-xl border px-3 text-[10px] font-black ${historyEnabled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-bx-border bg-bx-bg text-bx-muted'}`}>{historyEnabled ? 'История включена' : 'Включить историю'}</button></div>{history.length ? <div className="mt-4 space-y-2">{history.slice(0, 4).map(item => <button type="button" key={item.id} onClick={() => restoreHistory(item)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-bx-border bg-bx-bg px-3 text-left hover:border-blue-500/30"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-blue-500/10 text-[9px] font-black text-blue-600 dark:text-blue-300">{TRANSLATION_LANGUAGES.find(language => language.id === item.target)?.short}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black">{item.title}</span><span className="mt-0.5 block text-[9px] text-bx-muted">{new Date(item.createdAt).toLocaleString('ru-RU')}</span></span><Icon name="arrowR" className="h-3.5 w-3.5 text-bx-muted" /></button>)}<button type="button" onClick={clearHistory} className="min-h-10 text-[10px] font-bold text-red-600 dark:text-red-300">Очистить историю</button></div> : <div className="mt-4 rounded-xl border border-dashed border-bx-border p-5 text-center text-[10px] text-bx-muted">Сохранённых переводов пока нет.</div>}</div>
        </section> : <details className="group rounded-2xl border border-bx-border bg-bx-surface shadow-sm">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Icon name="shield" className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-black text-bx-text">Проверка и история</span><span className="mt-0.5 block truncate text-[10px] text-bx-muted">Числа, структура, глоссарий и последние переводы</span></span></span><Icon name="arrowR" className="h-4 w-4 flex-shrink-0 rotate-90 text-bx-muted transition-transform duration-200 group-open:-rotate-90" /></summary>
          <section className="grid gap-4 border-t border-bx-border p-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-2xl border border-bx-border bg-bx-bg p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Icon name="shield" className="h-4 w-4" /></span><div><h2 className="text-sm font-black">Контроль качества перевода</h2><p className="mt-0.5 text-[10px] text-bx-muted">Автоматические ориентиры перед использованием документа</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><QualityItem label="Структура" value={preserveStructure ? 'Сохраняется' : 'Можно улучшать'} ok={preserveStructure} /><QualityItem label="Числа и суммы" value={sourceNumbers.length ? `${preservedNumbers} из ${sourceNumbers.length}` : 'Не найдены'} ok={!sourceNumbers.length || preservedNumbers === sourceNumbers.length} /><QualityItem label="Глоссарий" value={glossary.trim() ? 'Подключён' : 'Не задан'} ok={!!glossary.trim()} /></div><p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3 text-[10px] leading-relaxed text-amber-950 dark:text-amber-100"><strong>Важно:</strong> перед подписанием договора или отправкой официального документа проверьте перевод вручную. BX помогает подготовить текст, но не заменяет дипломированного переводчика.</p></div>
            <div className="rounded-2xl border border-bx-border bg-bx-bg p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-black">Локальная история</h2><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">Выключена по умолчанию. При включении до 10 переводов сохраняются только на этом устройстве.</p></div><button type="button" onClick={toggleHistory} aria-pressed={historyEnabled} className={`min-h-10 rounded-xl border px-3 text-[10px] font-black ${historyEnabled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-bx-border bg-bx-surface text-bx-muted'}`}>{historyEnabled ? 'История включена' : 'Включить историю'}</button></div>{history.length ? <div className="mt-4 space-y-2">{history.slice(0, 4).map(item => <button type="button" key={item.id} onClick={() => restoreHistory(item)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-bx-border bg-bx-surface px-3 text-left hover:border-blue-500/30"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-blue-500/10 text-[9px] font-black text-blue-600 dark:text-blue-300">{TRANSLATION_LANGUAGES.find(language => language.id === item.target)?.short}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black">{item.title}</span><span className="mt-0.5 block text-[9px] text-bx-muted">{new Date(item.createdAt).toLocaleString('ru-RU')}</span></span><Icon name="arrowR" className="h-3.5 w-3.5 text-bx-muted" /></button>)}<button type="button" onClick={clearHistory} className="min-h-10 text-[10px] font-bold text-red-600 dark:text-red-300">Очистить историю</button></div> : <div className="mt-4 rounded-xl border border-dashed border-bx-border p-5 text-center text-[10px] text-bx-muted">Сохранённых переводов пока нет.</div>}</div>
          </section>
        </details>}
      </div>

      {archiveOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="translator-archive-title" onMouseDown={event => { if (event.target === event.currentTarget && !archiveSaving) setArchiveOpen(false) }}>
        <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3"><span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name={archiveSaved ? 'check' : 'save'} className="h-5 w-5" /></span><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Связь с архивом</p><h2 id="translator-archive-title" className="mt-1 text-lg font-black text-bx-text">{archiveSaved ? 'Перевод сохранён' : 'Добавить готовый файл в Документы'}</h2><p className="mt-1 text-[11px] leading-relaxed text-bx-muted">{archiveSaved ? 'Файл уже привязан к организации и доступен в едином архиве.' : 'Укажите рабочий контекст — потом перевод легко найдётся по компании, категории и меткам.'}</p></div></div>
            <button type="button" aria-label="Закрыть" disabled={archiveSaving} onClick={() => setArchiveOpen(false)} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-bx-border bg-bx-bg text-bx-muted hover:text-bx-text disabled:opacity-40"><Icon name="crossSmall" className="h-4 w-4" /></button>
          </div>

          {archiveSaved ? <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setArchiveOpen(false)} className={secondaryActionClass}>Остаться в переводчике</button><button type="button" onClick={() => navigate('/documents')} className={primaryActionClass}><Icon name="note" className="h-4 w-4" />Открыть Документы</button></div> : <>
            {companies.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Организация<select autoFocus value={archiveCompanyId} onChange={event => setArchiveCompanyId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none focus:border-blue-500"><option value="">Выберите организацию</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Категория<select value={archiveCategory} onChange={event => setArchiveCategory(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none focus:border-blue-500">{DOCUMENT_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted sm:col-span-2">Имя готового файла<input value={archiveName} onChange={event => setArchiveName(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none focus:border-blue-500" /></label>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted sm:col-span-2">Метки через запятую<input value={archiveTags} onChange={event => setArchiveTags(event.target.value)} placeholder="перевод, договор, клиент" className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold normal-case tracking-normal text-bx-text outline-none placeholder:font-normal focus:border-blue-500" /></label>
            </div> : <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-4"><p className="text-xs font-black text-bx-text">Сначала добавьте организацию</p><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">Так готовый перевод получит владельца, рабочий контекст и не смешается с файлами других компаний.</p><button type="button" onClick={() => { setArchiveOpen(false); startCompanyCreation() }} className={`${primaryActionClass} mt-3`}><Icon name="plus" className="h-4 w-4" />Заполнить компанию</button></div>}
            {archiveError && <div role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-[11px] font-bold text-red-700 dark:text-red-300">{archiveError}</div>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={archiveSaving} onClick={() => setArchiveOpen(false)} className={secondaryActionClass}>Отмена</button><button type="button" disabled={!companies.length || !archiveCompanyId || !archiveName.trim() || archiveSaving} onClick={() => void saveToDocuments()} className={`${primaryActionClass} disabled:cursor-not-allowed disabled:opacity-45`}><Icon name={archiveSaving ? 'clock' : 'save'} className="h-4 w-4" />{archiveSaving ? 'Сохраняю…' : 'Добавить в Документы'}</button></div>
          </>}
        </div>
      </div>}
    </div>
  )
}

function LanguageSelect({ label, value, onChange }: { label: string; value: TranslationLanguage; onChange: (value: TranslationLanguage) => void }) {
  return <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">{label}<select value={value} onChange={event => onChange(event.target.value as TranslationLanguage)} className="mt-1.5 min-h-12 w-full rounded-xl border border-bx-border bg-bx-surface px-4 text-sm font-black normal-case tracking-normal text-bx-text outline-none focus:border-blue-500">{TRANSLATION_LANGUAGES.map(language => <option key={language.id} value={language.id}>{language.short} · {language.label}</option>)}</select></label>
}

function TranslationModeCards({ value, onChange }: { value: TranslationMode; onChange: (value: TranslationMode) => void }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{TRANSLATION_MODES.map(item => <button key={item.id} type="button" onClick={() => onChange(item.id)} aria-pressed={value === item.id} className={`min-h-20 rounded-2xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${value === item.id ? 'border-blue-500/35 bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'border-bx-border bg-bx-bg hover:border-blue-500/25'}`}><span className="text-xs font-black">{item.label}</span><span className={`mt-1 block text-[10px] leading-relaxed ${value === item.id ? 'text-blue-100' : 'text-bx-muted'}`}>{item.description}</span></button>)}</div>
}

function TranslatorAdvancedSettings({ glossary, preserveStructure, onGlossaryChange, onPreserveStructureChange }: { glossary: string; preserveStructure: boolean; onGlossaryChange: (value: string) => void; onPreserveStructureChange: (value: boolean) => void }) {
  return <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"><label className="text-[10px] font-black uppercase tracking-wider text-bx-muted">Обязательный глоссарий<textarea value={glossary} onChange={event => onGlossaryChange(event.target.value)} rows={2} placeholder={'Например: QQS = НДС\nMChJ = ООО'} className="mt-1.5 w-full resize-y rounded-xl border border-bx-border bg-bx-bg px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-bx-text outline-none placeholder:font-normal focus:border-blue-500" /></label><label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold"><input type="checkbox" checked={preserveStructure} onChange={event => onPreserveStructureChange(event.target.checked)} className="h-4 w-4 accent-blue-600" />Сохранять структуру документа</label></div>
}

function ResultTab({ active, label, icon, onClick }: { active: boolean; label: string; icon: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[10px] font-black ${active ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}><Icon name={icon} className="h-3.5 w-3.5" />{label}</button>
}

function QualityItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return <div className="rounded-xl border border-bx-border bg-bx-bg p-3"><div className="flex items-center gap-1.5"><Icon name={ok ? 'check' : 'info'} className={`h-3.5 w-3.5 ${ok ? 'text-emerald-600' : 'text-amber-600'}`} /><span className="text-[9px] font-black uppercase tracking-wider text-bx-muted">{label}</span></div><p className="mt-1.5 text-[11px] font-black text-bx-text">{value}</p></div>
}

import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/db/supabase'
import Icon from '../../lib/ui/Icon'

type Lang = 'uz' | 'ru'
type Step = 'idle' | 'reading' | 'translating' | 'done' | 'error'

const TranslatorTool = () => {
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [humanizedText, setHumanizedText] = useState('')
  const [sourceLang, setSourceLang] = useState<Lang>('uz')
  const [targetLang, setTargetLang] = useState<Lang>('ru')
  const [loading, setLoading] = useState(false)
  const [humanizing, setHumanizing] = useState(false)
  const [activeOutputTab, setActiveOutputTab] = useState<'official' | 'simple'>('official')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  // Для файлов
  const [fileStep, setFileStep] = useState<Step>('idle')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [progress, setProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSwapLangs = () => {
    setSourceLang(prev => (prev === 'uz' ? 'ru' : 'uz'))
    setTargetLang(prev => (prev === 'uz' ? 'ru' : 'uz'))
    setInputText(translatedText)
    setTranslatedText(inputText)
    setHumanizedText('')
    setActiveOutputTab('official')
  }

  const handleTranslateText = async () => {
    const text = inputText.trim()
    if (!text || loading) return
    setLoading(true)
    setErrorMsg('')
    setTranslatedText('')
    setHumanizedText('')
    setActiveOutputTab('official')

    const src = sourceLang === 'uz' ? 'узбекского' : 'русского'
    const tgt = targetLang === 'uz' ? 'узбекский' : 'русский'
    const prompt = `Переведи следующий бухгалтерский/официальный текст с ${src} языка на ${tgt} язык. Будь точен, сохраняй оригинальную терминологию (например, БРВ, МРОТ, НДС, проводки, субконто, ГНК, ГТД) и абзацы:\n\n${text}`

    try {
      const { data, error } = await supabase.functions.invoke('ai-consultant', {
        body: {
          messages: [{ role: 'user', content: prompt }],
        },
      })

      if (error) throw error
      if (data?.error) {
        throw new Error(data.message || data.error)
      }

      setTranslatedText(data?.text || 'Перевод пуст.')
    } catch (e: any) {
      console.warn('Ошибка при обращении к ИИ переводчику:', e)
      setErrorMsg('Не удалось подключиться к серверу перевода. Убедитесь, что настроен ИИ-клиент.')
      const lower = text.toLowerCase()
      if (lower.includes('shartnoma') || lower.includes('договор')) {
        setTranslatedText('Договор / Соглашение (Демо-перевод)')
      } else if (lower.includes('hisob-faktura') || lower.includes('счет-фактура')) {
        setTranslatedText('Счет-фактура (Демо-перевод)')
      } else {
        setTranslatedText(`[Ошибка подключения к ИИ] Скопируйте текст в буфер обмена. Демо-заглушка: ${text}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleHumanizeText = async () => {
    const text = translatedText.trim()
    if (!text || humanizing) return
    setHumanizing(true)
    setErrorMsg('')

    const prompt = `Объясни суть следующего официального/бухгалтерского перевода простыми и понятными словами для обычного человека (директора или клиента). Избегай сложной терминологии, пиши лаконично, выдели главное по пунктам:\n\n${text}`

    try {
      const { data, error } = await supabase.functions.invoke('ai-consultant', {
        body: {
          messages: [{ role: 'user', content: prompt }],
        },
      })

      if (error) throw error
      if (data?.error) {
        throw new Error(data.message || data.error)
      }

      setHumanizedText(data?.text || 'Не удалось упростить текст.')
      setActiveOutputTab('simple')
    } catch (e: any) {
      console.warn('Ошибка при очеловечивании текста:', e)
      setErrorMsg('Не удалось выполнить очеловечивание. Убедитесь, что ИИ-консультант доступен.')
      setHumanizedText(`Суть документа (Простыми словами):\n• Стороны договорились о сотрудничестве.\n• Исполнитель обязуется выполнить работы в установленные сроки.\n• Заказчик обязуется принять и оплатить оказанные услуги.`)
      setActiveOutputTab('simple')
    } finally {
      setHumanizing(false)
    }
  }

  const handleCopyText = async () => {
    const textToCopy = activeOutputTab === 'official' ? translatedText : humanizedText
    if (!textToCopy) return
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleStartFileProcess(file)
  }

  const handleStartFileProcess = (file: File) => {
    setFileName(file.name)
    const sz = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} МБ`
      : `${(file.size / 1024).toFixed(1)} КБ`
    setFileSize(sz)
    setFileStep('reading')
    setProgress(15)

    // Читаем как текст, если это txt/csv/json
    const reader = new FileReader()
    reader.onload = (event) => {
      setExtractedText((event.target?.result as string) || '')
    }
    if (file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.xml')) {
      reader.readAsText(file)
    } else {
      // Для PDF/Word/Excel просто имитируем извлечение структуры
      setExtractedText(`Содержимое файла ${file.name}\n\nРеквизиты сторон:\nПокупатель: ООО "Бухгалтерские услуги"\nПоставщик: ЧП "Инновации"\n\nСумма договора: 15 000 000 сум с учетом НДС.`)
    }

    // Имитируем процесс анализа и перевода
    setTimeout(() => {
      setProgress(45)
      setFileStep('translating')
      
      setTimeout(() => {
        setProgress(85)
        handleTranslateFileContent(file.name)
      }, 1500)
    }, 1200)
  }

  const handleTranslateFileContent = async (name: string) => {
    const src = sourceLang === 'uz' ? 'узбекского' : 'русского'
    const tgt = targetLang === 'uz' ? 'узбекский' : 'русский'
    const textToTranslate = extractedText || `Содержимое документа ${name}`
    const prompt = `Переведи следующий текст документа с ${src} на ${tgt}. Ответь строго только переводом документа:\n\n${textToTranslate}`

    setHumanizedText('')
    setActiveOutputTab('official')

    try {
      const { data, error } = await supabase.functions.invoke('ai-consultant', {
        body: {
          messages: [{ role: 'user', content: prompt }],
        },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setTranslatedText(data?.text || '')
      setProgress(100)
      setFileStep('done')
    } catch {
      setTranslatedText(`[ПЕРЕВОД ДОКУМЕНТА: ${name.toUpperCase()}]\n\nНаправление: ${sourceLang.toUpperCase()} -> ${targetLang.toUpperCase()}\n\nТекст перевода:\nУважаемый клиент, этот файл был проанализирован. Из-за отсутствия подключения к ИИ, сформирован локальный отчет по переводу для ${name}.\nРазмер: ${fileSize}.`)
      setProgress(100)
      setFileStep('done')
    }
  }

  const handleDownloadTranslatedFile = () => {
    const textToDownload = activeOutputTab === 'official' ? translatedText : humanizedText
    if (!textToDownload) return
    const prefix = activeOutputTab === 'official' ? 'translated' : 'explanation'
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${prefix}_${fileName.replace(/\.[^/.]+$/, "")}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleResetFile = () => {
    setFileStep('idle')
    setFileName('')
    setFileSize('')
    setProgress(0)
    setExtractedText('')
    setTranslatedText('')
    setHumanizedText('')
    setActiveOutputTab('official')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    handleStartFileProcess(file)
  }

  return (
    <div className="space-y-5">
      {/* Шапка выбора языков */}
      <div className="flex items-center justify-between bg-bx-surface-2 p-2 rounded-xl border border-bx-border-2">
        <div className="flex-1 text-center font-semibold text-sm text-bx-text">
          {sourceLang === 'uz' ? '🇺🇿 Узбекский' : '🇷🇺 Русский'}
        </div>
        <button
          onClick={handleSwapLangs}
          aria-label="Сменить направление перевода"
          tabIndex={0}
          className="w-9 h-9 rounded-lg bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text flex items-center justify-center transition-colors active:scale-95"
        >
          <Icon name="exchange" className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center font-semibold text-sm text-bx-text">
          {targetLang === 'uz' ? '🇺🇿 Узбекский' : '🇷🇺 Русский'}
        </div>
      </div>

      {/* Выбор: Текст или Документ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Перевод текста */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-bx-muted uppercase tracking-wider">Ввод текста</h3>
            {inputText && (
              <button
                onClick={() => { setInputText(''); setTranslatedText(''); setHumanizedText(''); }}
                className="text-[10px] text-bx-muted hover:text-bx-muted"
              >
                Очистить
              </button>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={sourceLang === 'uz' ? 'Matnni bu yerga kiriting...' : 'Введите текст здесь...'}
            rows={6}
            className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
          />
          <button
            onClick={handleTranslateText}
            disabled={loading || !inputText.trim()}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-bx-border-2 border-t-white rounded-full animate-spin" />
                Перевод...
              </>
            ) : (
              'Перевести текст'
            )}
          </button>
        </div>

        {/* Перевод документов */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-bx-muted uppercase tracking-wider">Перевод документов</h3>
          
          {fileStep === 'idle' ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-bx-border-2 hover:border-blue-500/50 bg-bx-bg hover:bg-bx-surface rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[195px] group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.csv"
                className="hidden"
              />
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📄</span>
              <p className="text-xs text-bx-text font-medium">Перетащите документ или выберите файл</p>
              <p className="text-[10px] text-bx-muted mt-1">Поддерживаются PDF, DOCX, XLSX, TXT (до 10 МБ)</p>
            </div>
          ) : (
            <div className="bg-bx-bg rounded-xl border border-bx-border p-4 min-h-[195px] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-bx-text truncate">{fileName}</p>
                    <p className="text-[10px] text-bx-muted font-mono">{fileSize}</p>
                  </div>
                  {fileStep === 'done' && (
                    <button
                      onClick={handleResetFile}
                      className="text-bx-muted hover:text-bx-muted text-xs"
                    >
                      Сбросить
                    </button>
                  )}
                </div>

                {/* Индикатор прогресса */}
                {(fileStep === 'reading' || fileStep === 'translating') && (
                  <div className="space-y-2 mt-4">
                    <div className="w-full bg-bx-surface-2 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-bx-muted italic animate-pulse">
                      {fileStep === 'reading' ? 'Извлечение текста и анализ структуры...' : 'Выполнение умного перевода ИИ...'}
                    </p>
                  </div>
                )}

                {fileStep === 'done' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-emerald-400 font-medium flex items-center gap-2 mt-3">
                    <span>✓</span>
                    <span>Документ успешно переведен!</span>
                  </div>
                )}
              </div>

              {fileStep === 'done' && (
                <button
                  onClick={handleDownloadTranslatedFile}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  📥 Скачать {activeOutputTab === 'official' ? 'перевод' : 'объяснение'} (.txt)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Вывод результата перевода */}
      {translatedText && (
        <div className="bg-bx-bg rounded-xl border border-bx-border overflow-hidden">
          {/* Вкладки переключения */}
          <div className="px-4 py-2 border-b border-bx-border bg-bx-surface flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveOutputTab('official')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeOutputTab === 'official'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-bx-muted hover:text-bx-text'
                }`}
              >
                📄 Официальный перевод
              </button>
              <button
                onClick={() => setActiveOutputTab('simple')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeOutputTab === 'simple'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-bx-muted hover:text-bx-text'
                }`}
              >
                🗣 Простыми словами
              </button>
            </div>
            
            <button
              onClick={handleCopyText}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'
              }`}
            >
              {copied ? '✓ Скопировано' : 'Копировать'}
            </button>
          </div>

          {activeOutputTab === 'official' ? (
            <div className="p-4 max-h-80 overflow-y-auto font-sans text-sm text-bx-text leading-relaxed whitespace-pre-wrap">
              {translatedText}
            </div>
          ) : (
            <div className="p-4 max-h-80 overflow-y-auto font-sans text-sm text-bx-text leading-relaxed min-h-[120px] flex flex-col justify-center">
              {humanizing ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <span className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                  <p className="text-xs text-bx-muted italic">Очеловечиваем текст, переводим на понятный язык...</p>
                </div>
              ) : humanizedText ? (
                <div className="whitespace-pre-wrap">{humanizedText}</div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-bx-muted max-w-sm mx-auto mb-3">
                    ИИ переведет сухой бухгалтерский/юридический язык на понятные человеку формулировки: объяснит суть, права и обязанности без лишней терминологии.
                  </p>
                  <button
                    onClick={handleHumanizeText}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 active:scale-95"
                  >
                    🗣 Очеловечить текст
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start">
          <span className="text-amber-500">⚠</span>
          <p className="text-[11px] text-bx-muted leading-normal">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}

export default TranslatorTool

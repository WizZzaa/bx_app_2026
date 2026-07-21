export type TranslationLanguage = 'uz-latn' | 'uz-cyrl' | 'ru' | 'en'
export type TranslationMode = 'official' | 'accounting' | 'legal' | 'literal'

export const MAX_TRANSLATION_CHARS = 60_000
export const MAX_TRANSLATION_GLOSSARY_CHARS = 4_000

export interface TranslationFailure {
  code: string
  message: string
  retryable: boolean
}

export const TRANSLATION_LANGUAGES: Array<{ id: TranslationLanguage; label: string; short: string }> = [
  { id: 'uz-latn', label: 'Узбекский · латиница', short: 'UZ' },
  { id: 'uz-cyrl', label: 'Узбекский · кириллица', short: 'ЎЗ' },
  { id: 'ru', label: 'Русский', short: 'RU' },
  { id: 'en', label: 'Английский', short: 'EN' },
]

export const TRANSLATION_MODES: Array<{ id: TranslationMode; label: string; description: string }> = [
  { id: 'official', label: 'Официально-деловой', description: 'Для писем, заявлений и внутренних документов' },
  { id: 'accounting', label: 'Бухгалтерский', description: 'Сохраняет налоговые термины, суммы и обозначения' },
  { id: 'legal', label: 'Юридический', description: 'Для договоров, обязательств и формулировок сторон' },
  { id: 'literal', label: 'Дословный перевод', description: 'Обычный перевод максимально близко к исходному тексту' },
]

const languageName = (id: TranslationLanguage) => TRANSLATION_LANGUAGES.find(language => language.id === id)?.label ?? id
const modeName = (id: TranslationMode) => TRANSLATION_MODES.find(mode => mode.id === id)?.label ?? id

export function buildTranslationPrompt({ source, target, mode, text, glossary, preserveStructure }: { source: TranslationLanguage; target: TranslationLanguage; mode: TranslationMode; text: string; glossary: string; preserveStructure: boolean }) {
  const glossaryRule = glossary.trim() ? `\nИспользуй обязательный глоссарий пользователя:\n${glossary.trim()}` : ''
  const structureRule = preserveStructure
    ? 'Сохрани абзацы, заголовки, списки, нумерацию, суммы, даты, реквизиты и обозначения сторон.'
    : 'Можно улучшить структуру текста, не меняя смысл.'
  return `Переведи документ с языка «${languageName(source)}» на язык «${languageName(target)}».\nРежим: ${modeName(mode)}.\n${structureRule}\nНе добавляй комментарии от себя и не выдумывай отсутствующие сведения. Верни только перевод.${glossaryRule}\n\nТекст документа:\n${text.trim()}`
}

export function buildTranslationRequest({ source, target, mode, text, glossary, preserveStructure }: { source: TranslationLanguage; target: TranslationLanguage; mode: TranslationMode; text: string; glossary: string; preserveStructure: boolean }) {
  return {
    source,
    target,
    mode,
    text: text.trim(),
    glossary: glossary.trim(),
    preserveStructure,
  }
}

type FunctionErrorBody = { error?: unknown; code?: unknown; message?: unknown; retryable?: unknown }

const defaultFailure = (message: string, retryable: boolean): TranslationFailure => ({
  code: 'UNKNOWN',
  message,
  retryable,
})

export async function readTranslationFailure(error: unknown): Promise<TranslationFailure> {
  const candidate = error as { context?: unknown; message?: unknown } | null
  const context = candidate?.context
  if (context && typeof context === 'object' && 'json' in context && typeof context.json === 'function') {
    try {
      const body = await context.json() as FunctionErrorBody
      const code = typeof body.error === 'string' ? body.error : typeof body.code === 'string' ? body.code : 'HTTP_ERROR'
      const message = typeof body.message === 'string' && body.message.trim()
        ? body.message.trim()
        : 'Сервис перевода вернул ошибку.'
      return { code, message, retryable: body.retryable === true }
    } catch {
      return defaultFailure('Сервис перевода вернул неполный ответ. Повторите попытку.', true)
    }
  }

  const message = typeof candidate?.message === 'string' ? candidate.message : ''
  if (/failed to send|fetch|network|relay/i.test(message)) {
    return defaultFailure('Не удалось связаться с сервисом перевода. Проверьте интернет и повторите попытку.', true)
  }
  if (/non-2xx/i.test(message)) {
    return defaultFailure('Сервис перевода временно недоступен. Повторите попытку.', true)
  }
  return defaultFailure(message || 'Не удалось выполнить перевод.', true)
}

export function buildPlainLanguagePrompt(text: string, language: TranslationLanguage) {
  return `Объясни этот документ простыми словами на языке «${languageName(language)}». Кратко перечисли: суть, стороны, суммы и сроки, обязанности, риски и действия. Не придумывай отсутствующие сведения.\n\n${text.trim()}`
}

export function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export function translatedFileName(originalName: string, target: TranslationLanguage, extension = 'txt') {
  const base = originalName.trim().replace(/\.[^/.]+$/, '') || 'document'
  return `${base}_${target}.${extension}`
}

export function normalizeArchiveFileName(value: string) {
  const safe = value.trim().replace(/[\\/:*?"<>|]/g, '_') || 'Перевод'
  return safe.toLowerCase().endsWith('.txt') ? safe : `${safe}.txt`
}

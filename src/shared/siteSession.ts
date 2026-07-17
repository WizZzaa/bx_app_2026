export type SiteResetMode = 'cache' | 'full'

export interface SiteSessionResult {
  success: boolean
  origin?: string
  reopened?: boolean
  signedOut?: boolean
  message?: string
  error?: string
}

export interface NormalizedSiteUrl {
  url: string
  origin: string
  hostname: string
}

/** Normalize and validate a user-entered address before it reaches Electron. */
export function normalizeSiteUrl(value: string): NormalizedSiteUrl {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Введите адрес сайта')
  if (trimmed.length > 2048) throw new Error('Адрес сайта слишком длинный')

  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(withProtocol)
  } catch {
    throw new Error('Проверьте адрес сайта')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Можно открыть только веб-сайт с адресом http или https')
  }
  if (!parsed.hostname) throw new Error('В адресе не указано имя сайта')
  if (parsed.username || parsed.password) {
    throw new Error('Не вставляйте логин или пароль в адрес сайта')
  }

  return {
    url: parsed.toString(),
    origin: parsed.origin,
    hostname: parsed.hostname,
  }
}

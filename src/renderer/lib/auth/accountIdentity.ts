const INTERNAL_TELEGRAM_EMAIL = /^telegram-[0-9]+@auth\.bx\.uz$/i

export function publicContactEmail(email: string | null | undefined): string | undefined {
  const normalized = email?.trim()
  if (!normalized || INTERNAL_TELEGRAM_EMAIL.test(normalized)) return undefined
  return normalized
}

export function accountDisplayLabel(email: string | null | undefined): string {
  return publicContactEmail(email) || 'Аккаунт Telegram'
}

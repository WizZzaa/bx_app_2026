import { describe, expect, it } from 'vitest'
import { accountDisplayLabel, publicContactEmail } from './accountIdentity'

describe('public account identity', () => {
  it('never exposes a generated Telegram auth email', () => {
    expect(publicContactEmail('telegram-8375719925@auth.bx.uz')).toBeUndefined()
    expect(accountDisplayLabel('telegram-8375719925@auth.bx.uz')).toBe('Аккаунт Telegram')
  })

  it('preserves a real contact email for a migrated account', () => {
    expect(publicContactEmail('owner@example.com')).toBe('owner@example.com')
    expect(accountDisplayLabel('owner@example.com')).toBe('owner@example.com')
  })
})

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

const migration = source(
  '../../../../supabase/migrations/20260719193156_harden_support_automation_and_auth_indexes.sql',
)

describe('support automation security migration', () => {
  it('allows only the three supported message authors', () => {
    expect(migration).toContain("check (author in ('user', 'staff', 'auto'))")
  })

  it('removes legacy policies that bypass the canonical owner contract', () => {
    expect(migration).toContain('drop policy if exists "Users can update own tickets"')
    expect(migration).toContain('drop policy if exists "Users can insert messages to own tickets"')
  })

  it('removes the superseded trigger and keeps the migration data-safe', () => {
    expect(migration).toContain('drop trigger if exists on_new_ticket_message')
    expect(migration).not.toMatch(/\btruncate\b/i)
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
    expect(migration).not.toMatch(/\bdelete\s+from\b/i)
  })

  it('indexes the two foreign keys reported by the database advisor', () => {
    expect(migration).toContain('bx_telegram_login_challenges (account_id)')
    expect(migration).toContain('bx_recovery_attempts (code_id)')
  })
})

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

const migration = source('../../../../supabase/migrations/20260719190725_restore_trusted_devices_server_contract.sql')
const authClient = source('../../renderer/lib/auth/useAuth.ts')
const deviceClient = source('../../renderer/lib/auth/device.ts')
const deviceGate = source('../../renderer/components/auth/DeviceGateScreen.tsx')

describe('trusted device security contract', () => {
  it('restores the hosted device registry additively without rewriting rows', () => {
    expect(migration).toContain('create table if not exists public.bx_devices')
    expect(migration).toContain('add column if not exists session_id uuid')
    expect(migration).not.toMatch(/\btruncate\b/i)
    expect(migration).not.toMatch(/\bdrop table\b/i)
  })

  it('stores only a server-side digest of the installation token', () => {
    expect(migration).toContain("digest(p_installation_token, 'sha256')")
    expect(migration).not.toContain("jsonb_build_object('installationToken'")
    expect(migration).not.toContain('installation_token text not null')
  })

  it('scopes every device operation to the authenticated account', () => {
    expect(migration).toContain('v_uid uuid := auth.uid()')
    expect(migration).toContain('where d.account_id = (select auth.uid())')
    expect(migration).toContain('account_id = v_uid and revoked_at is null')
    expect(migration).toContain('revoke all on table public.bx_devices from public, anon, authenticated')
  })

  it('preserves FOUND before the aggregate count and blocks self re-trust', () => {
    expect(migration).toContain('v_has_existing := found')
    expect(migration.indexOf('v_has_existing := found')).toBeLessThan(migration.indexOf('select count(*)'))
    expect(migration).toContain("jsonb_build_object('status', 'revoked'")
    expect(deviceClient).toContain("'trusted' | 'revoked' | 'limit_exceeded'")
  })

  it('revokes only a non-current device refresh session', () => {
    expect(migration).toContain("raise exception 'CANNOT_REVOKE_CURRENT_DEVICE'")
    expect(migration).toContain('delete from auth.sessions')
    expect(migration).toContain('where id = v_device.session_id and user_id = v_uid')
    expect(deviceGate).toContain('выданный короткий токен может действовать до своего истечения')
  })

  it('uses local sign-out so one device cannot log out every other device', () => {
    expect(authClient).toContain("supabase.auth.signOut({ scope: 'local' })")
    expect(authClient).not.toContain('supabase.auth.signOut()')
  })
})

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { IPC } from '../../shared/ipc-channels'

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

describe('ECP security boundary', () => {
  it('does not expose document-signing IPC channels', () => {
    expect(Object.keys(IPC).filter(key => key.includes('SIGN') || key.includes('SIG_FILE'))).toEqual([])
  })

  it('never ships a default certificate password', () => {
    const manager = source('../../renderer/pages/EcpManager.tsx')
    expect(manager).not.toContain("useState('123456')")
    expect(manager).not.toContain('по умолчанию 123456')
  })

  it('invokes openssl without a shell or password in argv', () => {
    const parser = source('./ecpParser.ts')
    expect(parser).not.toContain('exec(')
    expect(parser).not.toContain('-passin "pass:')
    expect(parser).toContain("'-passin', 'stdin'")
  })

  it('never exposes a selected certificate path to the renderer', () => {
    const parser = source('./ecpParser.ts')
    const preload = source('../../preload.ts')
    expect(parser).toContain('selectedFiles.set(handle')
    expect(parser).toContain('selectedFiles.delete(fileHandle)')
    expect(preload).toContain('parsePfx: (fileHandle: string')
    expect(preload).not.toContain('parsePfx: (filePath: string')
  })

  it('bounds certificate size, parser output and processing time', () => {
    const parser = source('./ecpParser.ts')
    expect(parser).toContain('MAX_CERTIFICATE_BYTES')
    expect(parser).toContain('MAX_OPENSSL_OUTPUT_BYTES')
    expect(parser).toContain('PARSE_TIMEOUT_MS')
  })

  it('extracts only safe certificate metadata for monitoring', () => {
    const parser = source('./ecpParser.ts')
    const storage = source('../../renderer/lib/ecpStorage.ts')
    expect(parser).toContain("'-fingerprint', '-sha256'")
    expect(parser).toContain("'-serial'")
    expect(parser).toContain("'-dates'")
    expect(storage).toContain('fingerprint?: string')
    expect(storage).not.toContain('password: string')
    expect(storage).not.toContain('filePath: string')
  })

  it('states that BX does not sign or retain certificate secrets', () => {
    const boundary = source('../../renderer/lib/ecpProductBoundary.ts')
    const manager = source('../../renderer/pages/EcpManager.tsx')
    const diagnostic = source('../../renderer/pages/tools/EimzoDiag.tsx')
    expect(boundary).toContain('BX не подписывает документы')
    expect(boundary).toContain('Файл .pfx/.p12 и пароль не сохраняются и не отправляются')
    expect(manager).toContain('ECP_PRODUCT_BOUNDARY')
    expect(manager).not.toContain('RenewalGuide')
    expect(diagnostic).toContain('EIMZO_DIAGNOSTIC_BOUNDARY')
  })
})

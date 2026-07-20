import { dialog } from 'electron'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { extname } from 'node:path'

export interface ParsedEcpInfo {
  owner: string
  inn: string
  pinfl: string
  org: string
  serial: string
  fingerprint: string
  validFrom: string
  expiresAt: string
}

const MAX_CERTIFICATE_BYTES = 10 * 1024 * 1024
const HANDLE_TTL_MS = 2 * 60 * 1000
const PARSE_TIMEOUT_MS = 15 * 1000
const MAX_OPENSSL_OUTPUT_BYTES = 256 * 1024
const selectedFiles = new Map<string, { filePath: string; expiresAt: number }>()

export async function pickPfxFile(): Promise<string | null> {
  const now = Date.now()
  for (const [handle, selected] of selectedFiles) {
    if (selected.expiresAt < now) selectedFiles.delete(handle)
  }
  const res = await dialog.showOpenDialog({
    title: 'Выберите файл ключа ЭЦП (.pfx / .p12)',
    properties: ['openFile'],
    filters: [{ name: 'Ключ ЭЦП E-Imzo', extensions: ['pfx', 'p12'] }]
  })
  if (res.canceled || res.filePaths.length === 0) return null
  const filePath = res.filePaths[0]
  if (!['.pfx', '.p12'].includes(extname(filePath).toLowerCase())) {
    throw new Error('Разрешены только файлы .pfx и .p12.')
  }
  const fileStat = await stat(filePath)
  if (!fileStat.isFile() || fileStat.size <= 0 || fileStat.size > MAX_CERTIFICATE_BYTES) {
    throw new Error('Файл ключа пуст или превышает безопасный размер 10 МБ.')
  }
  const handle = randomUUID()
  selectedFiles.set(handle, { filePath, expiresAt: Date.now() + HANDLE_TTL_MS })
  return handle
}

function parseCertificateText(text: string): ParsedEcpInfo {
  const certificateDate = (value?: string): string => {
    if (!value) return ''
    const date = new Date(value.trim())
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
  }

  const notBeforeMatch = text.match(/(?:Not Before\s*:|^notBefore=)\s*(.+)$/mi)
  const notAfterMatch = text.match(/(?:Not After\s*:|^notAfter=)\s*(.+)$/mi)
  const serialMatch = text.match(/^serial=(.+)$/mi)
  const fingerprintMatch = text.match(/^sha256 Fingerprint\s*=\s*(.+)$/mi)
  const validFrom = certificateDate(notBeforeMatch?.[1])
  const expiresAt = certificateDate(notAfterMatch?.[1])
  const serial = serialMatch?.[1]?.trim() ?? ''
  const fingerprint = fingerprintMatch?.[1]?.replace(/:/g, '').trim().toUpperCase() ?? ''

  const subjectMatch = text.match(/Subject\s*:\s*(.+)$/m)
  let owner = ''
  let inn = ''
  let pinfl = ''
  let org = ''

  if (subjectMatch) {
    const subjectStr = subjectMatch[1]
    const pairs: { [key: string]: string } = {}
    
    // Разделяем элементы subject по запятым, которые идут перед ключами вида Key = Value
    const parts = subjectStr.split(/,\s*(?=[a-zA-Z0-9.]+ =)/)
    
    for (const part of parts) {
      const eqIdx = part.indexOf('=')
      if (eqIdx === -1) continue
      
      const key = part.slice(0, eqIdx).trim()
      let val = part.slice(eqIdx + 1).trim()
      
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1)
      }
      pairs[key] = val
    }

    owner = pairs['CN'] || pairs['cn'] || ''
    org = pairs['O'] || pairs['o'] || ''
    
    const innOrg = pairs['1.2.860.3.16.1.1'] || ''
    const pinflVal = pairs['1.2.860.3.16.1.2'] || ''
    
    inn = innOrg || pinflVal || pairs['UID'] || pairs['uid'] || ''
    pinfl = pinflVal
  }

  return { owner, inn, pinfl, org, serial, fingerprint, validFrom, expiresAt }
}

export function parsePfx(fileHandle: string, password: string): Promise<ParsedEcpInfo> {
  return new Promise((resolve, reject) => {
    if (!password) {
      reject(new Error('Введите пароль от файла ключа.'))
      return
    }

    const selected = selectedFiles.get(fileHandle)
    selectedFiles.delete(fileHandle)
    if (!selected || selected.expiresAt < Date.now()) {
      reject(new Error('Выбор файла устарел. Выберите файл повторно.'))
      return
    }
    const filePath = selected.filePath

    // Без shell: путь не интерпретируется как команда, пароль не попадает в argv
    // и передаётся openssl только через stdin. PEM существует лишь в pipe памяти.
    const pkcs12 = spawn('openssl', [
      'pkcs12', '-in', filePath, '-clcerts', '-nokeys', '-passin', 'stdin'
    ], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true })
    const x509 = spawn('openssl', ['x509', '-text', '-noout', '-dates', '-serial', '-fingerprint', '-sha256'], {
      stdio: ['pipe', 'pipe', 'ignore'],
      windowsHide: true,
    })

    let stdout = ''
    let settled = false
    const timeout = setTimeout(() => fail('Чтение файла ключа превысило 15 секунд.'), PARSE_TIMEOUT_MS)
    const finish = () => clearTimeout(timeout)
    const fail = (message = 'Не удалось прочитать файл ключа. Возможно, неверный пароль.') => {
      if (settled) return
      settled = true
      finish()
      pkcs12.kill()
      x509.kill()
      reject(new Error(message))
    }

    pkcs12.on('error', fail)
    x509.on('error', fail)
    pkcs12.stdout.pipe(x509.stdin)
    x509.stdout.setEncoding('utf8')
    x509.stdout.on('data', chunk => {
      stdout += chunk
      if (Buffer.byteLength(stdout, 'utf8') > MAX_OPENSSL_OUTPUT_BYTES) {
        fail('Ответ обработчика сертификата превышает безопасный размер.')
      }
    })
    pkcs12.on('close', code => {
      if (code !== 0) fail()
    })
    x509.on('close', code => {
      if (settled) return
      if (code !== 0) return fail()
      settled = true
      finish()
      try {
        resolve(parseCertificateText(stdout))
      } catch (error) {
        reject(error)
      }
    })

    pkcs12.stdin.end(`${password}\n`)
  })
}

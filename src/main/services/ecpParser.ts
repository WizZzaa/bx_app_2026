import { dialog } from 'electron'
import { exec } from 'node:child_process'

export interface ParsedEcpInfo {
  owner: string
  inn: string
  pinfl: string
  org: string
  expiresAt: string
}

export async function pickPfxFile(): Promise<string | null> {
  const res = await dialog.showOpenDialog({
    title: 'Выберите файл ключа ЭЦП (.pfx / .p12)',
    properties: ['openFile'],
    filters: [{ name: 'Ключ ЭЦП E-Imzo', extensions: ['pfx', 'p12'] }]
  })
  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths[0]
}

function parseCertificateText(text: string): ParsedEcpInfo {
  const notAfterMatch = text.match(/Not After\s*:\s*(.+)$/m)
  let expiresAt = ''
  if (notAfterMatch) {
    const d = new Date(notAfterMatch[1])
    if (!isNaN(d.getTime())) {
      expiresAt = d.toISOString().slice(0, 10)
    }
  }

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

  return { owner, inn, pinfl, org, expiresAt }
}

export function parsePfx(filePath: string, password: string): Promise<ParsedEcpInfo> {
  return new Promise((resolve, reject) => {
    const escapedPath = filePath.replace(/(["\s'$`\\])/g, '\\$1')
    const escapedPassword = password.replace(/(["\s'$`\\])/g, '\\$1')

    const cmd = `openssl pkcs12 -in "${escapedPath}" -clcerts -nokeys -passin "pass:${escapedPassword}" 2>/dev/null | openssl x509 -text -noout`

    exec(cmd, (error, stdout) => {
      if (error) {
        return reject(new Error('Не удалось прочитать файл ключа. Возможно, неверный пароль.'))
      }

      try {
        const info = parseCertificateText(stdout)
        return resolve(info)
      } catch (e) {
        return reject(e)
      }
    })
  })
}

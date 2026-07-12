/**
 * ecpSigner.ts — Подписание файлов (PKCS#7 / .sig) через openssl smime
 * и верификация ЭЦП-подписей. Работает в main-процессе Electron.
 */

import { dialog } from 'electron'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export interface SignResult {
  success: boolean
  sigPath?: string
  error?: string
}

export interface VerifyResult {
  success: boolean
  signer?: string
  signedAt?: string
  error?: string
}

/** Диалог выбора файла для подписания */
export async function pickFileToSign(): Promise<string | null> {
  const res = await dialog.showOpenDialog({
    title: 'Выберите файл для подписания',
    properties: ['openFile'],
    filters: [
      { name: 'Документы', extensions: ['pdf', 'docx', 'xlsx', 'xml', 'txt', 'csv'] },
      { name: 'Все файлы', extensions: ['*'] }
    ]
  })
  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths[0]
}

/** Диалог выбора файла подписи для проверки */
export async function pickSigFile(): Promise<string | null> {
  const res = await dialog.showOpenDialog({
    title: 'Выберите файл подписи (.sig / .p7s / .p7m)',
    properties: ['openFile'],
    filters: [
      { name: 'Файл подписи', extensions: ['sig', 'p7s', 'p7m', 'p7b'] },
      { name: 'Все файлы', extensions: ['*'] }
    ]
  })
  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths[0]
}

/**
 * Подписать файл через openssl smime (detached PKCS#7).
 * pfxPath — путь к .pfx / .p12 файлу
 * password — пароль к ключу
 * filePath — файл для подписания
 */
export async function signFile(pfxPath: string, password: string, filePath: string): Promise<SignResult> {
  const tmpDir = os.tmpdir()
  const certPem = path.join(tmpDir, `bx_cert_${Date.now()}.pem`)
  const keyPem  = path.join(tmpDir, `bx_key_${Date.now()}.pem`)
  const sigPath = `${filePath}.sig`

  const escPfx  = JSON.stringify(pfxPath)
  const escPass = JSON.stringify(password)
  const escFile = JSON.stringify(filePath)
  const escCert = JSON.stringify(certPem)
  const escKey  = JSON.stringify(keyPem)
  const escSig  = JSON.stringify(sigPath)

  const extractCmd = [
    // Извлекаем сертификат
    `openssl pkcs12 -in ${escPfx} -clcerts -nokeys -passin pass:${escPass} -out ${escCert} 2>/dev/null`,
    // Извлекаем приватный ключ
    `openssl pkcs12 -in ${escPfx} -nocerts -nodes -passin pass:${escPass} -out ${escKey} 2>/dev/null`
  ].join(' && ')

  return new Promise(resolve => {
    exec(extractCmd, (err) => {
      if (err) {
        cleanup([certPem, keyPem])
        return resolve({ success: false, error: 'Не удалось извлечь ключ из .pfx файла. Проверьте пароль.' })
      }

      // Подписываем файл (detached PKCS#7)
      const signCmd = `openssl smime -sign -binary -in ${escFile} -signer ${escCert} -inkey ${escKey} -outform DER -out ${escSig} 2>/dev/null`

      exec(signCmd, (signErr) => {
        cleanup([certPem, keyPem])
        if (signErr) {
          return resolve({ success: false, error: 'Ошибка создания подписи. Возможно, ключ недействителен.' })
        }
        resolve({ success: true, sigPath })
      })
    })
  })
}

/**
 * Верифицировать detached-подпись .sig для файла.
 */
export async function verifySig(filePath: string, sigPath: string): Promise<VerifyResult> {
  const escFile = JSON.stringify(filePath)
  const escSig  = JSON.stringify(sigPath)

  // Сначала извлекаем информацию о подписанте из .sig файла
  const infoCmd = `openssl smime -pk7out -inform DER -in ${escSig} 2>/dev/null | openssl pkcs7 -text -noout -print_certs 2>/dev/null`

  return new Promise(resolve => {
    exec(infoCmd, (_err, infoOut) => {
      const signerInfo = parseCertInfo(infoOut || '')

      // Проверяем подпись без цепочки CA (нет хранилища CA РУз)
      const verifyCmd = `openssl smime -verify -binary -inform DER -in ${escSig} -content ${escFile} -noverify 2>&1`
      exec(verifyCmd, (verErr, out, stderr) => {
        const combined = (out + stderr).toLowerCase()
        if (combined.includes('verification successful') || combined.includes('verification ok') || !verErr) {
          return resolve({
            success: true,
            signer: signerInfo.cn || 'Неизвестен',
            signedAt: signerInfo.notBefore,
          })
        }
        resolve({
          success: false,
          error: `Подпись не прошла проверку. ${(out + stderr).slice(0, 200)}`,
        })
      })
    })
  })
}

function parseCertInfo(text: string): { cn?: string; notBefore?: string } {
  const cnMatch = text.match(/CN\s*=\s*([^\n,/]+)/i)
  const dateMatch = text.match(/Not Before\s*:\s*(.+)$/im)
  return {
    cn: cnMatch?.[1]?.trim(),
    notBefore: dateMatch ? new Date(dateMatch[1]).toISOString().slice(0, 10) : undefined,
  }
}

function cleanup(files: string[]) {
  for (const f of files) {
    try { fs.unlinkSync(f) } catch { /* файл мог быть уже удалён */ }
  }
}

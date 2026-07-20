import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { dialog } from 'electron'
import type { DeepCheckResult, RestorePreflightCheck } from '../../shared/types'
import { hashFile, verifyExactCopy } from './onecBackup'
import { listProcesses } from './onecProcess'

const DESIGNER_TIMEOUT_MS = 35 * 60 * 1000
const MAX_OUTPUT_BYTES = 1024 * 1024
const MAX_LOG_EXCERPT = 6000

function portableBasename(value: string): string {
  return value.replace(/\\/g, '/').split('/').pop() || ''
}

export async function pickOnecExecutable(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: 'Выберите 1cv8.exe платформы 1С',
    properties: ['openFile'],
    filters: [{ name: '1С:Предприятие', extensions: ['exe'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

export function validateDeepCheckSelection(sourceBackup: string, onecExecutable: string, workingDatabase: string): string | null {
  if (path.extname(sourceBackup).toLowerCase() !== '.1cd') return 'Для проверки выберите резервную копию .1CD'
  if (portableBasename(onecExecutable).toLowerCase() !== '1cv8.exe') return 'Выберите исполняемый файл 1cv8.exe'
  if (path.extname(workingDatabase).toLowerCase() !== '.1cd') return 'Рабочая база должна быть файлом .1CD'
  const normalize = (value: string) => {
    const resolved = path.resolve(value)
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved
  }
  if (normalize(sourceBackup) === normalize(workingDatabase)) return 'Рабочую базу нельзя использовать как резервную копию для теста'
  return null
}

export function buildDeepCheckArgs(tempBaseDir: string, logPath: string, resultPath: string): string[] {
  return [
    'DESIGNER',
    '/F', tempBaseDir,
    '/DisableStartupMessages',
    '/DisableStartupDialogs',
    '/IBCheckAndRepair',
    '-LogAndRefsIntegrity',
    '-TestOnly',
    '-TimeLimit:000:30',
    '/Out', logPath,
    '/DumpResult', resultPath,
  ]
}

function runDesigner(executable: string, args: string[]): Promise<{ error: Error | null; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    execFile(executable, args, {
      windowsHide: true,
      timeout: DESIGNER_TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: 'utf8',
    }, (error, stdout, stderr) => resolve({ error, stdout: stdout || '', stderr: stderr || '' }))
  })
}

function excerpt(value: string): string | undefined {
  const clean = value.replaceAll('\u0000', '').trim()
  if (!clean) return undefined
  return clean.length <= MAX_LOG_EXCERPT ? clean : `…${clean.slice(-MAX_LOG_EXCERPT)}`
}

async function sameRealPath(left: string, right: string): Promise<boolean> {
  const [realLeft, realRight] = await Promise.all([
    fs.promises.realpath(left).catch(() => path.resolve(left)),
    fs.promises.realpath(right).catch(() => path.resolve(right)),
  ])
  const normalize = (value: string) => process.platform === 'win32' ? value.toLowerCase() : value
  return normalize(realLeft) === normalize(realRight)
}

export async function deepCheckBackup(sourceBackup: string, onecExecutable: string, workingDatabase: string): Promise<DeepCheckResult> {
  const startedAt = Date.now()
  const checks: RestorePreflightCheck[] = []
  const add = (id: string, label: string, ok: boolean, message: string) => checks.push({ id, label, ok, message })
  const finish = (success: boolean, error?: string, logExcerpt?: string): DeepCheckResult => ({
    success,
    checks,
    durationMs: Date.now() - startedAt,
    logExcerpt,
    error,
  })

  if (process.platform !== 'win32') {
    add('platform', 'Платформа', false, 'Глубокая проверка через 1С Designer доступна только в Windows-приложении BX')
    return finish(false, 'Текущая операционная система не поддерживается')
  }

  const selectionError = validateDeepCheckSelection(sourceBackup, onecExecutable, workingDatabase)
  const [sourceStat, executableStat, workingStat] = await Promise.all([
    fs.promises.stat(sourceBackup).catch(() => null),
    fs.promises.stat(onecExecutable).catch(() => null),
    fs.promises.stat(workingDatabase).catch(() => null),
  ])
  const sameAsWorking = await sameRealPath(sourceBackup, workingDatabase)
  add('selection', 'Изолированный источник', !selectionError && !sameAsWorking, selectionError ?? (sameAsWorking ? 'Выбранный файл совпадает с рабочей базой' : 'Выбрана отдельная резервная копия .1CD'))
  add('source', 'Резервная копия', Boolean(sourceStat?.isFile() && sourceStat.size > 0), sourceStat?.isFile() ? `${sourceStat.size} байт, доступна для чтения` : 'Файл копии не найден')
  add('working', 'Рабочая база защищена', Boolean(workingStat?.isFile() && !sameAsWorking), workingStat?.isFile() && !sameAsWorking ? 'Рабочий файл отличается и не будет передан процессу 1С' : 'Рабочая база не найдена или совпадает с источником')
  add('executable', '1С Designer', Boolean(executableStat?.isFile() && portableBasename(onecExecutable).toLowerCase() === '1cv8.exe'), executableStat?.isFile() ? 'Исполняемый файл 1cv8.exe доступен' : 'Исполняемый файл не найден')
  const processes = await listProcesses().catch(() => null)
  add('processes', 'Процессы 1С закрыты', processes?.length === 0, processes === null ? 'Не удалось проверить процессы 1С' : processes.length ? `Закройте: ${processes.map(item => item.name).join(', ')}` : 'Активные процессы 1С не найдены')
  const tempSpace = await fs.promises.statfs(os.tmpdir()).catch(() => null)
  const available = tempSpace ? tempSpace.bavail * tempSpace.bsize : 0
  const required = Math.ceil((sourceStat?.size ?? 0) * 1.1)
  add('space', 'Место для временной копии', available >= required, `Нужно ${required} байт, доступно ${available} байт`)
  if (checks.some(check => !check.ok)) return finish(false, 'Preflight не пройден. 1С не запускалась, файлы не изменены.')

  let tempDir = ''
  let outcome: DeepCheckResult
  try {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bx-onec-check-'))
    const stagedDatabase = path.join(tempDir, '1Cv8.1CD')
    const logPath = path.join(tempDir, 'designer.log')
    const resultPath = path.join(tempDir, 'designer.result')
    const sourceHashBefore = await hashFile(sourceBackup)
    await fs.promises.copyFile(sourceBackup, stagedDatabase, fs.constants.COPYFILE_EXCL)
    await verifyExactCopy(sourceBackup, stagedDatabase)
    const stagedHashBefore = await hashFile(stagedDatabase)
    add('staging', 'Временная копия', true, 'Размер и SHA-256 совпадают; Designer получит только временный файл')

    const finalProcesses = await listProcesses().catch(() => null)
    const readyToLaunch = finalProcesses?.length === 0
    add('processes-final', 'Повторная проверка процессов', readyToLaunch, finalProcesses === null ? 'Не удалось повторно проверить процессы 1С' : finalProcesses.length ? `Перед запуском обнаружены: ${finalProcesses.map(item => item.name).join(', ')}` : 'Непосредственно перед запуском активные процессы 1С не найдены')
    if (!readyToLaunch) throw new Error('Процессы 1С должны оставаться закрыты до запуска безопасного теста')

    const processResult = await runDesigner(onecExecutable, buildDeepCheckArgs(tempDir, logPath, resultPath))
    const [resultText, logText] = await Promise.all([
      fs.promises.readFile(resultPath, 'utf8').catch(() => ''),
      fs.promises.readFile(logPath, 'utf8').catch(() => ''),
    ])
    const resultCode = Number.parseInt(resultText.trim(), 10)
    const output = excerpt(logText || processResult.stderr || processResult.stdout)
    const commandOk = !processResult.error && resultCode === 0
    add('designer', 'Тест 1С Designer', commandOk, commandOk ? 'Проверка логической и ссылочной целостности завершена с кодом 0' : `Designer завершился с ошибкой${Number.isFinite(resultCode) ? `, код ${resultCode}` : ''}. Пароли не передавались.`)

    const [sourceHashAfter, stagedHashAfter] = await Promise.all([hashFile(sourceBackup), hashFile(stagedDatabase)])
    const immutable = sourceHashAfter === sourceHashBefore && stagedHashAfter === stagedHashBefore
    add('immutable', 'Файлы не изменены', immutable, immutable ? 'SHA-256 исходной и временной копий не изменился после -TestOnly' : 'После проверки изменилась контрольная сумма; результат отклонён')
    outcome = finish(commandOk && immutable, commandOk && immutable ? undefined : processResult.error?.message || 'Глубокая проверка не пройдена', output)
  } catch (error) {
    outcome = finish(false, (error as Error).message)
  }

  try {
    if (tempDir) await fs.promises.rm(tempDir, { recursive: true, force: true })
    add('cleanup', 'Временные данные удалены', true, 'Изолированная копия и технический журнал удалены')
  } catch (error) {
    add('cleanup', 'Временные данные удалены', false, `Не удалось удалить ${tempDir}: ${(error as Error).message}`)
    outcome.success = false
    outcome.error = outcome.error || 'Не удалось удалить временные данные проверки'
  }
  outcome.durationMs = Date.now() - startedAt
  return outcome
}

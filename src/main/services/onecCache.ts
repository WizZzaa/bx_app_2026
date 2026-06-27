import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { CacheScanResult, CacheEntry, CleanResult } from '../../shared/types'

const getCacheRoots = () => {
  const home = os.homedir()
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local')
    const roaming = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
    return [
      { root: path.join(local, '1C', '1cv8'), label: 'Локальный кэш (Local)' },
      { root: path.join(roaming, '1C', '1cv8'), label: 'Роуминг кэш (Roaming)' }
    ]
  }
  if (process.platform === 'darwin') {
    return [
      { root: path.join(home, 'Library', 'Application Support', '1C', '1cv8'), label: 'AppSupport кэш' },
      { root: path.join(home, 'Library', 'Caches', '1C', '1cv8'), label: 'Caches кэш' }
    ]
  }
  return []
}

const getV8iPath = () => {
  const home = os.homedir()
  if (process.platform === 'win32') {
    const roaming = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
    return path.join(roaming, '1C', '1CEStart', 'ibases.v8i')
  }
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', '1C', '1CEStart', 'ibases.v8i')
  }
  return ''
}

const parseV8i = (filePath: string) => {
  const dbMap = new Map<string, string>()
  if (!fs.existsSync(filePath)) {
    return dbMap
  }

  try {
    const buffer = fs.readFileSync(filePath)
    let content = ''

    // Определение кодировки по BOM
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
      content = buffer.toString('utf16le')
    } else if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      content = buffer.toString('utf8')
    } else {
      content = buffer.toString('utf8')
    }

    const lines = content.split(/\r?\n/)
    let currentName = ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentName = trimmed.slice(1, -1)
        continue
      }
      if (trimmed.startsWith('ID=')) {
        const id = trimmed.substring(3).trim().toLowerCase()
        if (id && currentName) {
          dbMap.set(id, currentName)
        }
      }
    }
  } catch (err) {
    console.error('Ошибка парсинга .v8i:', err)
  }
  return dbMap
}

const dirSize = (dir: string): number => {
  let total = 0
  let items: fs.Dirent[]
  try {
    items = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return 0
  }
  for (const item of items) {
    const full = path.join(dir, item.name)
    try {
      if (item.isDirectory()) {
        total += dirSize(full)
      } else if (item.isFile()) {
        total += fs.statSync(full).size
      }
    } catch {
      // игнорируем недоступные элементы
    }
  }
  return total
}

export const scanCache = (): CacheScanResult => {
  const roots = getCacheRoots()
  const isSupported = process.platform === 'win32' || process.platform === 'darwin'
  if (!isSupported || roots.length === 0) {
    return { entries: [], totalBytes: 0, platformSupported: false }
  }

  const v8iPath = getV8iPath()
  const dbMap = parseV8i(v8iPath)
  const entries: CacheEntry[] = []

  for (const { root, label } of roots) {
    if (!fs.existsSync(root)) {
      continue
    }
    let subdirs: fs.Dirent[]
    try {
      subdirs = fs.readdirSync(root, { withFileTypes: true })
    } catch {
      continue
    }

    for (const sub of subdirs) {
      if (!sub.isDirectory()) {
        continue
      }
      // Игнорируем системные папки 1С, которые не являются GUID-кэшем
      // Папки кэша имеют длину от 32 до 36 символов (включая дефисы)
      const isCacheDir = /^[0-9a-fA-F-]{32,36}$/.test(sub.name)
      if (!isCacheDir) {
        continue
      }

      const full = path.join(root, sub.name)
      const size = dirSize(full)

      // Сопоставляем UUID с именем базы
      const cleanSubName = sub.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      let baseName = ''
      for (const [id, name] of dbMap.entries()) {
        const cleanId = id.replace(/[^a-z0-9]/g, '')
        if (cleanSubName === cleanId) {
          baseName = name
          break
        }
      }

      const displayLabel = baseName 
        ? `${baseName} (${label})`
        : `Архивный кэш (${sub.name.substring(0, 8)}... - ${label})`

      entries.push({ path: full, sizeBytes: size, label: displayLabel })
    }
  }

  const totalBytes = entries.reduce((acc, e) => acc + e.sizeBytes, 0)
  return { entries, totalBytes, platformSupported: true }
}

export const cleanCache = (paths: string[]): CleanResult => {
  const deletedPaths: string[] = []
  const failedPaths: { path: string; error: string }[] = []
  let freedBytes = 0

  const roots = getCacheRoots().map(r => r.root)

  for (const target of paths) {
    const isSafe = roots.some(root => target.startsWith(root))
    if (!isSafe) {
      failedPaths.push({ path: target, error: 'Путь вне разрешённой папки кэша 1С' })
      continue
    }
    try {
      const size = dirSize(target)
      fs.rmSync(target, { recursive: true, force: true })
      deletedPaths.push(target)
      freedBytes += size
    } catch (e) {
      failedPaths.push({ path: target, error: (e as Error).message })
    }
  }

  return { deletedPaths, failedPaths, freedBytes }
}


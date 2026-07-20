import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { backupDatabase, restoreDatabase, validateBackupSelection, validateRestoreSelection, verifyExactCopy } from './onecBackup'
import {
  appendBackupHistory,
  mergeSchedulerDatabaseChanges,
  mergeUserBackupConfigChanges,
  normalizeBackupConfig,
  scheduledSlots,
  type BackupDatabaseConfig,
  type BackupScheduleConfig,
} from './onecBackupScheduler'

vi.mock('./onecProcess', () => ({ listProcesses: vi.fn().mockResolvedValue([]) }))

describe('validateBackupSelection', () => {
  it('accepts only 1CD and keeps backups outside the live base directory', () => {
    expect(validateBackupSelection('/bases/main/1Cv8.1CD', '/backups')).toBeNull()
    expect(validateBackupSelection('/bases/main/data.zip', '/backups')).toContain('.1CD')
    expect(validateBackupSelection('/bases/main/1Cv8.1CD', path.dirname('/bases/main/1Cv8.1CD'))).toContain('должна отличаться')
  })
})

describe('validateRestoreSelection', () => {
  it('requires two distinct 1CD files', () => {
    expect(validateRestoreSelection('/backups/good.1CD', '/bases/main/1Cv8.1CD')).toBeNull()
    expect(validateRestoreSelection('/backups/good.zip', '/bases/main/1Cv8.1CD')).toContain('.1CD')
    expect(validateRestoreSelection('/bases/main/1Cv8.1CD', '/bases/main/1Cv8.1CD')).toContain('сам в себя')
  })

  it('replaces only a synthetic target after preserving an exact safety copy', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bx-restore-test-'))
    const source = path.join(tempDir, 'backup.1CD')
    const target = path.join(tempDir, '1Cv8.1CD')
    try {
      await fs.promises.writeFile(source, Buffer.from('restored synthetic database'))
      await fs.promises.writeFile(target, Buffer.from('original synthetic database'))
      const result = await restoreDatabase(source, target)
      expect(result.success).toBe(true)
      expect(await fs.promises.readFile(target, 'utf8')).toBe('restored synthetic database')
      expect(result.safetyCopyPath).toBeTruthy()
      if (!result.safetyCopyPath) throw new Error('Не создана страховочная копия')
      expect(await fs.promises.readFile(result.safetyCopyPath, 'utf8')).toBe('original synthetic database')
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    }
  })
})

describe('verifyExactCopy', () => {
  it('rejects same-sized files when only the middle of the copy is corrupted', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bx-backup-integrity-test-'))
    const source = path.join(tempDir, 'source.1CD')
    const copied = path.join(tempDir, 'copy.1CD')
    const content = Buffer.alloc(16 * 1024, 0x41)
    try {
      await fs.promises.writeFile(source, content)
      await fs.promises.writeFile(copied, content)
      const handle = await fs.promises.open(copied, 'r+')
      try {
        await handle.write(Buffer.from([0x42]), 0, 1, content.length / 2)
      } finally {
        await handle.close()
      }

      await expect(verifyExactCopy(source, copied)).rejects.toThrow('Контрольная сумма')
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('makes the regular backup fail when the middle is corrupted during copying', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bx-backup-flow-test-'))
    const sourceDir = path.join(tempDir, 'base')
    const destDir = path.join(tempDir, 'backups')
    const source = path.join(sourceDir, '1Cv8.1CD')
    await Promise.all([
      fs.promises.mkdir(sourceDir),
      fs.promises.mkdir(destDir),
    ])
    await fs.promises.writeFile(source, Buffer.alloc(16 * 1024, 0x41))
    const copyFile = fs.promises.copyFile.bind(fs.promises)
    const copySpy = vi.spyOn(fs.promises, 'copyFile').mockImplementationOnce(async (src, dest, mode) => {
      await copyFile(src, dest, mode)
      const handle = await fs.promises.open(dest, 'r+')
      try {
        await handle.write(Buffer.from([0x42]), 0, 1, 8 * 1024)
      } finally {
        await handle.close()
      }
    })
    try {
      const result = await backupDatabase(source, destDir)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Контрольная сумма')
      expect(await fs.promises.readdir(destDir)).toEqual([])
    } finally {
      copySpy.mockRestore()
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    }
  })
})

describe('appendBackupHistory', () => {
  it('keeps the newest 50 technical events', () => {
    let database: BackupDatabaseConfig = { id: 'base-1', name: 'Бухгалтерия', enabled: true, sourceFile: 'a.1CD', destDir: '/tmp', scheduleTime: '20:00' }
    for (let index = 0; index < 55; index += 1) database = appendBackupHistory(database, { id: String(index), createdAt: String(index), status: 'success', message: 'ok' })
    expect(database.history).toHaveLength(50)
    expect(database.history?.[0].id).toBe('54')
  })
})

describe('mergeSchedulerDatabaseChanges', () => {
  it('merges scheduler results by id without overwriting concurrent UI changes', () => {
    const before: BackupDatabaseConfig = {
      id: 'base-1', name: 'Бухгалтерия', enabled: true, sourceFile: 'a.1CD', destDir: '/backups', scheduleTime: '20:00',
      missedAt: '2026-07-20T10:00:00.000Z', reminderAt: '2026-07-20T12:00:00.000Z', history: [],
    }
    const after = appendBackupHistory({
      ...before,
      lastBackupTime: '2026-07-20T12:05:00.000Z',
      missedAt: undefined,
      reminderAt: undefined,
    }, {
      id: 'scheduler-entry', createdAt: '2026-07-20T12:05:00.000Z', status: 'success', message: 'Автоматическая копия',
    })
    const concurrent: BackupScheduleConfig = {
      version: 2,
      databaseLimit: 1,
      databases: [{
        ...before,
        name: 'Новая бухгалтерия',
        enabled: false,
        scheduleTime: '21:30',
        reminderAt: '2026-07-20T14:00:00.000Z',
      }],
    }

    const merged = mergeSchedulerDatabaseChanges(concurrent, before, after)

    expect(merged.databases[0]).toMatchObject({
      name: 'Новая бухгалтерия',
      enabled: false,
      scheduleTime: '21:30',
      lastBackupTime: '2026-07-20T12:05:00.000Z',
      reminderAt: '2026-07-20T14:00:00.000Z',
    })
    expect(merged.databases[0].missedAt).toBeUndefined()
    expect(merged.databases[0].history?.map(entry => entry.id)).toEqual(['scheduler-entry'])
  })

  it('does not attach a completed copy to a database whose paths changed concurrently', () => {
    const before: BackupDatabaseConfig = {
      id: 'base-1', name: 'База', enabled: true, sourceFile: 'old.1CD', destDir: '/old', scheduleTime: '20:00', history: [],
    }
    const after = appendBackupHistory({ ...before, lastBackupTime: '2026-07-20T12:05:00.000Z' }, {
      id: 'old-copy', createdAt: '2026-07-20T12:05:00.000Z', status: 'success', message: 'Автоматическая копия',
    })
    const concurrent: BackupScheduleConfig = {
      version: 2,
      databaseLimit: 1,
      databases: [{ ...before, sourceFile: 'new.1CD', destDir: '/new' }],
    }

    expect(mergeSchedulerDatabaseChanges(concurrent, before, after)).toBe(concurrent)
  })

  it('preserves scheduler data when a stale UI write is serialized after it', () => {
    const baseDatabase: BackupDatabaseConfig = {
      id: 'base-1', name: 'База', enabled: true, sourceFile: 'base.1CD', destDir: '/backups', scheduleTime: '20:00', history: [],
    }
    const base: BackupScheduleConfig = { version: 2, databaseLimit: 1, databases: [baseDatabase] }
    const schedulerCurrent: BackupScheduleConfig = {
      ...base,
      databases: [appendBackupHistory({ ...baseDatabase, lastBackupTime: '2026-07-20T12:05:00.000Z' }, {
        id: 'scheduler-copy', createdAt: '2026-07-20T12:05:00.000Z', status: 'success', message: 'Автоматическая копия',
      })],
    }
    const staleUserRequest: BackupScheduleConfig = {
      ...base,
      databases: [{ ...baseDatabase, name: 'Главная база', scheduleTime: '21:30' }],
    }

    const merged = mergeUserBackupConfigChanges(schedulerCurrent, base, staleUserRequest)

    expect(merged.databases[0]).toMatchObject({
      name: 'Главная база',
      scheduleTime: '21:30',
      lastBackupTime: '2026-07-20T12:05:00.000Z',
    })
    expect(merged.databases[0].history?.map(entry => entry.id)).toEqual(['scheduler-copy'])
  })
})

describe('normalizeBackupConfig', () => {
  it('migrates the existing single-base config without losing its schedule or history', () => {
    const migrated = normalizeBackupConfig({
      enabled: true,
      sourceFile: 'C:\\Bases\\Accounting\\1Cv8.1CD',
      destDir: 'D:\\Backups',
      scheduleTime: '21:30',
      lastBackupTime: '2026-07-18T16:30:00.000Z',
      history: [{ id: 'old', createdAt: '2026-07-18T16:30:00.000Z', status: 'success', message: 'Сохранено' }],
    })
    expect(migrated.version).toBe(2)
    expect(migrated.databases).toHaveLength(1)
    expect(migrated.databases[0]).toMatchObject({
      name: 'Accounting', enabled: true, sourceFile: 'C:\\Bases\\Accounting\\1Cv8.1CD', destDir: 'D:\\Backups', scheduleTime: '21:30',
    })
    expect(migrated.databases[0].history?.[0].id).toBe('old')
  })

  it('does not invent a database from an empty legacy config', () => {
    expect(normalizeBackupConfig({ enabled: false, sourceFile: '', destDir: '', intervalHours: 24 }).databases).toEqual([])
  })

  it('preserves multiple versioned records and clamps the executable entitlement', () => {
    const normalized = normalizeBackupConfig({
      version: 2,
      databaseLimit: 99,
      databases: [
        { id: 'one', name: 'Первая', enabled: true, sourceFile: 'one.1CD', destDir: '/one', scheduleTime: '19:00' },
        { id: 'two', name: 'Вторая', enabled: false, sourceFile: 'two.1CD', destDir: '/two', scheduleTime: 'bad' },
      ],
    })
    expect(normalized.databaseLimit).toBe(5)
    expect(normalized.databases.map(item => item.id)).toEqual(['one', 'two'])
    expect(normalized.databases[1].scheduleTime).toBe('20:00')
  })
})

describe('scheduledSlots', () => {
  it('combines coincident daily, weekly and monthly slots into one run', () => {
    expect(scheduledSlots(new Date(2026, 1, 1, 20, 5))).toEqual(['daily', 'weekly', 'monthly'])
    expect(scheduledSlots(new Date(2026, 1, 2, 20, 5))).toEqual(['daily'])
    expect(scheduledSlots(new Date(2026, 1, 2, 20, 15))).toEqual([])
  })
})

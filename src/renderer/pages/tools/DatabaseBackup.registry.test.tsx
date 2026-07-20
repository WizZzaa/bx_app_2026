import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DatabaseBackup from './DatabaseBackup'

const mocks = vi.hoisted(() => ({
  plan: 'standard' as 'free' | 'trial' | 'standard' | 'premium',
  getBackupConfig: vi.fn(),
  saveBackupConfig: vi.fn(),
}))

vi.mock('../../lib/plan', () => ({
  usePlan: () => ({ plan: mocks.plan, loading: false }),
}))

vi.mock('../../lib/onecApi', () => ({
  formatBytes: (bytes: number) => `${bytes} Б`,
  onecApi: {
    getBackupConfig: mocks.getBackupConfig,
    saveBackupConfig: mocks.saveBackupConfig,
    pickDatabaseFile: vi.fn(),
    pickBackupDir: vi.fn(),
    backupDatabase: vi.fn(),
    restoreDatabase: vi.fn(),
    pickOnecExecutable: vi.fn(),
    deepCheckBackup: vi.fn(),
  },
}))

beforeEach(() => {
  mocks.plan = 'standard'
  mocks.getBackupConfig.mockReset().mockResolvedValue({ version: 2, databaseLimit: 1, databases: [] })
  mocks.saveBackupConfig.mockReset().mockResolvedValue(undefined)
})

afterEach(cleanup)

describe('DatabaseBackup registry', () => {
  it('adds one local database record on Standard without starting a backup', async () => {
    render(<MemoryRouter><DatabaseBackup /></MemoryRouter>)
    const heading = await screen.findByText('Подключённые базы')
    expect(heading.parentElement?.textContent).toContain('0 из 1')
    fireEvent.click(screen.getByRole('button', { name: 'Добавить базу' }))
    expect(await screen.findByText('База 1С 1')).toBeTruthy()
    await waitFor(() => expect(mocks.saveBackupConfig).toHaveBeenCalledWith(expect.objectContaining({
      version: 2,
      databaseLimit: 1,
      databases: [expect.objectContaining({ name: 'База 1С 1', enabled: false })],
    }), expect.any(Object)))
  })

  it('pauses an existing record without losing the enabled intent when the plan has no 1C entitlement', async () => {
    mocks.plan = 'free'
    mocks.getBackupConfig.mockResolvedValue({
      version: 2,
      databaseLimit: 1,
      databases: [{ id: 'legacy', name: 'Бухгалтерия', enabled: true, sourceFile: 'C:/Base/1Cv8.1CD', destDir: 'D:/Backup', scheduleTime: '20:00', history: [] }],
    })
    render(<MemoryRouter><DatabaseBackup /></MemoryRouter>)
    expect(await screen.findByText('Бухгалтерия')).toBeTruthy()
    expect(screen.getByText('Вне текущего тарифа')).toBeTruthy()
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false)
    await waitFor(() => expect(mocks.saveBackupConfig).toHaveBeenCalledWith(expect.objectContaining({
      databaseLimit: 0,
      databases: [expect.objectContaining({ id: 'legacy', enabled: true })],
    }), expect.any(Object)))
  })

  it('restores the enabled schedule at runtime after entitlement returns', async () => {
    mocks.getBackupConfig.mockResolvedValue({
      version: 2,
      databaseLimit: 0,
      databases: [{ id: 'saved', name: 'Бухгалтерия', enabled: true, sourceFile: 'C:/Base/1Cv8.1CD', destDir: 'D:/Backup', scheduleTime: '20:00', history: [] }],
    })
    render(<MemoryRouter><DatabaseBackup /></MemoryRouter>)
    expect(await screen.findByText('Бухгалтерия')).toBeTruthy()
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
    await waitFor(() => expect(mocks.saveBackupConfig).toHaveBeenCalledWith(expect.objectContaining({
      databaseLimit: 1,
      databases: [expect.objectContaining({ id: 'saved', enabled: true })],
    }), expect.any(Object)))
  })

  it('shows the isolated test-only flow for an entitled database', async () => {
    mocks.getBackupConfig.mockResolvedValue({
      version: 2,
      databaseLimit: 1,
      databases: [{ id: 'base', name: 'Бухгалтерия', enabled: false, sourceFile: 'C:/Base/1Cv8.1CD', destDir: 'D:/Backup', scheduleTime: '20:00', onecExecutablePath: 'C:/1C/1cv8.exe', history: [] }],
    })
    render(<MemoryRouter><DatabaseBackup /></MemoryRouter>)
    fireEvent.click(await screen.findByText('Глубокая проверка копии'))
    expect(screen.getByText(/во временный каталог/i)).toBeTruthy()
    expect(screen.getByText(/не запрашивает, не сохраняет и не передаёт/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Запустить безопасный тест' }).hasAttribute('disabled')).toBe(true)
  })
})

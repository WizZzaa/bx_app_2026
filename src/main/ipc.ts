import { ipcMain, safeStorage, BrowserWindow, dialog, Notification } from 'electron'
import * as fs from 'fs'
import { IPC } from '../shared/ipc-channels'
import { scanCache, cleanCache } from './services/onecCache';
import { listProcesses, killProcesses } from './services/onecProcess';
import { pickDatabaseFile, pickBackupDir, backupDatabase } from './services/onecBackup';
import { fetchWeather } from './services/weather';
import { fetchRates, fetchRateOnDate } from './services/currency';
import { scanPcTemp, cleanPcTemp, checkRunningBrowsers } from './services/pcClean'
import { pickPfxFile, parsePfx } from './services/ecpParser'
import { signFile, verifySig, pickFileToSign, pickSigFile } from './services/ecpSigner'
import { readBackupConfig, writeBackupConfig } from './services/onecBackupScheduler'

export function registerIpcHandlers() {
  // --- Cache ---
  ipcMain.handle(IPC.CACHE_SCAN, () => scanCache())
  ipcMain.handle(IPC.CACHE_CLEAN, (_e, paths: string[]) => cleanCache(paths))

  // --- Processes ---
  ipcMain.handle(IPC.PROC_LIST, () => listProcesses())
  ipcMain.handle(IPC.PROC_KILL, (_e, pids: number[]) => killProcesses(pids))

  // --- Backup ---
  ipcMain.handle(IPC.BACKUP_PICK_DB, () => pickDatabaseFile())
  ipcMain.handle(IPC.BACKUP_PICK_DIR, () => pickBackupDir())
  ipcMain.handle(IPC.BACKUP_RUN, (_e, src: string, dest: string) => backupDatabase(src, dest))
  ipcMain.handle(IPC.BACKUP_GET_CONFIG, () => readBackupConfig())
  ipcMain.handle(IPC.BACKUP_SAVE_CONFIG, (_e, config: any) => writeBackupConfig(config))

  // --- Widgets ---
  ipcMain.handle(IPC.WEATHER_GET, () => fetchWeather())
  ipcMain.handle(IPC.CURRENCY_GET, (_e, codes?: string[]) => fetchRates(codes))
  ipcMain.handle(IPC.CURRENCY_ON_DATE, (_e, code: string, date: string) => fetchRateOnDate(code, date))

  // --- PC Cleaner ---
  ipcMain.handle(IPC.PC_SCAN, () => scanPcTemp())
  ipcMain.handle(IPC.PC_CLEAN, (_e, ids: string[]) => cleanPcTemp(ids))
  ipcMain.handle(IPC.PC_CHECK_BROWSERS, (_e, ids: string[]) => checkRunningBrowsers(ids))

  // --- ECP / E-Imzo ---
  ipcMain.handle(IPC.ECP_PICK_PFX, () => pickPfxFile())
  ipcMain.handle(IPC.ECP_PARSE_PFX, (_e, filePath: string, password: string) => parsePfx(filePath, password))
  ipcMain.handle(IPC.ECP_PICK_FILE_TO_SIGN, () => pickFileToSign())
  ipcMain.handle(IPC.ECP_PICK_SIG_FILE, () => pickSigFile())
  ipcMain.handle(IPC.ECP_SIGN_FILE, (_e, pfxPath: string, password: string, filePath: string) => signFile(pfxPath, password, filePath))
  ipcMain.handle(IPC.ECP_VERIFY_SIG, (_e, filePath: string, sigPath: string) => verifySig(filePath, sigPath))

  // --- safeStorage ---
  ipcMain.handle(IPC.SAFE_AVAILABLE, () => safeStorage.isEncryptionAvailable())
  ipcMain.handle(IPC.SAFE_ENCRYPT, (_e, plainText: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available')
    }
    return safeStorage.encryptString(plainText).toString('hex')
  })
  ipcMain.handle(IPC.SAFE_DECRYPT, (_e, encryptedHex: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available')
    }
    const buffer = Buffer.from(encryptedHex, 'hex')
    return safeStorage.decryptString(buffer)
  })

  // --- PDF Generator ---
  ipcMain.handle(IPC.PDF_GENERATE, async (_e, htmlContent: string, fileName: string) => {
    const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } })
    try {
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
      const data = await win.webContents.printToPDF({
        printBackground: true,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        pageSize: 'A4'
      })
      const { filePath } = await dialog.showSaveDialog({
        title: 'Сохранить документ в PDF',
        defaultPath: fileName,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      })
      if (filePath) {
        await fs.promises.writeFile(filePath, data)
        return true
      }
      return false
    } catch (err) {
      console.error('[PDF_GENERATE] Ошибка:', err)
      throw err
    } finally {
      win.destroy()
    }
  })

  // --- Notifications ---
  ipcMain.handle(IPC.NOTIFY_SHOW, (_e, title: string, body: string) => {
    new Notification({ title, body }).show()
  })
}


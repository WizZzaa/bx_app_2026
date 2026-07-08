// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './shared/ipc-channels';
import type {
  CacheScanResult,
  CleanResult,
  ProcessEntry,
  KillResult,
  BackupResult,
  WeatherData,
  CurrencyRate,
} from './shared/types';
import type { TempDirInfo, PcCleanResult } from './main/services/pcClean'
import type { ParsedEcpInfo } from './main/services/ecpParser'
import type { TraderInfo } from './main/services/innCheck'
import type { NewsFeedItem } from './main/services/newsFeed'

const api = {
  platform: process.platform,
  onec: {
    scanCache: (): Promise<CacheScanResult> => ipcRenderer.invoke(IPC.CACHE_SCAN),
    cleanCache: (paths: string[], backup?: boolean): Promise<CleanResult> => ipcRenderer.invoke(IPC.CACHE_CLEAN, paths, backup),
    listProcesses: (): Promise<ProcessEntry[]> => ipcRenderer.invoke(IPC.PROC_LIST),
    killProcesses: (pids: number[]): Promise<KillResult> => ipcRenderer.invoke(IPC.PROC_KILL, pids),
    pickDatabaseFile: (): Promise<string | null> => ipcRenderer.invoke(IPC.BACKUP_PICK_DB),
    pickBackupDir: (): Promise<string | null> => ipcRenderer.invoke(IPC.BACKUP_PICK_DIR),
    backupDatabase: (src: string, dest: string): Promise<BackupResult> =>
      ipcRenderer.invoke(IPC.BACKUP_RUN, src, dest),
    getBackupConfig: (): Promise<any> => ipcRenderer.invoke(IPC.BACKUP_GET_CONFIG),
    saveBackupConfig: (config: any): Promise<void> => ipcRenderer.invoke(IPC.BACKUP_SAVE_CONFIG, config)
  },
  widgets: {
    getWeather: (): Promise<WeatherData> => ipcRenderer.invoke(IPC.WEATHER_GET),
    getRates: (codes?: string[]): Promise<CurrencyRate[]> => ipcRenderer.invoke(IPC.CURRENCY_GET, codes),
    getRateOnDate: (code: string, date: string): Promise<CurrencyRate | null> =>
      ipcRenderer.invoke(IPC.CURRENCY_ON_DATE, code, date)
  },
  pc: {
    scan: (): Promise<TempDirInfo[]> => ipcRenderer.invoke(IPC.PC_SCAN),
    clean: (ids: string[]): Promise<PcCleanResult> => ipcRenderer.invoke(IPC.PC_CLEAN, ids),
    checkBrowsers: (ids: string[]): Promise<string[]> => ipcRenderer.invoke(IPC.PC_CHECK_BROWSERS, ids)
  },
  ecp: {
    pickPfx: (): Promise<string | null> => ipcRenderer.invoke(IPC.ECP_PICK_PFX),
    parsePfx: (filePath: string, password: string): Promise<ParsedEcpInfo> =>
      ipcRenderer.invoke(IPC.ECP_PARSE_PFX, filePath, password),
    pickFileToSign: (): Promise<string | null> => ipcRenderer.invoke(IPC.ECP_PICK_FILE_TO_SIGN),
    pickSigFile: (): Promise<string | null> => ipcRenderer.invoke(IPC.ECP_PICK_SIG_FILE),
    signFile: (pfxPath: string, password: string, filePath: string): Promise<{ success: boolean; sigPath?: string; error?: string }> =>
      ipcRenderer.invoke(IPC.ECP_SIGN_FILE, pfxPath, password, filePath),
    verifySig: (filePath: string, sigPath: string): Promise<{ success: boolean; signer?: string; signedAt?: string; error?: string }> =>
      ipcRenderer.invoke(IPC.ECP_VERIFY_SIG, filePath, sigPath)
  },
  safe: {
    isAvailable: (): Promise<boolean> => ipcRenderer.invoke(IPC.SAFE_AVAILABLE),
    encrypt: (plainText: string): Promise<string> => ipcRenderer.invoke(IPC.SAFE_ENCRYPT, plainText),
    decrypt: (encryptedHex: string): Promise<string> => ipcRenderer.invoke(IPC.SAFE_DECRYPT, encryptedHex)
  },
  inn: {
    check: (tin: string): Promise<TraderInfo | null> => ipcRenderer.invoke(IPC.INN_CHECK, tin)
  },
  news: {
    fetch: (): Promise<NewsFeedItem[]> => ipcRenderer.invoke(IPC.NEWS_FEED)
  },
  pdf: {
    generate: (htmlContent: string, fileName: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC.PDF_GENERATE, htmlContent, fileName)
  },
  notification: {
    show: (title: string, body: string): Promise<void> =>
      ipcRenderer.invoke(IPC.NOTIFY_SHOW, title, body)
  },
  autostart: {
    get: (): Promise<boolean> => ipcRenderer.invoke(IPC.AUTOSTART_GET),
    set: (enabled: boolean): Promise<void> => ipcRenderer.invoke(IPC.AUTOSTART_SET, enabled)
  },
  updater: {
    checkForUpdates: (): Promise<{ status: string; error: string; version: string }> =>
      ipcRenderer.invoke('app:check-for-updates'),
    getStatus: (): Promise<{ status: string; error: string; version: string }> =>
      ipcRenderer.invoke('app:get-update-status'),
    installUpdate: (): Promise<void> =>
      ipcRenderer.invoke('app:install-update'),
    onUpdateStatus: (callback: (data: { status: string; error: string; version: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data)
      ipcRenderer.on('app:update-status', handler)
      return () => ipcRenderer.removeListener('app:update-status', handler)
    }
  },
  tray: {
    setPinned: (pinned: boolean): Promise<boolean> => ipcRenderer.invoke('tray:set-pinned', pinned),
    openApp: (route?: string): Promise<void> => ipcRenderer.invoke('tray:open-app', route),
    onNavigate: (callback: (route: string) => void) => {
      const handler = (_event: any, route: string) => callback(route)
      ipcRenderer.on('tray:navigate', handler)
      return () => ipcRenderer.removeListener('tray:navigate', handler)
    }
  }
}

contextBridge.exposeInMainWorld('bx', api)

export type BxApi = typeof api


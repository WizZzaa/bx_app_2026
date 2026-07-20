// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC } from './shared/ipc-channels';
import type {
  CacheScanResult,
  CleanResult,
  ProcessEntry,
  KillResult,
  BackupResult,
  RestoreResult,
  DeepCheckResult,
  WeatherData,
  CurrencyRate,
  BankExchangeRate,
} from './shared/types';
import type { TempDirInfo, PcCleanResult } from './main/services/pcClean'
import type { ParsedEcpInfo } from './main/services/ecpParser'
import type { TraderInfo } from './main/services/innCheck'
import type { NewsFeedItem } from './main/services/newsFeed'
import type { UpdateSnapshot } from './main/services/updatePolicy'
import type { BackupScheduleConfig } from './main/services/onecBackupScheduler'
import type { SiteResetMode, SiteSessionResult } from './shared/siteSession'

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
    restoreDatabase: (source: string, target: string): Promise<RestoreResult> =>
      ipcRenderer.invoke(IPC.BACKUP_RESTORE, source, target),
    pickOnecExecutable: (): Promise<string | null> => ipcRenderer.invoke(IPC.BACKUP_PICK_ONEC_EXE),
    deepCheckBackup: (source: string, executable: string, workingDatabase: string): Promise<DeepCheckResult> =>
      ipcRenderer.invoke(IPC.BACKUP_DEEP_CHECK, source, executable, workingDatabase),
    getBackupConfig: (): Promise<BackupScheduleConfig> => ipcRenderer.invoke(IPC.BACKUP_GET_CONFIG),
    saveBackupConfig: (config: BackupScheduleConfig, baseConfig: BackupScheduleConfig): Promise<void> =>
      ipcRenderer.invoke(IPC.BACKUP_SAVE_CONFIG, config, baseConfig)
  },
  widgets: {
    getWeather: (): Promise<WeatherData> => ipcRenderer.invoke(IPC.WEATHER_GET),
    getRates: (codes?: string[]): Promise<CurrencyRate[]> => ipcRenderer.invoke(IPC.CURRENCY_GET, codes),
    getRateOnDate: (code: string, date: string): Promise<CurrencyRate | null> =>
      ipcRenderer.invoke(IPC.CURRENCY_ON_DATE, code, date),
    getBankRates: (codes?: string[]): Promise<BankExchangeRate[]> =>
      ipcRenderer.invoke(IPC.CURRENCY_BANKS_GET, codes)
  },
  pc: {
    scan: (): Promise<TempDirInfo[]> => ipcRenderer.invoke(IPC.PC_SCAN),
    clean: (ids: string[]): Promise<PcCleanResult> => ipcRenderer.invoke(IPC.PC_CLEAN, ids),
    checkBrowsers: (ids: string[]): Promise<string[]> => ipcRenderer.invoke(IPC.PC_CHECK_BROWSERS, ids)
  },
  siteSession: {
    open: (url: string): Promise<SiteSessionResult> => ipcRenderer.invoke(IPC.SITE_SESSION_OPEN, url),
    reset: (url: string, mode: SiteResetMode): Promise<SiteSessionResult> =>
      ipcRenderer.invoke(IPC.SITE_SESSION_RESET, url, mode)
  },
  ecp: {
    pickPfx: (): Promise<string | null> => ipcRenderer.invoke(IPC.ECP_PICK_PFX),
    parsePfx: (fileHandle: string, password: string): Promise<ParsedEcpInfo> =>
      ipcRenderer.invoke(IPC.ECP_PARSE_PFX, fileHandle, password)
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
    checkForUpdates: (): Promise<UpdateSnapshot> =>
      ipcRenderer.invoke('app:check-for-updates'),
    getStatus: (): Promise<UpdateSnapshot> =>
      ipcRenderer.invoke('app:get-update-status'),
    installUpdate: (): Promise<void> =>
      ipcRenderer.invoke('app:install-update'),
    onUpdateStatus: (callback: (data: UpdateSnapshot) => void) => {
      const handler = (_event: IpcRendererEvent, data: UpdateSnapshot) => callback(data)
      ipcRenderer.on('app:update-status', handler)
      return () => ipcRenderer.removeListener('app:update-status', handler)
    }
  },
  tray: {
    setPinned: (pinned: boolean): Promise<boolean> => ipcRenderer.invoke('tray:set-pinned', pinned),
    getPinned: (): Promise<boolean> => ipcRenderer.invoke('tray:get-pinned'),
    dockToTaskbar: (): Promise<void> => ipcRenderer.invoke('tray:dock-to-taskbar'),
    resizeWidget: (width: number, height: number): Promise<void> => ipcRenderer.invoke('tray:resize-widget', width, height),
    setClickThrough: (enabled: boolean): Promise<void> => ipcRenderer.invoke('tray:set-click-through', enabled),
    showNotification: (title: string, body: string, route?: string): Promise<boolean> => ipcRenderer.invoke('tray:show-notification', title, body, route),
    openApp: (route?: string): Promise<void> => ipcRenderer.invoke('tray:open-app', route),
    onNavigate: (callback: (route: string) => void) => {
      const handler = (_event: IpcRendererEvent, route: string) => callback(route)
      ipcRenderer.on('tray:navigate', handler)
      return () => ipcRenderer.removeListener('tray:navigate', handler)
    }
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('win:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('win:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('win:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('win:isMaximized')
  }
}

contextBridge.exposeInMainWorld('bx', api)

export type BxApi = typeof api

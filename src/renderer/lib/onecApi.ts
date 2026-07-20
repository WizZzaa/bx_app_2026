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
} from '../../shared/types';
import type { UpdateSnapshot } from '../../main/services/updatePolicy'
import type { BackupScheduleConfig } from '../../main/services/onecBackupScheduler'
import type { TempDirInfo, PcCleanResult } from '../../main/services/pcClean'
import type { ParsedEcpInfo } from '../../main/services/ecpParser'
import type { SiteResetMode, SiteSessionResult } from '../../shared/siteSession'

interface BxBridge {
  platform: string;
  onec: {
    scanCache(): Promise<CacheScanResult>;
    cleanCache(paths: string[], backup?: boolean): Promise<CleanResult>;
    listProcesses(): Promise<ProcessEntry[]>;
    killProcesses(pids: number[]): Promise<KillResult>;
    pickDatabaseFile(): Promise<string | null>;
    pickBackupDir(): Promise<string | null>;
    backupDatabase(src: string, dest: string): Promise<BackupResult>;
    restoreDatabase(source: string, target: string): Promise<RestoreResult>;
    pickOnecExecutable(): Promise<string | null>;
    deepCheckBackup(source: string, executable: string, workingDatabase: string): Promise<DeepCheckResult>;
    getBackupConfig(): Promise<BackupScheduleConfig>
    saveBackupConfig(config: BackupScheduleConfig, baseConfig: BackupScheduleConfig): Promise<void>
  }
  widgets: {
    getWeather(): Promise<WeatherData>
    getRates(codes?: string[]): Promise<CurrencyRate[]>
    getRateOnDate(code: string, date: string): Promise<CurrencyRate | null>
  }
  pc: {
    scan(): Promise<TempDirInfo[]>
    clean(ids: string[]): Promise<PcCleanResult>
    checkBrowsers(ids: string[]): Promise<string[]>
  }
  siteSession: {
    open(url: string): Promise<SiteSessionResult>
    reset(url: string, mode: SiteResetMode): Promise<SiteSessionResult>
  }
  ecp: {
    pickPfx(): Promise<string | null>
    parsePfx(fileHandle: string, password: string): Promise<ParsedEcpInfo>
  }
  safe: {
    isAvailable(): Promise<boolean>
    encrypt(plainText: string): Promise<string>
    decrypt(encryptedHex: string): Promise<string>
  }
  inn: {
    check(tin: string): Promise<{
      inn: string; name: string; vatNumber?: string;
      regimeName?: string; region?: string; registrationDate?: string;
    } | null>
  }
  news: {
    fetch(): Promise<Array<{ title: string; link: string; date: string; source: string }>>
  }
  pdf: {
    generate(htmlContent: string, fileName: string): Promise<boolean>
  }
  notification: {
    show(title: string, body: string): Promise<void>
  }
  shell?: {
    openExternal(url: string): void
  }
  autostart?: {
    get(): Promise<boolean>
    set(enabled: boolean): Promise<void>
  }
  updater?: {
    checkForUpdates(): Promise<UpdateSnapshot>
    getStatus(): Promise<UpdateSnapshot>
    installUpdate(): Promise<void>
    onUpdateStatus(callback: (data: UpdateSnapshot) => void): () => void
  }
  tray?: {
    setPinned(pinned: boolean): Promise<boolean>
    openApp(route?: string): Promise<void>
    onNavigate(callback: (route: string) => void): () => void
  }
  window?: {
    minimize(): Promise<void>
    maximize(): Promise<void>
    close(): Promise<void>
    isMaximized(): Promise<boolean>
  }
}

declare global {
  interface Window {
    bx?: BxBridge;
  }
}

/** True when running inside Electron (preload bridge present). */
export const isElectron = typeof window !== 'undefined' && Boolean(window.bx);

function electronBridge(): BxBridge | undefined {
  return typeof window === 'undefined' ? undefined : window.bx;
}

// --- Mock data for browser preview (no Electron) ---
const mockCache: CacheScanResult = {
  platformSupported: true,
  totalBytes: 487_350_000,
  entries: [
    { path: 'C:/…/Local/1C/1cv8/a1b2c3', sizeBytes: 312_000_000, label: '1С:Предприятие — кэш (Local) / a1b2c3' },
    { path: 'C:/…/Local/1C/1cv8/d4e5f6', sizeBytes: 120_350_000, label: '1С:Предприятие — кэш (Local) / d4e5f6' },
    { path: 'C:/…/Roaming/1C/1cv8/77gg8h', sizeBytes: 55_000_000, label: '1С:Предприятие — кэш (Roaming) / 77gg8h' },
  ],
};

const mockProcs: ProcessEntry[] = [
  { pid: 4821, name: '1cv8.exe', memoryBytes: 845_000_000 },
  { pid: 5102, name: '1cv8c.exe', memoryBytes: 612_000_000 },
];

export const onecApi = {
  platform: electronBridge()?.platform ?? 'browser',

  async scanCache(): Promise<CacheScanResult> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.scanCache();
    await delay(600);
    return mockCache;
  },

  async cleanCache(paths: string[], backup?: boolean): Promise<CleanResult> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.cleanCache(paths, backup);
    await delay(800);
    const freed = mockCache.entries
      .filter(e => paths.includes(e.path))
      .reduce((a, e) => a + e.sizeBytes, 0);
    return { deletedPaths: paths, failedPaths: [], freedBytes: freed };
  },

  async listProcesses(): Promise<ProcessEntry[]> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.listProcesses();
    await delay(500);
    return mockProcs;
  },

  async killProcesses(pids: number[]): Promise<KillResult> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.killProcesses(pids);
    await delay(500);
    return { killed: pids, failed: [] };
  },

  async pickDatabaseFile(): Promise<string | null> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.pickDatabaseFile();
    await delay(300);
    return 'C:/Bases/Buh/1Cv8.1CD';
  },

  async pickBackupDir(): Promise<string | null> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.pickBackupDir();
    await delay(300);
    return 'D:/Backups';
  },

  async backupDatabase(src: string, dest: string): Promise<BackupResult> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.backupDatabase(src, dest);
    await delay(1200);
    return { success: true, destPath: `${dest}/1Cv8_2026-06-19_12-00.1CD`, sizeBytes: 1_240_000_000 };
  },

  async restoreDatabase(source: string, target: string): Promise<RestoreResult> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.restoreDatabase(source, target);
    await delay(1200);
    return {
      success: true,
      checks: [
        { id: 'paths', label: 'Исходник и рабочая база', ok: true, message: 'Файлы различаются и имеют формат .1CD' },
        { id: 'processes', label: 'Процессы 1С закрыты', ok: true, message: 'Активные процессы 1С не найдены' },
        { id: 'safety', label: 'Страховочная копия', ok: true, message: 'Демонстрационный режим браузера' },
        { id: 'final', label: 'Финальная проверка', ok: true, message: 'В Electron будет проверен SHA-256' },
      ],
      safetyCopyPath: target.replace(/\.1cd$/i, '_before_restore.1CD'),
    };
  },

  async pickOnecExecutable(): Promise<string | null> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.pickOnecExecutable()
    await delay(300)
    return 'C:/Program Files/1cv8/8.3.27/bin/1cv8.exe'
  },

  async deepCheckBackup(source: string, executable: string, workingDatabase: string): Promise<DeepCheckResult> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.deepCheckBackup(source, executable, workingDatabase)
    await delay(1200)
    return {
      success: true,
      durationMs: 1200,
      checks: [
        { id: 'selection', label: 'Изолированный источник', ok: source !== workingDatabase, message: 'Выбрана отдельная копия' },
        { id: 'designer', label: 'Тест 1С Designer', ok: true, message: `Демонстрация -TestOnly через ${executable}` },
        { id: 'immutable', label: 'Файлы не изменены', ok: true, message: 'SHA-256 не изменился' },
        { id: 'cleanup', label: 'Временные данные удалены', ok: true, message: 'Временный каталог удалён' },
      ],
      logExcerpt: 'Демонстрационный режим браузера: реальная 1С не запускалась.',
    }
  },

  async getBackupConfig(): Promise<BackupScheduleConfig> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.getBackupConfig()
    return { version: 2, databaseLimit: 1, databases: [] }
  },

  async saveBackupConfig(config: BackupScheduleConfig, baseConfig: BackupScheduleConfig): Promise<void> {
    const bridge = electronBridge();
    if (bridge) return bridge.onec.saveBackupConfig(config, baseConfig)
    console.log('Saved mock backup config:', config)
  }
};

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

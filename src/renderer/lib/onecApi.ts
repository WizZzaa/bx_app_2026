import type {
  CacheScanResult,
  CleanResult,
  ProcessEntry,
  KillResult,
  BackupResult,
} from '../../shared/types';
import type { UpdateSnapshot } from '../../main/services/updatePolicy'
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
    getBackupConfig(): Promise<any>
    saveBackupConfig(config: any): Promise<void>
  }
  widgets: {
    getWeather(): Promise<any>
    getRates(codes?: string[]): Promise<any[]>
    getRateOnDate(code: string, date: string): Promise<any | null>
  }
  pc: {
    scan(): Promise<any[]>
    clean(ids: string[]): Promise<any>
    checkBrowsers(ids: string[]): Promise<string[]>
  }
  siteSession: {
    open(url: string): Promise<SiteSessionResult>
    reset(url: string, mode: SiteResetMode): Promise<SiteSessionResult>
  }
  ecp: {
    pickPfx(): Promise<string | null>
    parsePfx(filePath: string, password: string): Promise<any>
    pickFileToSign(): Promise<string | null>
    pickSigFile(): Promise<string | null>
    signFile(pfxPath: string, password: string, filePath: string): Promise<{ success: boolean; sigPath?: string; error?: string }>
    verifySig(filePath: string, sigPath: string): Promise<{ success: boolean; signer?: string; signedAt?: string; error?: string }>
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
export const isElectron = typeof window !== 'undefined' && !!window.bx;

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
  platform: isElectron ? window.bx!.platform : 'browser',

  async scanCache(): Promise<CacheScanResult> {
    if (isElectron) return window.bx!.onec.scanCache();
    await delay(600);
    return mockCache;
  },

  async cleanCache(paths: string[], backup?: boolean): Promise<CleanResult> {
    if (isElectron) return window.bx!.onec.cleanCache(paths, backup);
    await delay(800);
    const freed = mockCache.entries
      .filter(e => paths.includes(e.path))
      .reduce((a, e) => a + e.sizeBytes, 0);
    return { deletedPaths: paths, failedPaths: [], freedBytes: freed };
  },

  async listProcesses(): Promise<ProcessEntry[]> {
    if (isElectron) return window.bx!.onec.listProcesses();
    await delay(500);
    return mockProcs;
  },

  async killProcesses(pids: number[]): Promise<KillResult> {
    if (isElectron) return window.bx!.onec.killProcesses(pids);
    await delay(500);
    return { killed: pids, failed: [] };
  },

  async pickDatabaseFile(): Promise<string | null> {
    if (isElectron) return window.bx!.onec.pickDatabaseFile();
    await delay(300);
    return 'C:/Bases/Buh/1Cv8.1CD';
  },

  async pickBackupDir(): Promise<string | null> {
    if (isElectron) return window.bx!.onec.pickBackupDir();
    await delay(300);
    return 'D:/Backups';
  },

  async backupDatabase(src: string, dest: string): Promise<BackupResult> {
    if (isElectron) return window.bx!.onec.backupDatabase(src, dest);
    await delay(1200);
    return { success: true, destPath: `${dest}/1Cv8_2026-06-19_12-00.1CD`, sizeBytes: 1_240_000_000 };
  },

  async getBackupConfig(): Promise<any> {
    if (isElectron) return (window.bx!.onec as any).getBackupConfig()
    return { enabled: false, sourceFile: '', destDir: '', intervalHours: 24 }
  },

  async saveBackupConfig(config: any): Promise<void> {
    if (isElectron) return (window.bx!.onec as any).saveBackupConfig(config)
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

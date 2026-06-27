// Shared types between main and renderer processes (1C utilities — Phase 1)

export interface CacheEntry {
  path: string;
  sizeBytes: number;
  label: string; // human-readable description, e.g. "1С:Предприятие 8.3 — кэш"
}

export interface CacheScanResult {
  entries: CacheEntry[];
  totalBytes: number;
  platformSupported: boolean; // false on non-Windows (cache paths are Windows-specific)
}

export interface CleanResult {
  deletedPaths: string[];
  failedPaths: { path: string; error: string }[];
  freedBytes: number;
}

export interface ProcessEntry {
  pid: number;
  name: string;       // e.g. "1cv8.exe"
  memoryBytes: number;
}

export interface KillResult {
  killed: number[];
  failed: { pid: number; error: string }[];
}

export interface BackupResult {
  success: boolean;
  destPath?: string;
  sizeBytes?: number;
  error?: string;
}

// Names of 1C processes we manage
export const ONEC_PROCESS_NAMES = ['1cv8.exe', '1cv8c.exe', 'ragent.exe', 'rphost.exe'];

// --- Dashboard widgets ---
export interface WeatherData {
  city: string;
  temp: number;
  feels: number;
  desc: string;
  icon: string;
  humidity: number;
  wind: number;
}

export interface CurrencyRate {
  code: string;
  name: string;
  flag: string;
  value: number; // сум за 1 единицу
  diff: number;  // изменение к прошлому дню
  date: string;  // дата курса (DD.MM.YYYY от cbu.uz)
}

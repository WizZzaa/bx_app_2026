import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'

export interface TempDirInfo {
  id: string;
  label: string;
  dirPath: string;
  sizeBytes: number;
  fileCount: number;
  accessible: boolean;
}

export interface PcCleanResult {
  freedBytes: number;
  deletedCount: number;
  errors: string[];
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getDirSizeSync(dirPath: string): { size: number; count: number } {
  let size = 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          const sub = getDirSizeSync(full);
          size += sub.size;
          count += sub.count;
        } else {
          const stat = fs.statSync(full);
          size += stat.size;
          count += 1;
        }
      } catch {
        // skip locked files
      }
    }
  } catch {
    // dir not accessible
  }
  return { size, count };
}

function getCandidateDirs(): { id: string; label: string; dirPath: string }[] {
  const dirs: { id: string; label: string; dirPath: string }[] = [
    { id: 'sys_temp', label: 'Системный TEMP (%TEMP%)', dirPath: os.tmpdir() },
  ];

  if (process.platform === 'win32') {
    dirs.push(
      { id: 'win_temp', label: 'Windows\\Temp', dirPath: 'C:\\Windows\\Temp' },
      { id: 'prefetch', label: 'Windows Prefetch', dirPath: 'C:\\Windows\\Prefetch' },
    );

    // Chrome cache
    const chrome = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache');
    dirs.push({ id: 'chrome_cache', label: 'Кэш Chrome', dirPath: chrome });

    // Edge cache
    const edge = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache');
    dirs.push({ id: 'edge_cache', label: 'Кэш Edge', dirPath: edge });

    // Firefox cache
    const firefox = path.join(os.homedir(), 'AppData', 'Local', 'Mozilla', 'Firefox', 'Profiles');
    dirs.push({ id: 'firefox_cache', label: 'Кэш Firefox', dirPath: firefox });

    // Yandex Browser cache
    const yandex = path.join(os.homedir(), 'AppData', 'Local', 'Yandex', 'YandexBrowser', 'User Data', 'Default', 'Cache');
    dirs.push({ id: 'yandex_cache', label: 'Кэш Яндекс.Браузер', dirPath: yandex });

    // Thumbnails cache
    const thumbs = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer');
    dirs.push({ id: 'thumbs', label: 'Кэш миниатюр Explorer', dirPath: thumbs });
  }

  return dirs;
}

export async function scanPcTemp(): Promise<TempDirInfo[]> {
  const candidates = getCandidateDirs();
  return candidates.map(c => {
    let accessible = false;
    let sizeBytes = 0;
    let fileCount = 0;
    try {
      fs.accessSync(c.dirPath, fs.constants.R_OK);
      accessible = true;
      const { size, count } = getDirSizeSync(c.dirPath);
      sizeBytes = size;
      fileCount = count;
    } catch {
      accessible = false;
    }
    return { ...c, accessible, sizeBytes, fileCount };
  });
}

function rmDirContents(dirPath: string): { freed: number; deleted: number; errors: string[] } {
  let freed = 0;
  let deleted = 0;
  const errors: string[] = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          fs.rmSync(full, { recursive: true, force: true });
          deleted++;
        } else {
          const stat = fs.statSync(full);
          freed += stat.size;
          fs.unlinkSync(full);
          deleted++;
        }
      } catch (error: unknown) {
        errors.push(entry.name + ': ' + errorMessage(error, 'ошибка'));
      }
    }
  } catch (error: unknown) {
    errors.push(dirPath + ': ' + errorMessage(error, 'нет доступа'));
  }
  return { freed, deleted, errors };
}

export async function cleanPcTemp(ids: string[]): Promise<PcCleanResult> {
  const candidates = getCandidateDirs().filter(c => ids.includes(c.id));
  let freedBytes = 0;
  let deletedCount = 0;
  const errors: string[] = [];

  for (const c of candidates) {
    try {
      fs.accessSync(c.dirPath, fs.constants.W_OK);
      const result = rmDirContents(c.dirPath);
      freedBytes += result.freed;
      deletedCount += result.deleted;
      errors.push(...result.errors.slice(0, 3));
    } catch {
      errors.push(`${c.label}: нет прав на запись`);
    }
  }

  return { freedBytes, deletedCount, errors };
}

export function checkRunningBrowsers(ids: string[]): Promise<string[]> {
  return new Promise((resolve) => {
    const active: string[] = []
    const cmd = process.platform === 'win32' ? 'tasklist' : 'ps ax'
    
    exec(cmd, (err, stdout) => {
      if (err) {
        return resolve([])
      }
      
      const output = stdout.toLowerCase()
      
      if (ids.includes('chrome_cache') && (output.includes('chrome.exe') || output.includes('chrome'))) {
        active.push('chrome_cache')
      }
      if (ids.includes('edge_cache') && (output.includes('msedge.exe') || output.includes('msedge'))) {
        active.push('edge_cache')
      }
      if (ids.includes('firefox_cache') && (output.includes('firefox.exe') || output.includes('firefox'))) {
        active.push('firefox_cache')
      }
      if (ids.includes('yandex_cache') && (output.includes('browser.exe') || output.includes('yandex'))) {
        active.push('yandex_cache')
      }
      
      resolve(active)
    })
  })
}

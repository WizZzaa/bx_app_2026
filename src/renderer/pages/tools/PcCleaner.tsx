import React, { useState } from 'react';
import { isElectron } from '../../lib/onecApi';

interface TempDirInfo {
  id: string;
  label: string;
  dirPath: string;
  sizeBytes: number;
  fileCount: number;
  accessible: boolean;
}

const DEMO_DIRS: TempDirInfo[] = [
  { id: 'sys_temp', label: 'Системный TEMP (%TEMP%)', dirPath: 'C:\\Users\\User\\AppData\\Local\\Temp', sizeBytes: 347_200_000, fileCount: 2840, accessible: true },
  { id: 'win_temp', label: 'Windows\\Temp', dirPath: 'C:\\Windows\\Temp', sizeBytes: 58_000_000, fileCount: 430, accessible: true },
  { id: 'prefetch', label: 'Windows Prefetch', dirPath: 'C:\\Windows\\Prefetch', sizeBytes: 12_500_000, fileCount: 128, accessible: true },
  { id: 'chrome_cache', label: 'Кэш Chrome', dirPath: 'C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\...\\Cache', sizeBytes: 215_000_000, fileCount: 1200, accessible: true },
  { id: 'edge_cache', label: 'Кэш Edge', dirPath: 'C:\\Users\\User\\AppData\\Local\\Microsoft\\Edge\\...\\Cache', sizeBytes: 89_000_000, fileCount: 670, accessible: true },
  { id: 'yandex_cache', label: 'Кэш Яндекс.Браузер', dirPath: 'C:\\Users\\User\\AppData\\Local\\Yandex\\...\\Cache', sizeBytes: 134_000_000, fileCount: 890, accessible: true },
  { id: 'thumbs', label: 'Кэш миниатюр Explorer', dirPath: 'C:\\Users\\User\\AppData\\Local\\Microsoft\\Windows\\Explorer', sizeBytes: 8_400_000, fileCount: 42, accessible: true },
  { id: 'firefox_cache', label: 'Кэш Firefox', dirPath: 'C:\\Users\\User\\AppData\\Local\\Mozilla\\Firefox\\Profiles', sizeBytes: 0, fileCount: 0, accessible: false },
];

function fmtSize(bytes: number) {
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(1) + ' ГБ';
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(0) + ' МБ';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' КБ';
  return bytes + ' Б';
}

type State = 'idle' | 'scanning' | 'scanned' | 'cleaning' | 'done';

export default function PcCleaner() {
  const [state, setState] = useState<State>('idle');
  const [dirs, setDirs] = useState<TempDirInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ freedBytes: number; deletedCount: number; errors: string[] } | null>(null);
  const [runningBrowsers, setRunningBrowsers] = useState<string[]>([]);

  async function checkActiveBrowsers(currentSelected: Set<string>) {
    if (!isElectron || !(window as any).bx?.pc?.checkBrowsers) return
    const selectedBrowserIds = [...currentSelected].filter(id => id.endsWith('_cache'))
    if (selectedBrowserIds.length === 0) {
      setRunningBrowsers([])
      return
    }
    const active = await (window as any).bx.pc.checkBrowsers(selectedBrowserIds)
    setRunningBrowsers(active)
  }

  async function scan() {
    setState('scanning');
    setResult(null);
    setSelected(new Set());
    await new Promise(r => setTimeout(r, 600));
    let scannedDirs = DEMO_DIRS;
    if (isElectron && (window as any).bx?.pc?.scan) {
      const data = await (window as any).bx.pc.scan();
      setDirs(data);
      scannedDirs = data;
    } else {
      setDirs(DEMO_DIRS);
    }
    // авто-выбрать все доступные
    const accessibleIds = scannedDirs
      .filter((d: TempDirInfo) => d.accessible && d.fileCount > 0)
      .map((d: TempDirInfo) => d.id);
    const newSelected = new Set(accessibleIds);
    setSelected(newSelected);
    await checkActiveBrowsers(newSelected);
    setState('scanned');
  }

  async function clean() {
    if (selected.size === 0) return;
    setState('cleaning');
    await new Promise(r => setTimeout(r, 800));
    if (isElectron && (window as any).bx?.pc?.clean) {
      const res = await (window as any).bx.pc.clean([...selected]);
      setResult(res);
    } else {
      const totalSize = dirs.filter(d => selected.has(d.id)).reduce((s, d) => s + d.sizeBytes, 0);
      const totalFiles = dirs.filter(d => selected.has(d.id)).reduce((s, d) => s + d.fileCount, 0);
      setResult({ freedBytes: totalSize, deletedCount: totalFiles, errors: [] });
      setDirs(prev => prev.map(d => selected.has(d.id) ? { ...d, sizeBytes: 0, fileCount: 0 } : d));
    }
    setSelected(new Set());
    setRunningBrowsers([]);
    setState('done');
  }

  function toggle(id: string) {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      checkActiveBrowsers(s);
      return s;
    });
  }

  const totalSelected = dirs.filter(d => selected.has(d.id)).reduce((s, d) => s + d.sizeBytes, 0);

  return (
    <div className="rounded-xl border border-bx-border bg-bx-surface p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🧽</span>
            <h3 className="text-sm font-semibold text-bx-text">Очистка ПК</h3>
          </div>
          <p className="text-xs text-bx-muted mt-0.5 ml-7">Temp-файлы Windows, кэш браузеров — не только 1С</p>
        </div>
        {state === 'idle' || state === 'done' ? (
          <button onClick={scan} className="flex-shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors">
            Сканировать
          </button>
        ) : state === 'scanning' ? (
          <span className="text-xs text-bx-muted animate-pulse">Сканирование…</span>
        ) : state === 'scanned' ? (
          <button
            onClick={clean}
            disabled={selected.size === 0}
            className="flex-shrink-0 px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs rounded-lg transition-colors"
          >
            Очистить {totalSelected > 0 ? fmtSize(totalSelected) : ''}
          </button>
        ) : (
          <span className="text-xs text-bx-muted animate-pulse">Очистка…</span>
        )}
      </div>

      {runningBrowsers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-400">
          ⚠️ <strong>Внимание:</strong> Запущены браузеры ({runningBrowsers.map(id => id === 'chrome_cache' ? 'Chrome' : id === 'edge_cache' ? 'Edge' : id === 'firefox_cache' ? 'Firefox' : 'Яндекс').join(', ')}). Рекомендуется закрыть их перед очисткой кэша, иначе часть файлов не сможет быть удалена.
        </div>
      )}

      {!isElectron && (
        <div className="text-xs text-amber-400 bg-amber-500/10 rounded px-3 py-2">
          ⚠ Демо-режим браузера — реальная очистка только в десктоп-версии
        </div>
      )}

      {(state === 'scanned' || state === 'done') && dirs.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-bx-muted px-1">
            <span>Папка</span>
            <span>Размер / Файлов</span>
          </div>
          {dirs.map(d => (
            <label
              key={d.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                d.accessible && d.fileCount > 0 ? 'hover:bg-bx-surface-2' : 'opacity-40 cursor-default'
              } ${selected.has(d.id) ? 'bg-bx-surface-2' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected.has(d.id)}
                disabled={!d.accessible || d.fileCount === 0}
                onChange={() => toggle(d.id)}
                className="w-3.5 h-3.5 accent-blue-500 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-bx-text truncate">{d.label}</p>
                <p className="text-[10px] text-bx-muted truncate">{d.dirPath}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-medium ${d.sizeBytes > 100_000_000 ? 'text-red-400' : d.sizeBytes > 0 ? 'text-amber-400' : 'text-bx-muted'}`}>
                  {d.accessible ? fmtSize(d.sizeBytes) : 'нет доступа'}
                </p>
                {d.accessible && <p className="text-[10px] text-bx-muted">{d.fileCount} файл.</p>}
              </div>
            </label>
          ))}
        </div>
      )}

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
          <p className="text-sm font-medium text-emerald-400">Очистка завершена</p>
          <p className="text-xs text-bx-muted mt-0.5">
            Освобождено: {fmtSize(result.freedBytes)} · удалено {result.deletedCount} файл.
            {result.errors.length > 0 && ` · ${result.errors.length} пропущено (заняты)`}
          </p>
        </div>
      )}
    </div>
  );
}

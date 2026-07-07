import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { onecApi, formatBytes } from '../../lib/onecApi';
import type { CacheScanResult, CleanResult } from '../../../shared/types';

export default function CacheCleaner() {
  const [scan, setScan] = useState<CacheScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<CleanResult | null>(null);

  async function doScan() {
    setScanning(true);
    setResult(null);
    const res = await onecApi.scanCache();
    setScan(res);
    setSelected(new Set(res.entries.map(e => e.path))); // select all by default
    setScanning(false);
  }

  function toggle(path: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  async function doClean() {
    if (selected.size === 0) return;
    setCleaning(true);
    const res = await onecApi.cleanCache([...selected]);
    setResult(res);
    setCleaning(false);
    // refresh
    const rescan = await onecApi.scanCache();
    setScan(rescan);
    setSelected(new Set(rescan.entries.map(e => e.path)));
  }

  const selectedBytes = scan
    ? scan.entries.filter(e => selected.has(e.path)).reduce((a, e) => a + e.sizeBytes, 0)
    : 0;

  return (
    <Card
      title="Очистка кэша 1С"
      icon="🧹"
      description="Безопасное удаление временных файлов. Базы данных не затрагиваются."
      actions={
        <Button variant="ghost" onClick={doScan} loading={scanning}>
          {scan ? 'Пересканировать' : 'Сканировать'}
        </Button>
      }
    >
      {!scan && !scanning && (
        <p className="text-sm text-bx-muted text-center py-6">
          Нажмите «Сканировать», чтобы найти кэш 1С на этом компьютере.
        </p>
      )}

      {scan && !scan.platformSupported && (
        <div className="text-sm text-amber-400 bg-amber-500/10 rounded-lg px-4 py-3">
          ⚠ Очистка кэша 1С доступна только в Windows и macOS версиях приложения.
        </div>
      )}

      {scan && scan.platformSupported && (
        <div className="space-y-3">
          {scan.entries.length === 0 ? (
            <p className="text-sm text-bx-muted text-center py-6">Кэш 1С не найден — всё чисто! ✨</p>
          ) : (
            <>
              <div className="text-xs text-bx-muted">
                Найдено {scan.entries.length} папок кэша, всего{' '}
                <span className="text-bx-text font-medium">{formatBytes(scan.totalBytes)}</span>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {scan.entries.map(e => (
                  <label
                    key={e.path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bx-bg hover:bg-bx-surface-2 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(e.path)}
                      onChange={() => toggle(e.path)}
                      className="accent-blue-500"
                    />
                    <span className="flex-1 text-sm text-bx-text truncate" title={e.path}>
                      {e.label}
                    </span>
                    <span className="text-xs text-bx-muted flex-shrink-0">{formatBytes(e.sizeBytes)}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-bx-border">
                <span className="text-xs text-bx-muted">
                  Выбрано {selected.size} · освободится{' '}
                  <span className="text-blue-400 font-medium">{formatBytes(selectedBytes)}</span>
                </span>
                <Button variant="danger" onClick={doClean} loading={cleaning} disabled={selected.size === 0}>
                  Очистить выбранное
                </Button>
              </div>
            </>
          )}

          {result && (
            <div className="text-sm text-green-400 bg-green-500/10 rounded-lg px-4 py-3">
              ✓ Удалено папок: {result.deletedPaths.length}, освобождено {formatBytes(result.freedBytes)}
              {result.failedPaths.length > 0 && (
                <div className="text-amber-400 mt-1">⚠ Не удалось: {result.failedPaths.length}</div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

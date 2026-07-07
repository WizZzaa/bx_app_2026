import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { onecApi, formatBytes } from '../../lib/onecApi';
import type { ProcessEntry, KillResult } from '../../../shared/types';

export default function ProcessKiller() {
  const [procs, setProcs] = useState<ProcessEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [killing, setKilling] = useState(false);
  const [result, setResult] = useState<KillResult | null>(null);

  async function refresh() {
    setLoading(true);
    setResult(null);
    const res = await onecApi.listProcesses();
    setProcs(res);
    setLoading(false);
  }

  async function killOne(pid: number) {
    setKilling(true);
    const res = await onecApi.killProcesses([pid]);
    setResult(res);
    setKilling(false);
    await refresh();
  }

  async function killAll() {
    if (!procs || procs.length === 0) return;
    setKilling(true);
    const res = await onecApi.killProcesses(procs.map(p => p.pid));
    setResult(res);
    setKilling(false);
    await refresh();
  }

  return (
    <Card
      title="Снятие зависших процессов 1С"
      icon="⛔"
      description="Принудительное завершение зависших сессий 1cv8.exe / 1cv8c.exe."
      actions={
        <Button variant="ghost" onClick={refresh} loading={loading}>
          Обновить список
        </Button>
      }
    >
      {!procs && !loading && (
        <p className="text-sm text-bx-muted text-center py-6">
          Нажмите «Обновить список», чтобы увидеть запущенные процессы 1С.
        </p>
      )}

      {procs && (
        <div className="space-y-3">
          {procs.length === 0 ? (
            <p className="text-sm text-bx-muted text-center py-6">Запущенных процессов 1С не обнаружено ✨</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {procs.map(p => (
                  <div
                    key={p.pid}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bx-bg"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-sm text-bx-text font-mono">{p.name}</span>
                    <span className="text-xs text-bx-muted">PID {p.pid}</span>
                    <span className="text-xs text-bx-muted ml-auto">{formatBytes(p.memoryBytes)}</span>
                    <Button variant="danger" onClick={() => killOne(p.pid)} loading={killing} className="!py-1 !px-3 !text-xs">
                      Завершить
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-bx-border">
                <Button variant="danger" onClick={killAll} loading={killing}>
                  Завершить все ({procs.length})
                </Button>
              </div>
            </>
          )}

          {result && (
            <div className="text-sm text-green-400 bg-green-500/10 rounded-lg px-4 py-3">
              ✓ Завершено процессов: {result.killed.length}
              {result.failed.length > 0 && (
                <div className="text-amber-400 mt-1">⚠ Не удалось: {result.failed.length}</div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

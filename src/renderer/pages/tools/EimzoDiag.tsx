import React, { useState } from 'react';
import { EIMZO_DIAGNOSTIC_BOUNDARY } from '../../lib/ecpProductBoundary';

interface CheckItem {
  id: string;
  label: string;
  desc: string;
  status: 'idle' | 'checking' | 'ok' | 'warn' | 'error';
  detail?: string;
}

const INITIAL: CheckItem[] = [
  { id: 'site', label: 'Сайт e-imzo.uz', desc: 'Доступность официального сайта', status: 'idle' },
  { id: 'local', label: 'Локальный сервис E-Imzo', desc: 'localhost:64443 — доступность для официальных порталов', status: 'idle' },
  { id: 'plugin', label: 'Плагин в браузере', desc: 'Расширение E-Imzo для Electron/Chrome', status: 'idle' },
  { id: 'myid', label: 'my.gov.uz (обновление ключей)', desc: 'Портал для онлайн-обновления DSK', status: 'idle' },
];

async function checkSite(url: string): Promise<{ ok: boolean; ms: number }> {
  const start = performance.now();
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(6000) });
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, ms: -1 };
  }
}

async function checkLocalEimzo(): Promise<{ ok: boolean; detail: string }> {
  try {
    await fetch('http://localhost:64443', { mode: 'no-cors', signal: AbortSignal.timeout(2000) });
    return { ok: true, detail: 'Сервис запущен на порту 64443' };
  } catch {
    return { ok: false, detail: 'Сервис не отвечает — возможно, не установлен или остановлен' };
  }
}

export default function EimzoDiag() {
  const [items, setItems] = useState<CheckItem[]>(INITIAL);
  const [running, setRunning] = useState(false);

  function update(id: string, patch: Partial<CheckItem>) {
    setItems(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  async function run() {
    setRunning(true);
    setItems(INITIAL.map(i => ({ ...i, status: 'checking' })));

    // Параллельно проверяем сайт и my.gov.uz
    const [siteRes, mygovRes, localRes] = await Promise.all([
      checkSite('https://e-imzo.uz'),
      checkSite('https://my.gov.uz'),
      checkLocalEimzo(),
    ]);

    update('site', {
      status: siteRes.ok ? 'ok' : 'error',
      detail: siteRes.ok ? `Доступен (${siteRes.ms} мс)` : 'Недоступен — проверьте интернет или VPN',
    });
    update('myid', {
      status: mygovRes.ok ? 'ok' : 'warn',
      detail: mygovRes.ok ? `Доступен (${mygovRes.ms} мс)` : 'Недоступен — обновление ключей онлайн невозможно',
    });
    update('local', {
      status: localRes.ok ? 'ok' : 'warn',
      detail: localRes.detail,
    });

    // Плагин — проверяем window.CAPIWS или window.EIMZOClient
    const pluginWindow = window as unknown as { CAPIWS?: unknown; EIMZOClient?: unknown };
    const hasPlugin = typeof pluginWindow.CAPIWS !== 'undefined' || typeof pluginWindow.EIMZOClient !== 'undefined';
    update('plugin', {
      status: hasPlugin ? 'ok' : 'warn',
      detail: hasPlugin
        ? 'Плагин E-Imzo обнаружен в окне браузера'
        : 'Плагин не обнаружен в окне BX; локальная служба проверяется отдельно',
    });

    setRunning(false);
  }

  function StatusIcon({ status }: { status: CheckItem['status'] }) {
    if (status === 'idle') return <span className="w-5 h-5 flex items-center justify-center text-bx-muted text-sm">○</span>;
    if (status === 'checking') return <span className="w-5 h-5 flex items-center justify-center text-blue-400 text-sm animate-spin">⟳</span>;
    if (status === 'ok') return <span className="w-5 h-5 flex items-center justify-center text-emerald-400 text-sm">✓</span>;
    if (status === 'warn') return <span className="w-5 h-5 flex items-center justify-center text-amber-400 text-sm">⚠</span>;
    return <span className="w-5 h-5 flex items-center justify-center text-red-400 text-sm">✕</span>;
  }

  const issues = items.filter(i => i.status === 'warn' || i.status === 'error');

  return (
    <div className="rounded-xl border border-bx-border bg-bx-surface p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🩺</span>
            <h3 className="text-sm font-semibold text-bx-text">Диагностика E-Imzo</h3>
          </div>
          <p className="text-xs text-bx-muted mt-0.5 ml-7">Проверка плагина, локального сервиса и доступности сайтов</p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex-shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
        >
          {running ? 'Проверяю…' : 'Диагностика'}
        </button>
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-bx-muted">
        <strong className="text-bx-text">Граница BX:</strong> {EIMZO_DIAGNOSTIC_BOUNDARY}
      </div>

      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-bx-bg">
            <StatusIcon status={item.status} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-bx-text">{item.label}</p>
              <p className="text-[11px] text-bx-muted mt-0.5">
                {item.detail || item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {issues.length > 0 && (
        <div className="border border-bx-border-2 rounded-lg px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-bx-text">Рекомендации</p>
          {items.find(i => i.id === 'local' && i.status !== 'ok') && (
            <p className="text-xs text-bx-muted">
              • Для перезапуска E-Imzo: <code className="text-bx-text">Панель управления → Службы → E-Imzo → Перезапустить</code>
            </p>
          )}
          {items.find(i => i.id === 'plugin' && i.status !== 'ok') && (
            <p className="text-xs text-bx-muted">
              • Установить/обновить плагин: <span className="text-blue-400">e-imzo.uz → Загрузки</span>
            </p>
          )}
          {items.find(i => i.id === 'site' && i.status !== 'ok') && (
            <p className="text-xs text-bx-muted">
              • Проверьте интернет-соединение и настройки DNS / корпоративного прокси
            </p>
          )}
        </div>
      )}
    </div>
  );
}

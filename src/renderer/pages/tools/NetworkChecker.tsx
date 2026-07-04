import React, { useState, useEffect, useRef } from 'react';

interface SiteResult {
  id: string;
  label: string;
  url: string;
  category: string;
  ms: number | null;
  ok: boolean | null;
}

const SITES: Omit<SiteResult, 'ms' | 'ok'>[] = [
  { id: 'soliq', label: 'my.soliq.uz', url: 'https://my.soliq.uz', category: 'ГНК' },
  { id: 'soliq2', label: 'soliq.uz', url: 'https://soliq.uz', category: 'ГНК' },
  { id: 'didox', label: 'didox.uz', url: 'https://didox.uz', category: 'ЭДО' },
  { id: 'faktura', label: 'faktura.uz', url: 'https://faktura.uz', category: 'ЭДО' },
  { id: 'eimzo', label: 'e-imzo.uz', url: 'https://e-imzo.uz', category: 'ЭЦП' },
  { id: 'lex', label: 'lex.uz', url: 'https://lex.uz', category: 'НПА' },
  { id: 'norma', label: 'norma.uz', url: 'https://norma.uz', category: 'НПА' },
  { id: 'cbu', label: 'cbu.uz', url: 'https://cbu.uz', category: 'ЦБ' },
  { id: 'mygov', label: 'my.gov.uz', url: 'https://my.gov.uz', category: 'ЕПИГУ' },
  { id: 'customs', label: 'customs.uz', url: 'https://customs.uz', category: 'ВЭД' },
  { id: 'stat', label: 'stat.uz', url: 'https://stat.uz', category: 'Стат.' },
  { id: 'kapital', label: 'kapitalbank.uz', url: 'https://kapitalbank.uz', category: 'Банк' },
];

async function pingUrl(url: string): Promise<{ ms: number; ok: boolean }> {
  const start = performance.now();
  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    return { ms: Math.round(performance.now() - start), ok: true };
  } catch {
    return { ms: -1, ok: false };
  }
}

function StatusDot({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />;
  if (ok) return <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />;
}

function msColor(ms: number | null) {
  if (ms === null) return 'text-slate-600';
  if (ms < 0) return 'text-red-400';
  if (ms < 500) return 'text-emerald-400';
  if (ms < 1500) return 'text-amber-400';
  return 'text-red-400';
}

type State = 'idle' | 'checking' | 'done';

export default function NetworkChecker() {
  const [state, setState] = useState<State>('idle');
  const [results, setResults] = useState<SiteResult[]>(
    SITES.map(s => ({ ...s, ms: null, ok: null }))
  );

  async function check() {
    setState('checking');
    const fresh: SiteResult[] = SITES.map(s => ({ ...s, ms: null, ok: null }));
    setResults([...fresh]);

    await Promise.all(
      SITES.map(async (site, i) => {
        const { ms, ok } = await pingUrl(site.url);
        fresh[i] = { ...site, ms, ok };
        setResults([...fresh]);
      })
    );
    setState('done');
  }

  // Автозапуск проверки при открытии инструмента
  const ranOnce = useRef(false);
  useEffect(() => {
    if (!ranOnce.current) { ranOnce.current = true; check(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const online = results.filter(r => r.ok === true).length;
  const offline = results.filter(r => r.ok === false).length;

  return (
    <div className="rounded-xl border border-[#1e2535] bg-[#141820] p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📶</span>
            <h3 className="text-sm font-semibold text-slate-200">Проверка сети</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-7">Пинг госсайтов — видно, что «лежит»</p>
        </div>
        <button
          onClick={check}
          disabled={state === 'checking'}
          className="flex-shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
        >
          {state === 'checking' ? 'Проверяю…' : 'Проверить всё'}
        </button>
      </div>

      {state !== 'idle' && (
        <>
          {state === 'done' && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              offline === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {offline === 0
                ? `✓ Все ${online} сайтов доступны`
                : `⚠ Недоступно: ${offline} из ${online + offline} сайтов`}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {results.map(r => (
              <div key={r.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0f1117]">
                <StatusDot ok={r.ok} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-300">{r.label}</span>
                  <span className="ml-1.5 text-[10px] text-slate-600">{r.category}</span>
                </div>
                <span className={`text-xs font-mono font-medium flex-shrink-0 ${msColor(r.ms)}`}>
                  {r.ok === null
                    ? '…'
                    : r.ok
                    ? `${r.ms} мс`
                    : 'недост.'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {state === 'idle' && (
        <p className="text-xs text-slate-600 ml-7">Нажмите «Проверить всё» для диагностики доступности сайтов</p>
      )}
    </div>
  );
}

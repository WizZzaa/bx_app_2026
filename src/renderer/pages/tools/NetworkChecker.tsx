import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../lib/ui/ToastContext';
import { uid } from '../../lib/uid';

interface PingTarget {
  id: string;
  label: string;
  url: string;
  loginUrl?: string;
  category: string;
}

interface TestResult {
  id: string;
  label: string;
  category: string;
  url: string;
  urlOk: boolean | null;
  urlMs: number | null;
  loginUrl?: string;
  loginOk: boolean | null;
  loginMs: number | null;
}

const DEFAULT_SITES: PingTarget[] = [
  { id: 'soliq', label: 'ГНК: Налоговый кабинет', url: 'https://my.soliq.uz', loginUrl: 'https://my.soliq.uz/main', category: 'ГНК' },
  { id: 'didox', label: 'Didox: Электронные документы', url: 'https://didox.uz', loginUrl: 'https://app.didox.uz', category: 'ЭДО' },
  { id: 'faktura', label: 'Faktura: Счета-фактуры', url: 'https://faktura.uz', loginUrl: 'https://app.faktura.uz', category: 'ЭДО' },
  { id: 'eimzo', label: 'E-Imzo: ЭЦП сервис', url: 'https://e-imzo.uz', category: 'ЭЦП' },
  { id: 'lex', label: 'Lex.uz: Законодательство', url: 'https://lex.uz', category: 'НПА' },
  { id: 'cbu', label: 'ЦБ РУз: Курсы и ставки', url: 'https://cbu.uz', category: 'ЦБ' },
  { id: 'mygov', label: 'ЕПИГУ: Госуслуги', url: 'https://my.gov.uz', loginUrl: 'https://my.gov.uz/ru/site/login', category: 'ЕПИГУ' },
  { id: 'kapital', label: 'Капиталбанк: Сайт и Клиент-банк', url: 'https://kapitalbank.uz', loginUrl: 'https://corporate.kapitalbank.uz', category: 'Банк' },
];

const LOCAL_STORAGE_KEY = 'bx_network_checker_custom_sites';

function loadSites(): PingTarget[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_SITES;
  } catch {
    return DEFAULT_SITES;
  }
}

function saveSites(sites: PingTarget[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sites));
}

async function pingUrl(url: string): Promise<{ ms: number; ok: boolean }> {
  const start = performance.now();
  try {
    // В Electron HEAD запрос на внешние домены с no-cors работает отлично,
    // так как нет CORS-ограничений в основном процессе или с отключенным webSecurity.
    // Если CORS мешает, fetch переключится на no-cors, выдавая непрозрачный ответ,
    // но событие HEAD все равно доходит до сервера, подтверждая его работоспособность.
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    return { ms: Math.round(performance.now() - start), ok: true };
  } catch {
    return { ms: -1, ok: false };
  }
}

function StatusIndicator({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 inline-block animate-pulse" />;
  if (ok) return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.4)]" />;
  return <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-[0_0_8px_rgba(239,68,68,0.4)]" />;
}

function msColor(ms: number | null, ok: boolean | null) {
  if (ok === false || ms === -1) return 'text-red-500 font-bold';
  if (ms === null) return 'text-bx-muted';
  if (ms < 500) return 'text-emerald-500 font-semibold';
  if (ms < 1500) return 'text-amber-500 font-semibold';
  return 'text-red-400';
}

export default function NetworkChecker() {
  const toast = useToast();
  const [state, setState] = useState<'idle' | 'checking' | 'done'>('idle');
  const [targets, setTargets] = useState<PingTarget[]>(() => loadSites());
  const [results, setResults] = useState<TestResult[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  // Форма добавления
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('Банк');
  const [newUrl, setNewUrl] = useState('');
  const [newLoginUrl, setNewLoginUrl] = useState('');

  // Инициализация при изменении списка сайтов
  useEffect(() => {
    setResults(targets.map(t => ({
      id: t.id,
      label: t.label,
      category: t.category,
      url: t.url,
      urlOk: null,
      urlMs: null,
      loginUrl: t.loginUrl,
      loginOk: null,
      loginMs: null,
    })));
  }, [targets]);

  async function check() {
    setState('checking');
    const fresh: TestResult[] = targets.map(t => ({
      id: t.id,
      label: t.label,
      category: t.category,
      url: t.url,
      urlOk: null,
      urlMs: null,
      loginUrl: t.loginUrl,
      loginOk: null,
      loginMs: null,
    }));
    setResults([...fresh]);

    await Promise.all(
      targets.map(async (site, idx) => {
        // Проверяем основной URL
        const main = await pingUrl(site.url);
        fresh[idx].urlOk = main.ok;
        fresh[idx].urlMs = main.ms;
        setResults([...fresh]);

        // Проверяем страницу логина если есть
        if (site.loginUrl) {
          const login = await pingUrl(site.loginUrl);
          fresh[idx].loginOk = login.ok;
          fresh[idx].loginMs = login.ms;
          setResults([...fresh]);
        }
      })
    );
    setState('done');
  }

  // Автозапуск
  const ranOnce = useRef(false);
  useEffect(() => {
    if (!ranOnce.current) { ranOnce.current = true; check(); }
  }, [targets]);

  const handleAddSite = () => {
    if (!newLabel.trim() || !newUrl.trim()) {
      toast.error('Название и основной URL обязательны для заполнения');
      return;
    }
    const cleanUrl = newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`;
    const cleanLoginUrl = newLoginUrl.trim() 
      ? (newLoginUrl.trim().startsWith('http') ? newLoginUrl.trim() : `https://${newLoginUrl.trim()}`)
      : undefined;

    const newTarget: PingTarget = {
      id: uid(),
      label: newLabel.trim(),
      category: newCategory,
      url: cleanUrl,
      loginUrl: cleanLoginUrl,
    };

    const updated = [...targets, newTarget];
    setTargets(updated);
    saveSites(updated);
    
    // Сброс формы
    setNewLabel('');
    setNewUrl('');
    setNewLoginUrl('');
    toast.success('Сервис добавлен в список проверки');
  };

  const handleDeleteSite = (id: string) => {
    const target = targets.find(item => item.id === id);
    if (!target) return;
    const updated = targets.filter(t => t.id !== id);
    setTargets(updated);
    saveSites(updated);
    toast.undo('Сервис удалён из мониторинга', () => {
      const restored = [...updated, target];
      setTargets(restored);
      saveSites(restored);
    });
  };

  const handleResetToDefault = () => {
    const previous = targets;
    setTargets(DEFAULT_SITES);
    saveSites(DEFAULT_SITES);
    toast.undo('Исходный список восстановлен', () => {
      setTargets(previous);
      saveSites(previous);
    });
  };

  const failedCount = results.filter(r => r.urlOk === false || (r.loginUrl && r.loginOk === false)).length;

  return (
    <>
    <div className="space-y-4 text-bx-text text-xs font-sans">
      
      {/* Шапка проверки сети */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <p className="font-extrabold text-bx-text text-xs flex items-center gap-1.5">
            📶 Мониторинг доступности ресурсов РУз
          </p>
          <p className="text-[10px] text-bx-muted leading-relaxed">
            Показывает доступность как информационных сайтов, так и порталов входа (клиент-банк)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 border text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
              showConfig 
                ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400' 
                : 'border-bx-border hover:bg-bx-surface-2 bg-bx-surface'
            }`}
          >
            ⚙️ {showConfig ? 'Назад к пингу' : 'Управление'}
          </button>
          <button
            onClick={check}
            disabled={state === 'checking'}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer flex-shrink-0"
          >
            {state === 'checking' ? 'Проверяю...' : 'Перепроверить все'}
          </button>
        </div>
      </div>

      {!showConfig ? (
        <>
          {/* Сводный статус */}
          {state === 'done' && (
            <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-semibold ${
              failedCount === 0 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
            }`}>
              <span>{failedCount === 0 ? '✓' : '⚠'}</span>
              <span>
                {failedCount === 0 
                  ? 'Все проверяемые страницы и шлюзы авторизации доступны' 
                  : `Обнаружены проблемы с доступностью ресурсов (недоступно: ${failedCount})`}
              </span>
            </div>
          )}

          {/* Список результатов */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {results.map(r => {
              const mainFail = r.urlOk === false;
              const loginFail = r.loginUrl && r.loginOk === false;
              const hasAlert = mainFail || loginFail;

              return (
                <div 
                  key={r.id} 
                  className={`border rounded-2xl p-3.5 space-y-2.5 transition-all ${
                    hasAlert 
                      ? 'border-red-500/20 bg-red-500/5 dark:bg-red-500/5 shadow-md shadow-red-500/5' 
                      : 'border-bx-border bg-bx-surface-2/10 hover:border-bx-border/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-bx-border/30 pb-1.5">
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs truncate leading-snug">{r.label}</p>
                      <p className="text-[9px] text-bx-muted font-bold mt-0.5 uppercase tracking-wider">{r.category}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[10.5px]">
                    {/* Главная страница */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-bx-muted truncate flex items-center gap-1.5">
                        <StatusIndicator ok={r.urlOk} />
                        Инфо-сайт
                      </span>
                      <span className={`font-mono text-[10px] ${msColor(r.urlMs, r.urlOk)}`}>
                        {r.urlOk === null ? 'ожидание...' : (r.urlOk ? `${r.urlMs} мс` : 'недоступен')}
                      </span>
                    </div>

                    {/* Страница логина */}
                    {r.loginUrl && (
                      <div className="flex items-center justify-between gap-3 border-t border-bx-border/10 pt-1.5">
                        <span className="text-bx-muted truncate flex items-center gap-1.5">
                          <StatusIndicator ok={r.loginOk} />
                          <b>Вход / API шлюз</b>
                        </span>
                        <span className={`font-mono text-[10px] ${msColor(r.loginMs, r.loginOk)}`}>
                          {r.loginOk === null ? 'ожидание...' : (r.loginOk ? `${r.loginMs} мс` : 'недоступен')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Локальная админка управления */
        <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-bx-border pb-2.5">
            <span className="font-black text-xs uppercase text-blue-600 dark:text-blue-400">Управление сайтами проверки</span>
            <button 
              onClick={handleResetToDefault}
              className="text-[10px] text-red-500 hover:text-red-600 hover:underline font-bold"
            >
              Сбросить к исходным
            </button>
          </div>

          {/* Форма добавления */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-bx-surface-2/30 p-4 rounded-2xl border border-bx-border/50">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">Название сервиса</label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Например: Капиталбанк"
                className="w-full bg-bx-surface text-bx-text text-xs p-2 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">Категория</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full bg-bx-surface text-bx-text text-xs p-2 rounded-xl border border-bx-border focus:outline-none"
              >
                <option value="Банк">Банк</option>
                <option value="ГНК">ГНК (Налоги)</option>
                <option value="ЭДО">ЭДО (Документы)</option>
                <option value="ЦБ">Центральный банк</option>
                <option value="Госорганы">Госорганы</option>
                <option value="Другое">Другое</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">Основной URL (Сайт)</label>
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://kapitalbank.uz"
                className="w-full bg-bx-surface text-bx-text text-xs p-2 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">URL страницы Входа / API (Опционально)</label>
              <input
                type="text"
                value={newLoginUrl}
                onChange={e => setNewLoginUrl(e.target.value)}
                placeholder="https://corporate.kapitalbank.uz"
                className="w-full bg-bx-surface text-bx-text text-xs p-2 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <button
              onClick={handleAddSite}
              className="md:col-span-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md mt-1 cursor-pointer"
            >
              ＋ Добавить в список мониторинга
            </button>
          </div>

          {/* Список текущих сайтов */}
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
            <span className="text-[9px] font-bold text-bx-muted uppercase tracking-wider block mb-1">Список отслеживаемых ресурсов ({targets.length})</span>
            {targets.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-bx-surface-2/30 border border-bx-border/30 rounded-xl">
                <div className="min-w-0">
                  <span className="text-xs font-bold">{t.label}</span>
                  <span className="text-[9px] text-bx-muted font-bold ml-2 uppercase bg-bx-surface px-1.5 py-0.5 rounded-md">{t.category}</span>
                  <p className="text-[9.5px] text-bx-muted mt-0.5 truncate leading-none">
                    Сайт: {t.url} {t.loginUrl ? `· Вход: ${t.loginUrl}` : ''}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteSite(t.id)}
                  className="p-1.5 text-bx-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Удалить из мониторинга"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
    </>
  );
}

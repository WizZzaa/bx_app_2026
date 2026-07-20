import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uid } from '../lib/uid';
import { todayISO } from '../lib/dates';
import { loadEcpKeys, saveEcpKeys, EcpKeyRecord } from '../lib/ecpStorage';
import { ECP_EXPIRY_CHECKPOINTS, ECP_PRODUCT_BOUNDARY } from '../lib/ecpProductBoundary';
import Icon from '../lib/ui/Icon';

type EcpKey = EcpKeyRecord;

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const days = daysUntil(expiresAt);
  if (days < 0) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">Истек {Math.abs(days)} дн. назад</span>;
  }
  if (days <= 7) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">⚠ Истекает через {days} дн.</span>;
  }
  if (days <= 30) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">⏰ {days} дн. осталось</span>;
  }
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">🟢 {days} дн. активно</span>;
}

const EMPTY_FORM: Omit<EcpKey, 'id' | 'addedAt'> = {
  name: '',
  owner: '',
  inn: '',
  expiresAt: '',
  org: '',
  serial: '',
  fingerprint: '',
  validFrom: '',
};

export default function EcpManager() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState<EcpKey[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [pfxPassword, setPfxPassword] = useState('');
  const [pfxError, setPfxError] = useState<string | null>(null);
  const [pfxSuccess, setPfxSuccess] = useState(false);
  const [eimzoStatus, setEimzoStatus] = useState<'checking' | 'active' | 'missing'>('checking');

  const checkEimzo = async () => {
    setEimzoStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      await fetch('http://127.0.0.1:64443/', {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors'
      });
      clearTimeout(timeoutId);
      setEimzoStatus('active');
    } catch {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        await fetch('https://127.0.0.1:64443/', {
          method: 'GET',
          signal: controller.signal,
          mode: 'no-cors'
        });
        clearTimeout(timeoutId);
        setEimzoStatus('active');
      } catch {
        setEimzoStatus('missing');
      }
    }
  };

  useEffect(() => {
    loadEcpKeys().then(setKeys);
    checkEimzo();
  }, []);

  function persist(updated: EcpKey[]) {
    setKeys(updated);
    void saveEcpKeys(updated);
  }

  function startAdd() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setAdding(true);
    setPfxError(null);
    setPfxSuccess(false);
    setPfxPassword('');
  }

  function startEdit(k: EcpKey) {
    setForm({
      name: k.name,
      owner: k.owner,
      inn: k.inn,
      expiresAt: k.expiresAt,
      org: k.org ?? '',
      serial: k.serial ?? '',
      fingerprint: k.fingerprint ?? '',
      validFrom: k.validFrom ?? '',
    });
    setEditingId(k.id);
    setAdding(true);
    setPfxError(null);
    setPfxSuccess(false);
    setPfxPassword('');
  }

  const handleImportPfx = async () => {
    setPfxError(null);
    setPfxSuccess(false);
    try {
      const bx = window.bx;
      if (!bx || !bx.ecp) {
        setPfxError('Служба ЭЦП недоступна в данной версии.');
        return;
      }
      if (!pfxPassword) {
        setPfxError('Введите пароль от файла ключа. BX не сохраняет пароль.');
        return;
      }
      const fileHandle = await bx.ecp.pickPfx();
      if (!fileHandle) return;

      const password = pfxPassword;
      setPfxPassword('');
      const info = await bx.ecp.parsePfx(fileHandle, password);
      setForm({
        name: info.owner ? `Сертификат — ${info.owner.split(' ')[0]}` : 'Новый сертификат',
        owner: info.owner,
        inn: info.inn,
        expiresAt: info.expiresAt,
        org: info.org,
        serial: info.serial,
        fingerprint: info.fingerprint,
        validFrom: info.validFrom,
      });
      setPfxSuccess(true);
    } catch (error: unknown) {
      setPfxPassword('');
      setPfxError(error instanceof Error ? error.message : 'Не удалось прочитать метаданные сертификата. Проверьте пароль.');
    }
  };

  function save() {
    if (!form.name.trim() || !form.expiresAt) return;
    if (editingId) {
      persist(keys.map(k => k.id === editingId ? { ...k, ...form } : k));
    } else {
      const newKey: EcpKey = {
        id: uid(),
        ...form,
        addedAt: todayISO(),
      };
      persist([...keys, newKey]);
    }
    setAdding(false);
    setEditingId(null);
  }

  function remove(id: string) {
    if (confirm('Удалить запись сертификата из мониторинга? Файл ключа это действие не затрагивает.')) {
      persist(keys.filter(k => k.id !== id));
    }
  }

  const expiredCount = keys.filter(k => daysUntil(k.expiresAt) < 0).length;
  const urgentCount = keys.filter(k => {
    const days = daysUntil(k.expiresAt);
    return days >= 0 && days <= 14;
  }).length;
  const attentionCount = expiredCount + urgentCount;
  const sorted = [...keys].sort((a, b) => daysUntil(a.expiresAt) - daysUntil(b.expiresAt));

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-bx-bg text-bx-text font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔑</span>
            <div>
              <h1 className="text-base font-extrabold text-bx-text uppercase tracking-wider">Мониторинг сертификатов ЭЦП</h1>
              <p className="text-xs text-bx-muted mt-0.5">Безопасные метаданные, сроки действия и готовность E-Imzo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={checkEimzo} className="px-3 py-2 border border-bx-border-2 hover:bg-bx-surface-2 text-bx-text text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm">
              🔄 Перепроверить
            </button>
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer"
            >
              ＋ Добавить сертификат
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] px-5 py-4 text-xs leading-relaxed text-bx-muted shadow-sm">
          <Icon name="shield" className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
          <p><strong className="text-bx-text">Что делает BX:</strong> {ECP_PRODUCT_BOUNDARY}</p>
        </div>

        {/* Статус E-Imzo */}
        {eimzoStatus === 'checking' && (
          <div className="text-xs text-bx-muted bg-bx-surface border border-bx-border rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-sm">
            <span className="animate-spin text-sm">⏳</span> Проверка локальной службы E-Imzo (порт 64443)...
          </div>
        )}
        {eimzoStatus === 'active' && (
          <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-sm">
            <span>🟢</span> <b>E-Imzo доступен на ПК:</b> официальные порталы смогут использовать локальную службу. BX подписание не запускает.
          </div>
        )}
        {eimzoStatus === 'missing' && (
          <div className="text-xs text-red-700 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5 shadow-sm">
            <span className="text-sm mt-0.5">🔴</span>
            <div>
              <p className="font-extrabold">Локальная служба E-Imzo не запущена</p>
              <p className="text-bx-muted mt-1 leading-relaxed">
                Для успешного входа в кабинет налогоплательщика или ЕГРД убедитесь, что приложение <b>E-Imzo</b> запущено в панели задач на компьютере.
              </p>
            </div>
          </div>
        )}

        {/* Предупреждение о скором окончании действия сертификатов */}
        {attentionCount > 0 && (
          <div className="flex items-start gap-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 shadow-sm">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                Требуют внимания: {attentionCount} {attentionCount === 1 ? 'сертификат' : 'сертификата'}
              </p>
              <p className="text-xs text-bx-muted mt-1 leading-relaxed">
                {expiredCount > 0 && <>Истекли: {expiredCount}. </>}
                {urgentCount > 0 && <>Истекают в ближайшие 14 дней: {urgentCount}. </>}
                BX напоминает на отметках {ECP_EXPIRY_CHECKPOINTS.join(', ')} день до окончания.
              </p>
            </div>
          </div>
        )}

        {/* Форма добавления/редактирования */}
        {adding && (
          <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">
              {editingId ? '✏️ Редактирование метаданных' : '⚡ Добавление сертификата в мониторинг'}
            </h3>
            
            {/* Быстрый импорт из .pfx */}
            {!editingId && (
              <div className="bg-bx-surface-2 border border-bx-border rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-bx-text">Локально прочитать метаданные из .pfx / .p12</p>
                <div className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="password"
                      value={pfxPassword}
                      onChange={e => setPfxPassword(e.target.value)}
                      placeholder="Пароль от файла ключа"
                      autoComplete="new-password"
                      className="w-full bg-bx-surface text-bx-text text-xs px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleImportPfx}
                    className="px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs rounded-xl transition-all border border-blue-500/20 font-bold cursor-pointer"
                  >
                    Выбрать .pfx / .p12
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed text-bx-muted">Файл не копируется и не отправляется. Пароль используется один раз только для чтения разрешённых метаданных и сразу очищается.</p>
                {pfxError && <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">{pfxError}</p>}
                {pfxSuccess && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Безопасные метаданные сертификата заполнены.</p>}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Понятное название сертификата *</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="например, «Альфа ООО — Директор» или «Личный ИП»"
                  className="w-full bg-bx-surface-2 text-bx-text text-xs px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Владелец сертификата (ФИО)</label>
                <input
                  value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  placeholder="Иванов Иван Иванович"
                  className="w-full bg-bx-surface-2 text-bx-text text-xs px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">ИНН владельца / компании</label>
                <input
                  value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                  placeholder="9 или 12 цифр"
                  className="w-full bg-bx-surface-2 text-bx-text text-xs px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Наименование организации</label>
                <input
                  value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
                  placeholder="ООО ALFA BUSINESS"
                  className="w-full bg-bx-surface-2 text-bx-text text-xs px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Истекает (Дата окончания) *</label>
                <input
                  type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full bg-bx-surface-2 text-bx-text text-xs px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 font-bold"
                />
              </div>
              {(form.serial || form.fingerprint || form.validFrom) && (
                <div className="sm:col-span-2 rounded-xl border border-bx-border bg-bx-surface-2 px-3.5 py-3 text-[10px] text-bx-muted">
                  <p className="font-bold text-bx-text">Метаданные из сертификата</p>
                  {form.validFrom && <p className="mt-1">Действует с: {new Date(form.validFrom).toLocaleDateString('ru-RU')}</p>}
                  {form.serial && <p className="mt-1 break-all font-mono">Серийный номер: {form.serial}</p>}
                  {form.fingerprint && <p className="mt-1 break-all font-mono">SHA-256: {form.fingerprint}</p>}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-bx-border">
              <button onClick={save} disabled={!form.name.trim() || !form.expiresAt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer">
                {editingId ? 'Сохранить изменения' : 'Добавить в мониторинг'}
              </button>
              <button onClick={() => { setAdding(false); setEditingId(null); }}
                className="px-4 py-2 bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text text-xs font-bold rounded-xl transition-all cursor-pointer">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список сертификатов */}
        {sorted.length === 0 && !adding ? (
          <div className="bg-bx-surface border border-bx-border rounded-2xl p-12 text-center text-bx-muted shadow-sm">
            <div className="text-4xl mb-3">🔑</div>
            <p className="text-sm font-bold text-bx-text">Сертификаты не добавлены</p>
            <p className="text-xs mt-1 max-w-sm mx-auto leading-relaxed">
              Добавьте только метаданные и срок действия сертификата. Файл ключа и пароль BX не хранит; напоминания появятся за 30, 14, 7 и 1 день.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map(k => {
              const days = daysUntil(k.expiresAt);
              const expired = days < 0;
              return (
                <div key={k.id}
                  className={`rounded-2xl border p-4.5 transition-colors shadow-sm flex flex-col justify-between ${expired ? 'border-red-500/30 bg-red-500/[0.02]' : days <= 14 ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-bx-border bg-bx-surface'}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xs font-extrabold text-bx-text leading-snug">{k.name}</h4>
                      <ExpiryBadge expiresAt={k.expiresAt} />
                    </div>

                    <div className="text-[11px] text-bx-muted space-y-1">
                      {k.owner && <p className="text-bx-text font-bold">👤 {k.owner}</p>}
                      {k.org && <p className="truncate font-semibold">🏢 {k.org}</p>}
                      {k.inn && <p className="font-mono">💼 ИНН: {k.inn}</p>}
                      {k.serial && <p className="truncate font-mono" title={k.serial}>№ {k.serial}</p>}
                      {k.fingerprint && <p className="truncate font-mono" title={k.fingerprint}>SHA-256: {k.fingerprint}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-bx-border/50 pt-3 mt-4 text-[10px] text-bx-muted">
                    <span className="font-medium">Действует до: {new Date(k.expiresAt).toLocaleDateString('ru-RU')}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(k)}
                        className="p-1 text-bx-muted hover:text-bx-text bg-bx-surface-2 rounded-lg border border-bx-border transition-colors cursor-pointer" title="Редактировать">
                        ✏️
                      </button>
                      <button onClick={() => remove(k.id)}
                        className="p-1 text-red-500/80 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-lg border border-red-500/10 transition-colors cursor-pointer" title="Удалить">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bx-border bg-bx-surface px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-black text-bx-text">Как установить или обновить E-Imzo</p>
            <p className="mt-1 text-[11px] text-bx-muted">Пошаговая инструкция находится в Базе знаний и ведёт только на официальные ресурсы.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/knowledge?article=eimzo-setup')}
            className="rounded-xl border border-bx-border bg-bx-surface-2 px-3.5 py-2 text-xs font-bold text-bx-text transition-colors hover:border-blue-500/30 hover:text-blue-600"
          >
            Открыть инструкцию →
          </button>
        </div>
      </div>
    </div>
  );
}

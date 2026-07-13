import React, { useState, useEffect } from 'react';
import { uid } from '../lib/uid';
import { todayISO } from '../lib/dates';
import { loadEcpKeys, saveEcpKeys, EcpKeyRecord } from '../lib/ecpStorage';
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
};

export default function EcpManager() {
  const [keys, setKeys] = useState<EcpKey[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [pfxPassword, setPfxPassword] = useState('123456');
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
  }

  function startEdit(k: EcpKey) {
    setForm({ name: k.name, owner: k.owner, inn: k.inn, expiresAt: k.expiresAt, org: k.org ?? '' });
    setEditingId(k.id);
    setAdding(true);
    setPfxError(null);
    setPfxSuccess(false);
  }

  const handleImportPfx = async () => {
    setPfxError(null);
    setPfxSuccess(false);
    try {
      const bx = (window as any).bx;
      if (!bx || !bx.ecp) {
        setPfxError('Служба ЭЦП недоступна в данной версии.');
        return;
      }
      const filePath = await bx.ecp.pickPfx();
      if (!filePath) return;

      const info = await bx.ecp.parsePfx(filePath, pfxPassword);
      setForm({
        name: info.owner ? `ЭЦП — ${info.owner.split(' ')[0]}` : 'Новый ключ',
        owner: info.owner,
        inn: info.inn,
        expiresAt: info.expiresAt,
        org: info.org
      });
      setPfxSuccess(true);
    } catch (e: any) {
      setPfxError(e?.message || 'Не удалось импортировать ключ. Проверьте пароль.');
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
    if (confirm('Вы уверены, что хотите удалить этот ключ из мониторинга?')) {
      persist(keys.filter(k => k.id !== id));
    }
  }

  const urgentCount = keys.filter(k => daysUntil(k.expiresAt) <= 14).length;
  const sorted = [...keys].sort((a, b) => daysUntil(a.expiresAt) - daysUntil(b.expiresAt));

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-bx-bg text-bx-text font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔑</span>
            <div>
              <h1 className="text-base font-extrabold text-bx-text uppercase tracking-wider">Менеджер ключей ЭЦП</h1>
              <p className="text-xs text-bx-muted mt-0.5">Контроль сроков действия и мониторинг готовности E-Imzo</p>
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
              ＋ Добавить ЭЦП
            </button>
          </div>
        </div>

        {/* Статус E-Imzo */}
        {eimzoStatus === 'checking' && (
          <div className="text-xs text-bx-muted bg-bx-surface border border-bx-border rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-sm">
            <span className="animate-spin text-sm">⏳</span> Проверка локальной службы E-Imzo (порт 64443)...
          </div>
        )}
        {eimzoStatus === 'active' && (
          <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-sm">
            <span>🟢</span> <b>Модуль E-Imzo запущен на ПК:</b> Готов к работе с государственными порталами Узбекистана.
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

        {/* Предупреждение о скором окончании действия ключей */}
        {urgentCount > 0 && (
          <div className="flex items-start gap-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 shadow-sm">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                Внимание: {urgentCount === 1 ? '1 ключ истекает' : `${urgentCount} ключа истекают`} в ближайшие 14 дней
              </p>
              <p className="text-xs text-bx-muted mt-1 leading-relaxed">
                Своевременно обновите ключи через портал гос. услуг my.gov.uz или обратитесь лично в ЦЭКТТ во избежание сбоев в отправке бухгалтерской отчетности.
              </p>
            </div>
          </div>
        )}

        {/* Форма добавления/редактирования */}
        {adding && (
          <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">
              {editingId ? '✏️ Редактирование ключа' : '⚡ Добавление ключа в реестр'}
            </h3>
            
            {/* Быстрый импорт из .pfx */}
            {!editingId && (
              <div className="bg-bx-surface-2 border border-bx-border rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-bx-text">Автозаполнение из файла ключа (.pfx / .p12)</p>
                <div className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="password"
                      value={pfxPassword}
                      onChange={e => setPfxPassword(e.target.value)}
                      placeholder="Пароль от ключа (по умолчанию 123456)"
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
                {pfxError && <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">{pfxError}</p>}
                {pfxSuccess && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Данные ключа успешно извлечены и заполнены!</p>}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Понятное название ключа *</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="например, «Альфа ООО — Директор» или «Личный ИП»"
                  className="w-full bg-bx-surface-2 text-bx-text text-xs px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-bx-muted uppercase tracking-wider mb-1.5">Владелец ключа (ФИО)</label>
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
            </div>

            <div className="flex gap-2 pt-2 border-t border-bx-border">
              <button onClick={save} disabled={!form.name.trim() || !form.expiresAt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer">
                {editingId ? 'Сохранить изменения' : 'Добавить ЭЦП'}
              </button>
              <button onClick={() => { setAdding(false); setEditingId(null); }}
                className="px-4 py-2 bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text text-xs font-bold rounded-xl transition-all cursor-pointer">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список ключей */}
        {sorted.length === 0 && !adding ? (
          <div className="bg-bx-surface border border-bx-border rounded-2xl p-12 text-center text-bx-muted shadow-sm">
            <div className="text-4xl mb-3">🔑</div>
            <p className="text-sm font-bold text-bx-text">Список ключей пуст</p>
            <p className="text-xs mt-1 max-w-sm mx-auto leading-relaxed">
              Добавьте ИНН и сроки действия ваших ЭЦП. BX Помощник будет автоматически предупреждать вас за 30 дней до дедлайна, чтобы вы успели перевыпустить ключ.
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

        {/* Руководство по получению/продлению */}
        <RenewalGuide />
      </div>
    </div>
  );
}

function openLink(url: string) {
  if (typeof window !== 'undefined' && (window as any).bx?.shell?.openExternal) {
    (window as any).bx.shell.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function LinkBtn({ url, label }: { url: string; label: string }) {
  return (
    <button
      onClick={() => openLink(url)}
      className="px-3.5 py-2 border border-bx-border bg-bx-surface hover:bg-bx-surface-2 text-bx-text hover:text-blue-500 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
    >
      {label} ↗
    </button>
  );
}

function RenewalGuide() {
  const [tab, setTab] = React.useState<'online' | 'offline'>('online');

  return (
    <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-bx-border flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-black text-bx-text uppercase tracking-wider flex items-center gap-2">
          <span>🛡️</span> Инструкция: как обновить ЭЦП
        </p>
        <div className="flex bg-bx-surface-2 border border-bx-border rounded-xl p-0.5">
          <button onClick={() => setTab('online')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${tab === 'online' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
            Онлайн (my.gov.uz)
          </button>
          <button onClick={() => setTab('offline')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${tab === 'offline' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
            В офисе ЦЭКТТ
          </button>
        </div>
      </div>

      {tab === 'online' && (
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => openLink('https://my.gov.uz')}
              className="flex items-center gap-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-xl px-4 py-3 transition-colors text-left cursor-pointer">
              <span className="text-2xl">🏛️</span>
              <div>
                <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400">my.gov.uz</p>
                <p className="text-[10px] text-bx-muted mt-0.5">Единый портал гос. услуг</p>
              </div>
            </button>
            <button onClick={() => openLink('https://e-imzo.uz')}
              className="flex items-center gap-3 bg-bx-surface-2 hover:bg-bx-surface-2/65 border border-bx-border rounded-xl px-4 py-3 transition-colors text-left cursor-pointer">
              <span className="text-2xl">🔑</span>
              <div>
                <p className="text-xs font-extrabold text-bx-text">e-imzo.uz</p>
                <p className="text-[10px] text-bx-muted mt-0.5">Официальный дистрибьютор E-Imzo</p>
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-bx-text">Шаги для онлайн перевыпуска:</p>
            {[
              { n: '1', text: 'Авторизуйтесь на портале my.gov.uz через систему OneID.' },
              { n: '2', text: 'Найдите услугу «Получить ключ электронной цифровой подписи».' },
              { n: '3', text: 'Выберите тип владельца (Физическое лицо / Индивидуальный предприниматель).' },
              { n: '4', text: 'Пройдите биометрическую идентификацию Face-ID с мобильного или веб-камеры.' },
              { n: '5', text: 'Оплатите пошлину (для ИП бесплатно), задайте пароль и скачайте файл ключа (.pfx).' },
              { n: '6', text: 'Запустите E-Imzo на компьютере, перейдите в «Установка ключей» и импортируйте файл.' },
            ].map(s => (
              <div key={s.n} className="flex gap-3">
                <span className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">{s.n}</span>
                <p className="text-xs text-bx-muted leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-bx-surface-2 border border-bx-border rounded-xl p-3.5 space-y-1.5 text-[11px] text-bx-muted shadow-inner">
            <p><span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Срок действия ключа:</span> ровно 2 года со дня выпуска.</p>
            <p><span className="text-blue-600 dark:text-blue-400 font-bold">⏱ Время оформления:</span> 5-10 минут при готовой OneID биометрии.</p>
          </div>
        </div>
      )}

      {tab === 'offline' && (
        <div className="px-5 py-5 space-y-4">
          <button onClick={() => openLink('https://e-imzo.uz')}
            className="w-full flex items-center gap-3 bg-bx-surface-2 hover:bg-bx-surface-2/65 border border-bx-border rounded-xl px-4 py-3 transition-colors text-left cursor-pointer">
            <span className="text-2xl">🏢</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-bx-text">Городские и областные отделения ЦЭКТТ</p>
              <p className="text-[10px] text-bx-muted mt-0.5">Адреса и контакты операторов E-Imzo во всех регионах РУз</p>
            </div>
            <span className="text-xs text-blue-500 ml-auto">↗</span>
          </button>

          <div className="space-y-3">
            <p className="text-xs font-bold text-bx-text">Что необходимо иметь с собой:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { icon: '🪪', label: 'Оригинал паспорта / ID-карты', sub: 'для сверки биометрии' },
                { icon: '📁', label: 'Свидетельство (гувохнома)', sub: 'для юрлиц и ИП' },
                { icon: '💾', label: 'Флеш-накопитель (USB)', sub: 'для записи файла ключа' },
                { icon: '💳', label: 'Средства оплаты', sub: 'терминал/перечисление' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2.5 bg-bx-surface-2 border border-bx-border rounded-xl px-3.5 py-2.5">
                  <span className="text-xl flex-shrink-0">{d.icon}</span>
                  <div>
                    <p className="font-bold text-bx-text leading-tight">{d.label}</p>
                    <p className="text-[10px] text-bx-muted mt-0.5">{d.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-bx-text">Порядок оформления в центре:</p>
            {[
              { n: '1', text: 'Посетите отделение ЦЭКТТ вашего района/города.' },
              { n: '2', text: 'Заполните бумажную анкету-заявление у администратора.' },
              { n: '3', text: 'Предоставьте оригиналы документов оператору для оцифровки.' },
              { n: '4', text: 'Оплатите пошлину согласно прайс-листу ГНК.' },
              { n: '5', text: 'Получите готовый файл .PFX на флешку и сохраните его резервную копию.' },
            ].map(s => (
              <div key={s.n} className="flex gap-3">
                <span className="w-5 h-5 rounded-lg bg-bx-surface-2 border border-bx-border text-bx-muted text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                <p className="text-xs text-bx-muted leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Быстрые ссылки */}
      <div className="px-5 py-3 border-t border-bx-border flex flex-wrap gap-2.5 bg-bx-surface-2/20">
        <LinkBtn url="https://my.gov.uz" label="my.gov.uz" />
        <LinkBtn url="https://e-imzo.uz" label="e-imzo.uz" />
        <LinkBtn url="https://e-imzo.uz/main/downloads/" label="Скачать плагин E-Imzo" />
        <LinkBtn url="https://soliq.uz" label="Soliq.uz" />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { uid } from '../lib/uid';
import { todayISO } from '../lib/dates';
import { loadEcpKeys, saveEcpKeys, EcpKeyRecord } from '../lib/ecpStorage';

type EcpKey = EcpKeyRecord;

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const days = daysUntil(expiresAt);
  if (days < 0) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">Истёк {Math.abs(days)} дн. назад</span>;
  if (days <= 7) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">⚠ Осталось {days} дн.</span>;
  if (days <= 14) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">⏰ Осталось {days} дн.</span>;
  if (days <= 30) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">{days} дн.</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{days} дн.</span>;
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
  const [pfxPassword, setPfxPassword] = useState('123456')
  const [pfxError, setPfxError] = useState<string | null>(null)
  const [pfxSuccess, setPfxSuccess] = useState(false)
  const [eimzoStatus, setEimzoStatus] = useState<'checking' | 'active' | 'missing'>('checking')

  const checkEimzo = async () => {
    setEimzoStatus('checking')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500)
      await fetch('http://127.0.0.1:64443/', {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors'
      })
      clearTimeout(timeoutId)
      setEimzoStatus('active')
    } catch {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1500)
        await fetch('https://127.0.0.1:64443/', {
          method: 'GET',
          signal: controller.signal,
          mode: 'no-cors'
        })
        clearTimeout(timeoutId)
        setEimzoStatus('active')
      } catch {
        setEimzoStatus('missing')
      }
    }
  }

  useEffect(() => {
    loadEcpKeys().then(setKeys);
    checkEimzo()
  }, []);

  function persist(updated: EcpKey[]) {
    setKeys(updated);
    void saveEcpKeys(updated);
  }

  function startAdd() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setAdding(true);
    setPfxError(null)
    setPfxSuccess(false)
  }

  function startEdit(k: EcpKey) {
    setForm({ name: k.name, owner: k.owner, inn: k.inn, expiresAt: k.expiresAt, org: k.org ?? '' });
    setEditingId(k.id);
    setAdding(true);
    setPfxError(null)
    setPfxSuccess(false)
  }

  const handleImportPfx = async () => {
    setPfxError(null)
    setPfxSuccess(false)
    try {
      const bx = (window as any).bx
      if (!bx || !bx.ecp) {
        setPfxError('Служба ЭЦП недоступна')
        return
      }
      const filePath = await bx.ecp.pickPfx()
      if (!filePath) return

      const info = await bx.ecp.parsePfx(filePath, pfxPassword)
      setForm({
        name: info.owner ? `ЭЦП — ${info.owner.split(' ')[0]}` : 'Новый ключ',
        owner: info.owner,
        inn: info.inn,
        expiresAt: info.expiresAt,
        org: info.org
      })
      setPfxSuccess(true)
    } catch (e: any) {
      setPfxError(e?.message || 'Не удалось импортировать ключ')
    }
  }

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
    persist(keys.filter(k => k.id !== id));
  }

  const urgentCount = keys.filter(k => daysUntil(k.expiresAt) <= 14).length;

  const sorted = [...keys].sort((a, b) => daysUntil(a.expiresAt) - daysUntil(b.expiresAt));

  const [mainTab, setMainTab] = React.useState<'keys' | 'sign' | 'verify'>('keys')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Заголовок */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-bx-text">Менеджер ЭЦП</h1>
            <p className="text-sm text-bx-muted mt-0.5">Ключи E-Imzo · Подписание документов · Верификация</p>
          </div>
          {mainTab === 'keys' && (
            <button
              onClick={startAdd}
              className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              + Добавить ключ
            </button>
          )}
        </div>

        {/* Вкладки */}
        <div className="flex bg-bx-bg border border-bx-border rounded-lg p-0.5 w-fit">
          {([['keys','🔑 Мои ключи'],['sign','✍ Подписать'],['verify','🔍 Проверить']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setMainTab(id)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${mainTab === id ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Автодиагностика E-Imzo */}
        {eimzoStatus === 'checking' && (
          <div className="text-xs text-bx-muted bg-bx-bg border border-bx-border rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="animate-spin text-sm">⏳</span> Диагностика подключения к модулю E-Imzo...
          </div>
        )}
        {eimzoStatus === 'active' && (
          <div className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <span>🟢</span> Модуль E-Imzo активен на порту 64443. Подписание доступно.
          </div>
        )}
        {eimzoStatus === 'missing' && (
          <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/25 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-sm">🔴</span>
            <div>
              <p className="font-bold text-red-400">Модуль E-Imzo не обнаружен на порту 64443</p>
              <p className="text-bx-muted mt-0.5">
                Для подписания отчетов убедитесь, что приложение <b>E-Imzo</b> запущено на вашем компьютере.
              </p>
            </div>
          </div>
        )}

        {/* Предупреждение */}
        {mainTab === 'keys' && urgentCount > 0 && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-400">
                {urgentCount === 1 ? '1 ключ истекает' : `${urgentCount} ключа истекают`} в ближайшие 14 дней
              </p>
              <p className="text-xs text-bx-muted mt-0.5">
                Обновите ключи через my.gov.uz или территориальный ЦЭКТТ
              </p>
            </div>
          </div>
        )}

        {/* Форма добавления/редактирования */}
        {mainTab === 'keys' && adding && (
          <div className="bg-bx-bg border border-bx-border-2 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-bx-text">
              {editingId ? 'Редактировать ключ' : 'Добавить ключ'}
            </h3>
            
            {/* Быстрый импорт из .pfx */}
            {!editingId && (
              <div className="bg-bx-surface border border-bx-border-2 rounded-lg p-3 space-y-2 mb-2">
                <p className="text-xs font-semibold text-bx-text">⚡ Быстрый импорт из файла ключа</p>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="password"
                      value={pfxPassword}
                      onChange={e => setPfxPassword(e.target.value)}
                      placeholder="Пароль от ключа (по умолчанию 123456)"
                      className="w-full bg-bx-bg text-bx-text text-xs px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleImportPfx}
                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-lg transition-colors border border-blue-500/20 font-medium"
                  >
                    Выбрать .pfx
                  </button>
                </div>
                {pfxError && <p className="text-[10px] text-red-400">{pfxError}</p>}
                {pfxSuccess && <p className="text-[10px] text-emerald-400">✓ Успешно импортировано! Данные заполнены автоматически.</p>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-bx-muted mb-1">Название ключа (понятное имя) *</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="напр. «ООО Альфа — Иванов И.И.»"
                  className="w-full bg-bx-surface text-bx-text text-sm px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-bx-muted mb-1">Владелец (ФИО)</label>
                <input
                  value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  placeholder="Иванов Иван Иванович"
                  className="w-full bg-bx-surface text-bx-text text-sm px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-bx-muted mb-1">ИНН организации/ИП</label>
                <input
                  value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                  placeholder="000000000"
                  className="w-full bg-bx-surface text-bx-text text-sm px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-bx-muted mb-1">Организация</label>
                <input
                  value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
                  placeholder="ООО Ромашка"
                  className="w-full bg-bx-surface text-bx-text text-sm px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-bx-muted mb-1">Срок действия *</label>
                <input
                  type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full bg-bx-surface text-bx-text text-sm px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={!form.name.trim() || !form.expiresAt}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              <button onClick={() => { setAdding(false); setEditingId(null); }}
                className="px-4 py-1.5 bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text text-sm rounded-lg transition-colors">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список ключей */}
        {sorted.length === 0 && !adding ? (
          <div className="text-center py-14 text-bx-muted">
            <div className="text-4xl mb-3">🔑</div>
            <p className="text-sm">Ключей пока нет</p>
            <p className="text-xs mt-1">Добавьте данные своих ЭЦП-сертификатов для мониторинга срока</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(k => {
              const days = daysUntil(k.expiresAt);
              const expired = days < 0;
              return (
                <div key={k.id}
                  className={`rounded-xl border p-4 transition-colors ${expired ? 'border-red-500/30 bg-red-500/5' : days <= 14 ? 'border-amber-500/30 bg-amber-500/5' : 'border-bx-border bg-bx-surface'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{expired ? '🔴' : days <= 14 ? '🟡' : '🟢'}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-bx-text">{k.name}</span>
                          <ExpiryBadge expiresAt={k.expiresAt} />
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {k.owner && <p className="text-xs text-bx-muted">{k.owner}</p>}
                          {k.org && <p className="text-xs text-bx-muted">{k.org}</p>}
                          <div className="flex items-center gap-3 text-[11px] text-bx-muted mt-1">
                            {k.inn && <span>ИНН: {k.inn}</span>}
                            <span>Истекает: {k.expiresAt}</span>
                            <span>Добавлен: {k.addedAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => startEdit(k)}
                        className="px-2.5 py-1.5 text-xs text-bx-muted hover:text-bx-text bg-bx-bg hover:bg-bx-surface-2 rounded-lg transition-colors">
                        ✏
                      </button>
                      <button onClick={() => remove(k.id)}
                        className="px-2.5 py-1.5 text-xs text-red-400/60 hover:text-red-400 bg-bx-bg hover:bg-red-500/10 rounded-lg transition-colors">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Инструкция получения ключа */}
        {mainTab === 'keys' && <RenewalGuide />}

        {/* Подписание документов */}
        {mainTab === 'sign' && <EcpSigner keys={keys} />}

        {/* Верификация подписи */}
        {mainTab === 'verify' && <EcpVerifier />}
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
      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors text-xs"
    >
      {label} ↗
    </button>
  );
}

function RenewalGuide() {
  const [tab, setTab] = React.useState<'online' | 'offline'>('online');

  return (
    <div className="border border-bx-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-bx-border flex items-center justify-between">
        <p className="text-sm font-medium text-bx-text">🔐 Как получить / обновить ЭЦП E-Imzo</p>
        <div className="flex gap-1 bg-bx-bg rounded-lg p-0.5">
          <button onClick={() => setTab('online')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${tab === 'online' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
            Онлайн
          </button>
          <button onClick={() => setTab('offline')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${tab === 'offline' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>
            Лично в ЦЭКТТ
          </button>
        </div>
      </div>

      {tab === 'online' && (
        <div className="px-4 py-4 space-y-4">
          {/* Быстрые ссылки */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => openLink('https://my.gov.uz')}
              className="flex items-center gap-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl px-3 py-2.5 transition-colors text-left">
              <span className="text-xl">🏛</span>
              <div>
                <p className="text-xs font-semibold text-blue-400">my.gov.uz</p>
                <p className="text-[10px] text-bx-muted">Единый портал гос. услуг</p>
              </div>
            </button>
            <button onClick={() => openLink('https://e-imzo.uz')}
              className="flex items-center gap-2.5 bg-bx-surface-2 hover:bg-bx-surface-2 border border-bx-border-2 rounded-xl px-3 py-2.5 transition-colors text-left">
              <span className="text-xl">🔑</span>
              <div>
                <p className="text-xs font-semibold text-bx-text">e-imzo.uz</p>
                <p className="text-[10px] text-bx-muted">Официальный сайт E-Imzo</p>
              </div>
            </button>
          </div>

          {/* Шаги */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-bx-muted">Пошаговая инструкция (my.gov.uz):</p>
            {[
              { n: '1', text: 'Откройте my.gov.uz → войдите через ID.UZ или одноразовый пароль на телефон' },
              { n: '2', text: 'Меню «Услуги» → поиск «Получить ЭЦП» (или раздел «Электронная подпись»)' },
              { n: '3', text: 'Выберите тип: для физлица (паспорт) или юрлица (свидетельство о рег.)' },
              { n: '4', text: 'Пройдите идентификацию: Face ID через камеру телефона или биометрия' },
              { n: '5', text: 'Скачайте файл ключа (.pfx или .p12) — сохраните в защищённое место' },
              { n: '6', text: 'Установите ключ в E-Imzo: панель задач → E-Imzo → «Добавить ключ» → выберите файл' },
            ].map(s => (
              <div key={s.n} className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                <p className="text-xs text-bx-muted leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-bx-bg rounded-lg px-3 py-2.5 space-y-1">
            <p className="text-[11px] text-bx-muted">
              <span className="text-emerald-400 font-medium">✓ Бесплатно</span> для физлиц и ИП
            </p>
            <p className="text-[11px] text-bx-muted">
              <span className="text-blue-400 font-medium">⏱ Срок:</span> 2 года с момента выпуска
            </p>
            <p className="text-[11px] text-bx-muted">
              <span className="text-amber-400 font-medium">⚠ Важно:</span> обновляйте за 30 дней до истечения — в период налоговой отчётности могут быть очереди
            </p>
          </div>
        </div>
      )}

      {tab === 'offline' && (
        <div className="px-4 py-4 space-y-4">
          {/* Ссылка на ЦЭКТТ */}
          <button onClick={() => openLink('https://cektт.uz')}
            className="w-full flex items-center gap-2.5 bg-bx-surface-2 hover:bg-bx-surface-2 border border-bx-border-2 rounded-xl px-3 py-2.5 transition-colors text-left">
            <span className="text-xl">🏢</span>
            <div>
              <p className="text-xs font-semibold text-bx-text">ЦЭКТТ — Центр электронного ключа</p>
              <p className="text-[10px] text-bx-muted">Отделения во всех областях Узбекистана</p>
            </div>
            <span className="ml-auto text-xs text-blue-400">↗</span>
          </button>

          {/* Что взять */}
          <div>
            <p className="text-xs font-semibold text-bx-muted mb-2">Что взять с собой:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '🪪', label: 'Паспорт', sub: 'оригинал' },
                { icon: '📄', label: 'Свидетельство о рег.', sub: 'для юрлиц/ИП' },
                { icon: '💻', label: 'Флешка или ноутбук', sub: 'для записи ключа' },
                { icon: '💳', label: 'Оплата', sub: 'для юрлиц по прайсу' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2 bg-bx-bg rounded-lg px-2.5 py-2">
                  <span className="text-base">{d.icon}</span>
                  <div>
                    <p className="text-xs text-bx-text leading-tight">{d.label}</p>
                    <p className="text-[10px] text-bx-muted">{d.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Шаги */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-bx-muted">Порядок действий:</p>
            {[
              { n: '1', text: 'Найдите ближайший ЦЭКТТ — через cektт.uz или карты' },
              { n: '2', text: 'Возьмите талон (очередь). Лучше приходить с утра в будний день' },
              { n: '3', text: 'Подайте документы оператору, пройдите биометрическую идентификацию' },
              { n: '4', text: 'Ключ запишут на вашу флешку или выдадут файл — сохраните в надёжном месте' },
              { n: '5', text: 'Установите ключ в E-Imzo на рабочем ПК' },
            ].map(s => (
              <div key={s.n} className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-bx-muted text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                <p className="text-xs text-bx-muted leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-bx-bg rounded-lg px-3 py-2.5 space-y-1">
            <p className="text-[11px] text-bx-muted">
              <span className="text-emerald-400 font-medium">✓ Физлица:</span> бесплатно
            </p>
            <p className="text-[11px] text-bx-muted">
              <span className="text-amber-400 font-medium">₸ Юрлица:</span> от ~100 000 сум, уточняйте в ЦЭКТТ
            </p>
            <p className="text-[11px] text-bx-muted">
              <span className="text-blue-400 font-medium">⏱ Время:</span> 15–40 минут при наличии очереди
            </p>
          </div>
        </div>
      )}

      {/* Общие ссылки внизу */}
      <div className="px-4 py-3 border-t border-bx-border flex flex-wrap gap-x-4 gap-y-1">
        <LinkBtn url="https://my.gov.uz" label="my.gov.uz" />
        <LinkBtn url="https://e-imzo.uz" label="e-imzo.uz" />
        <LinkBtn url="https://e-imzo.uz/main/downloads/" label="Скачать E-Imzo" />
        <LinkBtn url="https://soliq.uz" label="soliq.uz" />
      </div>
    </div>
  );
}

// ─── Компонент подписания документа ─────────────────────────────────────────
interface SignerKey { id: string; name: string; owner: string; expiresAt: string }

function EcpSigner({ keys }: { keys: SignerKey[] }) {
  const [pfxPath, setPfxPath] = React.useState<string | null>(null)
  const [password, setPassword] = React.useState('123456')
  const [filePath, setFilePath] = React.useState<string | null>(null)
  const [running, setRunning] = React.useState(false)
  const [result, setResult] = React.useState<{ success: boolean; sigPath?: string; error?: string } | null>(null)

  const bx = (window as any).bx

  const handlePickPfx = async () => {
    const p = await bx?.ecp?.pickPfx()
    if (p) setPfxPath(p)
  }

  const handlePickFile = async () => {
    const p = await bx?.ecp?.pickFileToSign()
    if (p) { setFilePath(p); setResult(null) }
  }

  const handleSign = async () => {
    if (!pfxPath || !filePath) return
    setRunning(true)
    setResult(null)
    const res = await bx?.ecp?.signFile(pfxPath, password, filePath)
    setResult(res)
    setRunning(false)
  }

  const basename = (p: string | null) => p ? p.split(/[\\/]/).pop() ?? p : null

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-bx-bg border border-bx-border rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-bx-text uppercase tracking-wider">✍ Подписание файла (PKCS#7)</p>

        <div>
          <label className="text-[11px] text-bx-muted block mb-1.5">Файл ключа .pfx / .p12</label>
          <div className="flex gap-2">
            <div className="flex-1 text-xs text-bx-text bg-bx-surface rounded-lg px-3 py-2 border border-bx-border truncate">
              {basename(pfxPath) ?? <span className="text-bx-muted">Файл не выбран</span>}
            </div>
            <button onClick={handlePickPfx} className="px-3 py-1.5 text-xs bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text rounded-lg transition-colors">
              Выбрать…
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-bx-muted block mb-1.5">Пароль ключа</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="123456"
            className="w-full bg-bx-surface text-bx-text text-xs px-3 py-2 rounded-lg border border-bx-border focus:outline-none focus:border-blue-500/50" />
        </div>

        <div>
          <label className="text-[11px] text-bx-muted block mb-1.5">Документ для подписания</label>
          <div className="flex gap-2">
            <div className="flex-1 text-xs text-bx-text bg-bx-surface rounded-lg px-3 py-2 border border-bx-border truncate">
              {basename(filePath) ?? <span className="text-bx-muted">Файл не выбран</span>}
            </div>
            <button onClick={handlePickFile} className="px-3 py-1.5 text-xs bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text rounded-lg transition-colors">
              Выбрать…
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1 border-t border-bx-border">
          <button onClick={handleSign} disabled={!pfxPath || !filePath || running}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">
            {running ? '⏳ Подписание...' : '✍ Подписать файл'}
          </button>
        </div>

        {result && (
          result.success ? (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-3 space-y-1">
              <p className="font-semibold">✓ Файл подписан успешно</p>
              <p className="text-emerald-400/70 font-mono text-[11px] break-all">{result.sigPath}</p>
              <p className="text-bx-muted">Файл подписи (.sig) сохранён рядом с оригиналом</p>
            </div>
          ) : (
            <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
              ✗ {result.error}
            </div>
          )
        )}
      </div>
      <div className="bg-bx-bg border border-amber-500/10 rounded-xl px-4 py-3">
        <p className="text-[11px] text-amber-400/80">
          ⚠ Создаётся detached PKCS#7 подпись через openssl smime. Для юридически значимого ЭДО используйте E-Imzo Plug-in или лицензированный криптопровайдер.
        </p>
      </div>
    </div>
  )
}

// ─── Компонент верификации подписи ───────────────────────────────────────────
function EcpVerifier() {
  const [filePath, setFilePath] = React.useState<string | null>(null)
  const [sigPath, setSigPath] = React.useState<string | null>(null)
  const [running, setRunning] = React.useState(false)
  const [result, setResult] = React.useState<{ success: boolean; signer?: string; signedAt?: string; error?: string } | null>(null)

  const bx = (window as any).bx

  const handlePickFile = async () => {
    const p = await bx?.ecp?.pickFileToSign()
    if (p) { setFilePath(p); setResult(null) }
  }

  const handlePickSig = async () => {
    const p = await bx?.ecp?.pickSigFile()
    if (p) { setSigPath(p); setResult(null) }
  }

  const handleVerify = async () => {
    if (!filePath || !sigPath) return
    setRunning(true)
    setResult(null)
    const res = await bx?.ecp?.verifySig(filePath, sigPath)
    setResult(res)
    setRunning(false)
  }

  const basename = (p: string | null) => p ? p.split(/[\\/]/).pop() ?? p : null

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-bx-bg border border-bx-border rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-bx-text uppercase tracking-wider">🔍 Проверка ЭЦП-подписи</p>

        <div>
          <label className="text-[11px] text-bx-muted block mb-1.5">Исходный документ</label>
          <div className="flex gap-2">
            <div className="flex-1 text-xs text-bx-text bg-bx-surface rounded-lg px-3 py-2 border border-bx-border truncate">
              {basename(filePath) ?? <span className="text-bx-muted">Файл не выбран</span>}
            </div>
            <button onClick={handlePickFile} className="px-3 py-1.5 text-xs bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text rounded-lg transition-colors">
              Выбрать…
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-bx-muted block mb-1.5">Файл подписи (.sig / .p7s)</label>
          <div className="flex gap-2">
            <div className="flex-1 text-xs text-bx-text bg-bx-surface rounded-lg px-3 py-2 border border-bx-border truncate">
              {basename(sigPath) ?? <span className="text-bx-muted">Файл не выбран</span>}
            </div>
            <button onClick={handlePickSig} className="px-3 py-1.5 text-xs bg-bx-surface-2 hover:bg-bx-surface-2 text-bx-text rounded-lg transition-colors">
              Выбрать…
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1 border-t border-bx-border">
          <button onClick={handleVerify} disabled={!filePath || !sigPath || running}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">
            {running ? '⏳ Проверка...' : '🔍 Проверить подпись'}
          </button>
        </div>

        {result && (
          result.success ? (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-3 space-y-1.5">
              <p className="font-semibold text-sm">✓ Подпись действительна</p>
              {result.signer && <p>Подписант: <span className="text-bx-text">{result.signer}</span></p>}
              {result.signedAt && <p>Дата сертификата: <span className="text-bx-text">{result.signedAt}</span></p>}
              <p className="text-emerald-400/60">Файл не изменён с момента подписания</p>
            </div>
          ) : (
            <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
              <p className="font-semibold">✗ Подпись не прошла проверку</p>
              {result.error && <p className="mt-1 text-red-400/70">{result.error.slice(0, 300)}</p>}
            </div>
          )
        )}
      </div>
    </div>
  )
}

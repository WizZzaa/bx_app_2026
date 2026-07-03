import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/db/supabase'
import { clearPin } from '../lib/auth/pin'
import { APP_VERSION } from '../../shared/version'
import { db } from '../lib/db/localDb'
import { usePlan, PLAN_LIMITS } from '../lib/plan'

const THEME_KEY = 'bx_theme';
const NOTIFY_KEY = 'bx_notify_days';

type NotifyDays = '1' | '3' | '7' | 'off';

export default function Settings() {
  const { plan, isPro } = usePlan()
  const [userEmail, setUserEmail] = useState('');
  const [notifyDays, setNotifyDays] = useState<NotifyDays>('3');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
    const saved = localStorage.getItem(NOTIFY_KEY) as NotifyDays;
    if (saved) setNotifyDays(saved);
  }, []);

  function saveNotify(v: NotifyDays) {
    setNotifyDays(v);
    localStorage.setItem(NOTIFY_KEY, v);
  }

  async function signOut() {
    setSigningOut(true);
    clearPin();
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function resetPin() {
    clearPin();
    window.location.reload();
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</h2>
        <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden divide-y divide-[#1e2535]">
          {children}
        </div>
      </div>
    );
  }

  function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        <div>
          <p className="text-sm text-slate-200">{label}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Настройки</h1>
          <p className="text-sm text-slate-500 mt-0.5">BX Помощник Бухгалтера v{APP_VERSION}</p>
        </div>

        {/* Тариф */}
        <Section title="Тариф и оплата">
          <div className={`rounded-xl border px-4 py-3 mb-3 ${isPro
            ? 'bg-gradient-to-br from-emerald-600/15 to-transparent border-emerald-500/30'
            : 'bg-gradient-to-br from-blue-600/15 to-transparent border-blue-500/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Ваш план: {isPro ? 'Pro' : 'Free'}
                  <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${isPro ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {isPro ? 'активен' : 'бесплатный'}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPro ? 'Спасибо, что поддерживаете BX!' : 'Pro открывает мультикомпанию, безлимитный AI и контроль оплат'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#1e2535] overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-[#141820] px-4 py-2 font-semibold text-slate-300">
              <span>Возможность</span><span className="text-center">Free</span><span className="text-center text-blue-400">Pro</span>
            </div>
            {[
              ['Справочники, БЗ, калькуляторы, шаблоны', '✓', '✓ + свои шаблоны'],
              ['Компании', String(PLAN_LIMITS.free.companies), 'безлимит'],
              ['Доски Планировщика', String(PLAN_LIMITS.free.boards), 'безлимит'],
              ['AI-Консультант, вопросов/мес', String(PLAN_LIMITS.free.aiPerMonth), 'безлимит'],
              ['Контроль оплат', '—', '✓'],
              ['Живой специалист', '—', '✓'],
            ].map(([f, a, b]) => (
              <div key={f} className="grid grid-cols-3 px-4 py-2 border-t border-[#1e2535]/60 text-slate-400">
                <span>{f}</span><span className="text-center text-slate-500">{a}</span><span className="text-center text-slate-200">{b}</span>
              </div>
            ))}
          </div>
          {!isPro && (
            <p className="text-[11px] text-slate-500 mt-3">
              Приём оплаты Payme/Click подключается. Для активации Pro напишите нам: <span className="text-blue-400">chernikov.dev@gmail.com</span> — включим вручную в день обращения.
            </p>
          )}
        </Section>

        {/* Аккаунт */}
        <Section title="Аккаунт">
          <SettingRow label="Email" desc="Supabase аккаунт">
            <span className="text-sm text-slate-400">{userEmail || '—'}</span>
          </SettingRow>
          <SettingRow label="PIN-код" desc="Используется для быстрой разблокировки на этом ПК">
            <button
              onClick={resetPin}
              className="text-xs px-3 py-1.5 bg-[#1e2535] hover:bg-[#2a3447] text-slate-300 rounded-lg transition-colors"
            >
              Сбросить PIN
            </button>
          </SettingRow>
          <SettingRow label="Выход из аккаунта" desc="Потребуется повторный вход по email">
            <button
              onClick={signOut}
              disabled={signingOut}
              className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
            >
              {signingOut ? 'Выход...' : 'Выйти'}
            </button>
          </SettingRow>
        </Section>

        {/* Уведомления */}
        <Section title="Уведомления о дедлайнах">
          <SettingRow label="Напоминать заранее" desc="За сколько дней до срока показывать предупреждение">
            <div className="flex gap-1.5">
              {(['off', '1', '3', '7'] as NotifyDays[]).map(v => (
                <button
                  key={v}
                  onClick={() => saveNotify(v)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${notifyDays === v ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
                >
                  {v === 'off' ? 'Выкл.' : `${v} дн.`}
                </button>
              ))}
            </div>
          </SettingRow>
        </Section>

        {/* Настройки ИИ */}
        <Section title="Настройки ИИ-консультанта">
          <SettingRow label="Провайдер ИИ" desc="Использовать облачный Gemini или локальный Ollama">
            <div className="flex gap-1.5">
              {(['gemini', 'ollama'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => {
                    localStorage.setItem('bx_ai_provider', v)
                    window.dispatchEvent(new Event('storage')) // Триггерим обновление в других вкладках
                    window.location.reload() // Перезагрузка для применения
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    (localStorage.getItem('bx_ai_provider') || 'gemini') === v 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v === 'gemini' ? 'Облако (Gemini)' : 'Локально (Ollama)'}
                </button>
              ))}
            </div>
          </SettingRow>
          {(localStorage.getItem('bx_ai_provider') || 'gemini') === 'ollama' && (
            <>
              <SettingRow label="Хост Ollama" desc="Адрес запущенного локального API Ollama">
                <input 
                  type="text" 
                  defaultValue={localStorage.getItem('bx_ollama_host') || 'http://localhost:11434'}
                  onBlur={e => localStorage.setItem('bx_ollama_host', e.target.value)}
                  placeholder="http://localhost:11434"
                  className="bg-[#0f1117] text-slate-200 text-xs px-2 py-1 rounded border border-[#2a3447] focus:outline-none w-44"
                />
              </SettingRow>
              <SettingRow label="Модель Ollama" desc="Название локально скачанной LLM">
                <input 
                  type="text" 
                  defaultValue={localStorage.getItem('bx_ollama_model') || 'deepseek-r1:1.5b'}
                  onBlur={e => localStorage.setItem('bx_ollama_model', e.target.value)}
                  placeholder="deepseek-r1:1.5b"
                  className="bg-[#0f1117] text-slate-200 text-xs px-2 py-1 rounded border border-[#2a3447] focus:outline-none w-44"
                />
              </SettingRow>
            </>
          )}
        </Section>

        {/* Данные */}
        <Section title="Данные и конфиденциальность">
          <SettingRow label="Облачное хранилище" desc="Задачи и компании хранятся в Supabase (EU)">
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Активно</span>
          </SettingRow>
          <SettingRow label="Локальный кэш" desc="Справочники кешируются для офлайн-работы">
            <button
              onClick={() => {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('bx_cache_') || k.startsWith('bx_transactions_') || k.startsWith('bx_employees_'))
                keys.forEach(k => localStorage.removeItem(k))
                db.transactions.clear()
                db.employees.clear()
                alert(`Очищен локальный кэш и база данных в браузере`)
              }}
              className="text-xs px-3 py-1.5 bg-[#1e2535] hover:bg-[#2a3447] text-slate-300 rounded-lg transition-colors"
            >
              Очистить кэш
            </button>
          </SettingRow>
        </Section>

        {/* О программе */}
        <Section title="О программе">
          <SettingRow label="Версия" desc="BX — Помощник Бухгалтера">
            <span className="text-sm text-slate-400">v{APP_VERSION}</span>
          </SettingRow>
          <SettingRow label="Разработка" desc="Для бухгалтеров Узбекистана">
            <span className="text-sm text-slate-500">2026</span>
          </SettingRow>
          <div className="px-4 py-3">
            <button
              onClick={() => window.open('https://soliq.uz', '_blank')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Сообщить о проблеме ↗
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { todayISO } from '../lib/dates';
import type { Company, CompanyLegalForm, CompanyProfileForm } from '../lib/db/types';
import {
  buildTaxDeadlineEvents,
  buildTaxDeadlineRuleOptions,
  TAX_HORIZON_DAYS,
} from '../pages/planner/taxSeeder';

export type CompanyWizardInitial = Partial<CompanyProfileForm>;

interface Props {
  company?: Company | null;
  initial?: CompanyWizardInitial;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (profile: CompanyProfileForm) => Promise<void>;
}

const inputCls = 'w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/60 text-xs font-semibold';
const WEEKDAYS = [
  [1, 'Пн'], [2, 'Вт'], [3, 'Ср'], [4, 'Чт'], [5, 'Пт'], [6, 'Сб'], [7, 'Вс'],
] as const;

function defaultRuleIds(regime: string, bxStartDate: string): string[] {
  return buildTaxDeadlineRuleOptions(regime, bxStartDate)
    .filter(rule => rule.defaultSelected)
    .map(rule => rule.id);
}

function initialProfile(company?: Company | null, initial?: CompanyWizardInitial): CompanyProfileForm {
  const startDate = initial?.bx_start_date ?? company?.bx_start_date ?? todayISO();
  const regime = initial?.regime ?? company?.regime ?? 'Налог с оборота';
  const savedRules = initial?.enabled_obligation_rules ?? company?.enabled_obligation_rules;

  return {
    name: initial?.name ?? company?.name ?? '',
    inn: initial?.inn ?? company?.inn ?? null,
    regime,
    legal_form: initial?.legal_form ?? company?.legal_form ?? 'ooo',
    registration_date: initial?.registration_date ?? company?.registration_date ?? null,
    bx_start_date: startDate,
    is_vat_payer: initial?.is_vat_payer ?? company?.is_vat_payer ?? regime === 'ОСН',
    work_weekdays: initial?.work_weekdays ?? company?.work_weekdays ?? [1, 2, 3, 4, 5],
    notification_channels: initial?.notification_channels ?? company?.notification_channels ?? ['in_app'],
    preferred_language: initial?.preferred_language ?? company?.preferred_language ?? 'ru',
    enabled_obligation_rules: savedRules ?? defaultRuleIds(regime, startDate),
  };
}

export default function CompanyProfileWizard({ company, initial, busy = false, onCancel, onConfirm }: Props) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<CompanyProfileForm>(() => initialProfile(company, initial));

  const ruleOptions = useMemo(
    () => buildTaxDeadlineRuleOptions(profile.regime, profile.bx_start_date),
    [profile.regime, profile.bx_start_date],
  );
  const previewEvents = useMemo(
    () => buildTaxDeadlineEvents(company?.id ?? 'preview-company', {
      regime: profile.regime,
      bxStartDate: profile.bx_start_date,
      enabledObligationRules: profile.enabled_obligation_rules,
    }),
    [company?.id, profile.bx_start_date, profile.enabled_obligation_rules, profile.regime],
  );

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [busy, onCancel]);

  function setField<K extends keyof CompanyProfileForm>(key: K, value: CompanyProfileForm[K]) {
    setProfile(current => ({ ...current, [key]: value }));
  }

  function changeRegime(regime: string) {
    const selected = defaultRuleIds(regime, profile.bx_start_date);
    setProfile(current => ({
      ...current,
      regime,
      is_vat_payer: regime === 'ОСН' ? true : current.is_vat_payer,
      enabled_obligation_rules: selected,
    }));
  }

  function changeStartDate(bxStartDate: string) {
    const available = new Set(buildTaxDeadlineRuleOptions(profile.regime, bxStartDate).map(rule => rule.id));
    setProfile(current => ({
      ...current,
      bx_start_date: bxStartDate,
      enabled_obligation_rules: current.enabled_obligation_rules.filter(id => available.has(id)),
    }));
  }

  function validateBase(): boolean {
    if (!profile.name.trim()) {
      setError('Укажите название компании');
      return false;
    }
    if (profile.inn && profile.inn.length !== 9) {
      setError('ИНН должен содержать 9 цифр');
      return false;
    }
    if (!profile.bx_start_date) {
      setError('Укажите дату начала работы в BX');
      return false;
    }
    if (profile.registration_date && profile.bx_start_date < profile.registration_date) {
      setError('Дата начала работы в BX не может быть раньше регистрации');
      return false;
    }
    setError('');
    return true;
  }

  function next() {
    if (step === 0 && !validateBase()) return;
    setError('');
    setStep(current => Math.min(2, current + 1));
  }

  function toggleRule(id: string) {
    setProfile(current => ({
      ...current,
      enabled_obligation_rules: current.enabled_obligation_rules.includes(id)
        ? current.enabled_obligation_rules.filter(ruleId => ruleId !== id)
        : [...current.enabled_obligation_rules, id],
    }));
  }

  function toggleWeekday(day: number) {
    setProfile(current => {
      const exists = current.work_weekdays.includes(day);
      const next = exists
        ? current.work_weekdays.filter(value => value !== day)
        : [...current.work_weekdays, day].sort();
      return { ...current, work_weekdays: next.length ? next : current.work_weekdays };
    });
  }

  async function confirm() {
    if (!validateBase() || busy) return;
    await onConfirm({
      ...profile,
      name: profile.name.trim(),
      inn: profile.inn?.trim() || null,
      enabled_obligation_rules: [...new Set(profile.enabled_obligation_rules)],
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="company-profile-title" className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-bx-border bg-bx-surface shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-bx-border flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Шаг {step + 1} из 3</p>
            <h2 id="company-profile-title" className="text-lg font-black text-bx-text mt-1">
              {company ? 'Настройка компании' : 'Новая компания'}
            </h2>
            <p className="text-xs text-bx-muted mt-1">Сначала проверяем профиль и обязательства, затем создаём календарь.</p>
          </div>
          <button type="button" aria-label="Закрыть настройки компании" onClick={onCancel} disabled={busy} className="text-bx-muted hover:text-bx-text text-xl px-2">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">Название компании</span>
                  <input value={profile.name} onChange={event => setField('name', event.target.value)} className={inputCls} placeholder="ООО «Компания»" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">ИНН</span>
                  <input value={profile.inn ?? ''} onChange={event => setField('inn', event.target.value.replace(/\D/g, '').slice(0, 9) || null)} className={inputCls} placeholder="9 цифр" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">Форма деятельности</span>
                  <select value={profile.legal_form} onChange={event => setField('legal_form', event.target.value as CompanyLegalForm)} className={inputCls}>
                    <option value="ooo">ООО</option>
                    <option value="ip">ИП</option>
                    <option value="self_employed">Самозанятый</option>
                    <option value="other">Другая</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">Дата регистрации</span>
                  <input type="date" value={profile.registration_date ?? ''} onChange={event => setField('registration_date', event.target.value || null)} className={inputCls} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">Начало работы в BX</span>
                  <input type="date" value={profile.bx_start_date} onChange={event => changeStartDate(event.target.value)} className={inputCls} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">Налоговый режим</span>
                  <select value={profile.regime} onChange={event => changeRegime(event.target.value)} className={inputCls}>
                    <option value="ОСН">ОСН</option>
                    <option value="Налог с оборота">Налог с оборота</option>
                    <option value="Упрощенный">Упрощённый</option>
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-bx-border bg-bx-bg px-4 py-3 mt-5">
                  <input type="checkbox" checked={profile.is_vat_payer} onChange={event => setField('is_vat_payer', event.target.checked)} />
                  <span className="text-xs font-bold text-bx-text">Компания является плательщиком НДС</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-bx-muted mb-2">Рабочие дни</p>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map(([day, label]) => (
                      <button key={day} type="button" onClick={() => toggleWeekday(day)} className={`w-10 h-9 rounded-lg text-xs font-bold border ${profile.work_weekdays.includes(day) ? 'bg-blue-600 text-white border-blue-500' : 'bg-bx-bg text-bx-muted border-bx-border'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">Язык уведомлений</span>
                  <select value={profile.preferred_language} onChange={event => setField('preferred_language', event.target.value as 'ru' | 'uz')} className={inputCls}>
                    <option value="ru">Русский</option>
                    <option value="uz">O‘zbekcha</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-500">
                BX автоматически отметил только правила, однозначно связанные с выбранным режимом. Условные правила «для всех» включаются вручную.
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-bx-text">Обязательства на ближайшие {TAX_HORIZON_DAYS} дней</h3>
                  <p className="text-xs text-bx-muted mt-1">Выбрано правил: {profile.enabled_obligation_rules.length}; событий в предварительном списке: {previewEvents.length}</p>
                </div>
                <button type="button" onClick={() => setField('enabled_obligation_rules', [])} className="text-[11px] text-bx-muted hover:text-bx-text">Снять всё</button>
              </div>
              <div className="space-y-2">
                {ruleOptions.map(rule => {
                  const checked = profile.enabled_obligation_rules.includes(rule.id);
                  return (
                    <label key={rule.id} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 cursor-pointer ${checked ? 'border-blue-500/40 bg-blue-500/10' : 'border-bx-border bg-bx-bg'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleRule(rule.id)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-bx-text">{rule.title}</span>
                        <span className="block text-[10px] text-bx-muted mt-1">{rule.taxType} · {rule.dates.join(', ')}{rule.defaultSelected ? ' · по режиму' : ' · условное'}</span>
                      </span>
                    </label>
                  );
                })}
                {ruleOptions.length === 0 && <p className="text-xs text-bx-muted py-8 text-center">В текущем подтверждённом календаре нет сроков для выбранного периода.</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['Компания', profile.name],
                  ['Режим', profile.regime],
                  ['Начало в BX', profile.bx_start_date],
                  ['НДС', profile.is_vat_payer ? 'Плательщик' : 'Не плательщик'],
                  ['Правил', String(profile.enabled_obligation_rules.length)],
                  ['Событий на 60 дней', String(previewEvents.length)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-bx-border bg-bx-bg px-4 py-3">
                    <p className="text-[10px] font-bold uppercase text-bx-muted">{label}</p>
                    <p className="text-sm font-black text-bx-text mt-1">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-4 text-xs text-bx-text space-y-2">
                <p className="font-black">После подтверждения:</p>
                <p>• профиль сохранится в компании и получит новую версию;</p>
                <p>• будут созданы только выбранные обязательства не раньше даты начала работы в BX;</p>
                <p>• владельцу компании назначается ответственность по созданным системным задачам;</p>
                <p>• уже выполненная история не изменяется.</p>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-xs font-bold text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-bx-border flex items-center justify-between gap-3">
          <button onClick={step === 0 ? onCancel : () => setStep(current => current - 1)} disabled={busy} className="px-4 py-2 text-xs font-bold text-bx-muted hover:text-bx-text disabled:opacity-50">
            {step === 0 ? 'Отмена' : 'Назад'}
          </button>
          {step < 2 ? (
            <button onClick={next} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black">Продолжить</button>
          ) : (
            <button onClick={confirm} disabled={busy} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:opacity-50">
              {busy ? 'Сохраняем…' : company ? 'Подтвердить изменения' : 'Создать компанию и календарь'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

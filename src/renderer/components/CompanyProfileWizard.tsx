import React, { useEffect, useMemo, useState } from 'react';
import { todayISO } from '../lib/dates';
import type {
  Company,
  CompanyLegalForm,
  CompanyProfileDetails,
  CompanyProfileForm,
  CompanyProfileRole,
  ObligationRuleDecision,
} from '../lib/db/types';
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
  role?: CompanyProfileRole | 'loading';
  onCancel: () => void;
  onConfirm: (profile: CompanyProfileForm) => Promise<void>;
}

const inputCls = 'w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/60 text-xs font-semibold';
const WEEKDAYS = [
  [1, 'Пн'], [2, 'Вт'], [3, 'Ср'], [4, 'Чт'], [5, 'Пт'], [6, 'Сб'], [7, 'Вс'],
] as const;

const LEGAL_FORMS: Array<{ id: CompanyLegalForm; title: string; short: string; hint: string }> = [
  { id: 'ooo', title: 'ООО', short: 'Юридическое лицо', hint: 'Базовый профиль компании с руководителем и банковскими реквизитами.' },
  { id: 'ip', title: 'ЯТТ / ИП', short: 'Предприниматель', hint: 'Упрощённый профиль владельца без лишней корпоративной анкеты.' },
  { id: 'joint_venture', title: 'СП', short: 'Совместное предприятие', hint: 'Добавим страну партнёра и долю иностранного участия.' },
  { id: 'family_enterprise', title: 'Семейное предприятие', short: 'Семейный бизнес', hint: 'Профиль компании и владельца.' },
  { id: 'farm', title: 'Фермерское хозяйство', short: 'Агробизнес', hint: 'Необязательный агропрофиль: регион, гектары и направление.' },
  { id: 'private_enterprise', title: 'ЧП', short: 'Частное предприятие', hint: 'Профиль собственника, руководителя и компании.' },
  { id: 'jsc', title: 'АО', short: 'Акционерное общество', hint: 'Укажем тип акций и базовые реквизиты.' },
  { id: 'self_employed', title: 'Самозанятый', short: 'Физическое лицо', hint: 'Только данные владельца и адрес деятельности — если нужны.' },
  { id: 'other', title: 'Другая форма', short: 'Уточнить вручную', hint: 'Сохраните своё название формы и используйте гибкий профиль.' },
];

const EMPTY_DETAILS: CompanyProfileDetails = {};

function formLabel(form: CompanyLegalForm) {
  return LEGAL_FORMS.find(item => item.id === form)?.title ?? 'Другая форма';
}

function formCalendarHint(form: CompanyLegalForm) {
  if (form === 'farm') return 'Для фермерского хозяйства дополнительно проверьте сезонные и земельные обязательства — они включаются только по вашему выбору.';
  if (form === 'self_employed') return 'Для самозанятого BX показывает только применимые правила; лишние обязательства можно не включать.';
  if (form === 'ip') return 'Для ЯТТ календарь формируется по выбранному режиму, а не по корпоративным правилам ООО.';
  return 'BX предлагает правила по форме и режиму. Условные и разовые обязанности остаются только после вашего выбора.';
}

function obligationTraits(
  isVatPayer: boolean,
  details: CompanyProfileDetails,
) {
  return {
    isVatPayer,
    hasEmployees: details.has_employees,
  };
}

function initialProfile(company?: Company | null, initial?: CompanyWizardInitial): CompanyProfileForm {
  const startDate = initial?.bx_start_date ?? company?.bx_start_date ?? todayISO();
  const regime = initial?.regime ?? company?.regime ?? 'Налог с оборота';
  const legalForm = initial?.legal_form ?? company?.legal_form ?? 'ooo';
  const isVatPayer = initial?.is_vat_payer ?? company?.is_vat_payer ?? regime === 'ОСН';
  const details = {
    ...EMPTY_DETAILS,
    ...(company?.profile_details ?? {}),
    ...(initial?.profile_details ?? {}),
  };
  const savedRules = initial?.enabled_obligation_rules ?? company?.enabled_obligation_rules;
  const options = buildTaxDeadlineRuleOptions(
    regime,
    startDate,
    todayISO(),
    TAX_HORIZON_DAYS,
    obligationTraits(isVatPayer, details),
  );
  const enabledRules = savedRules ?? options.filter(rule => rule.defaultSelected).map(rule => rule.id);
  const decisions: Record<string, ObligationRuleDecision> = Object.fromEntries(
    options.map(rule => [rule.id, rule.recommendedDecision]),
  );
  Object.assign(decisions, details.obligation_rule_decisions ?? {});
  for (const id of enabledRules) decisions[id] = 'applies';

  return {
    name: initial?.name ?? company?.name ?? '',
    inn: initial?.inn ?? company?.inn ?? null,
    regime,
    legal_form: legalForm,
    profile_details: { ...details, obligation_rule_decisions: decisions },
    registration_date: initial?.registration_date ?? company?.registration_date ?? null,
    bx_start_date: startDate,
    is_vat_payer: isVatPayer,
    work_weekdays: initial?.work_weekdays ?? company?.work_weekdays ?? [1, 2, 3, 4, 5],
    notification_channels: initial?.notification_channels ?? company?.notification_channels ?? ['in_app'],
    preferred_language: initial?.preferred_language ?? company?.preferred_language ?? 'ru',
    enabled_obligation_rules: enabledRules,
  };
}

export default function CompanyProfileWizard({ company, initial, busy = false, role = 'owner', onCancel, onConfirm }: Props) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<CompanyProfileForm>(() => initialProfile(company, initial));

  const ruleOptions = useMemo(
    () => buildTaxDeadlineRuleOptions(
      profile.regime,
      profile.bx_start_date,
      todayISO(),
      TAX_HORIZON_DAYS,
      obligationTraits(profile.is_vat_payer, profile.profile_details),
    ),
    [
      profile.regime,
      profile.bx_start_date,
      profile.is_vat_payer,
      profile.profile_details.has_employees,
    ],
  );
  const previewEvents = useMemo(
    () => buildTaxDeadlineEvents(company?.id ?? 'preview-company', {
      regime: profile.regime,
      bxStartDate: profile.bx_start_date,
      enabledObligationRules: profile.enabled_obligation_rules,
    }),
    [company?.id, profile.bx_start_date, profile.enabled_obligation_rules, profile.regime],
  );
  const calendarChange = useMemo(() => {
    const before = new Set(company?.enabled_obligation_rules ?? []);
    const after = new Set(profile.enabled_obligation_rules);
    return {
      added: [...after].filter(id => !before.has(id)),
      removed: [...before].filter(id => !after.has(id)),
      unchanged: [...after].filter(id => before.has(id)),
    };
  }, [company?.enabled_obligation_rules, profile.enabled_obligation_rules]);

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

  function setDetail<K extends keyof CompanyProfileDetails>(key: K, value: CompanyProfileDetails[K]) {
    setProfile(current => ({
      ...current,
      profile_details: { ...current.profile_details, [key]: value },
    }));
  }

  function updateWorkTraits(patch: Partial<CompanyProfileDetails>, isVatPayer = profile.is_vat_payer) {
    const details = { ...profile.profile_details, ...patch };
    const options = buildTaxDeadlineRuleOptions(
      profile.regime,
      profile.bx_start_date,
      todayISO(),
      TAX_HORIZON_DAYS,
      obligationTraits(isVatPayer, details),
    );
    const decisions = { ...(profile.profile_details.obligation_rule_decisions ?? {}) };
    const enabled = new Set(profile.enabled_obligation_rules);

    for (const option of options) {
      const current = decisions[option.id];
      if (current === undefined || current === 'needs_review' || current === 'not_applicable') {
        decisions[option.id] = option.recommendedDecision;
        if (option.recommendedDecision === 'applies') enabled.add(option.id);
        else enabled.delete(option.id);
      }
    }

    setProfile(current => ({
      ...current,
      is_vat_payer: isVatPayer,
      profile_details: { ...details, obligation_rule_decisions: decisions },
      enabled_obligation_rules: [...enabled],
    }));
  }

  function changeRegime(regime: string) {
    setProfile(current => {
      const isVatPayer = regime === 'ОСН' ? true : current.is_vat_payer;
      const options = buildTaxDeadlineRuleOptions(
        regime,
        current.bx_start_date,
        todayISO(),
        TAX_HORIZON_DAYS,
        obligationTraits(isVatPayer, current.profile_details),
      );
      const previousDecisions = current.profile_details.obligation_rule_decisions ?? {};
      const decisions = Object.fromEntries(
        options.map(rule => [rule.id, previousDecisions[rule.id] ?? rule.recommendedDecision]),
      );
      const selected = options
        .filter(rule => decisions[rule.id] === 'applies')
        .map(rule => rule.id);
      return {
        ...current,
        regime,
        is_vat_payer: isVatPayer,
        profile_details: { ...current.profile_details, obligation_rule_decisions: decisions },
        enabled_obligation_rules: selected,
      };
    });
  }

  function changeStartDate(bxStartDate: string) {
    const options = buildTaxDeadlineRuleOptions(
      profile.regime,
      bxStartDate,
      todayISO(),
      TAX_HORIZON_DAYS,
      obligationTraits(profile.is_vat_payer, profile.profile_details),
    );
    const available = new Set(options.map(rule => rule.id));
    setProfile(current => ({
      ...current,
      bx_start_date: bxStartDate,
      profile_details: {
        ...current.profile_details,
        obligation_rule_decisions: Object.fromEntries(
          Object.entries(current.profile_details.obligation_rule_decisions ?? {})
            .filter(([id]) => available.has(id)),
        ),
      },
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
    if (step === 1 && !validateBase()) return;
    setError('');
    setStep(current => Math.min(3, current + 1));
  }

  function setRuleDecision(id: string, decision: ObligationRuleDecision) {
    setProfile(current => ({
      ...current,
      profile_details: {
        ...current.profile_details,
        obligation_rule_decisions: {
          ...(current.profile_details.obligation_rule_decisions ?? {}),
          [id]: decision,
        },
      },
      enabled_obligation_rules: decision === 'applies'
        ? [...new Set([...current.enabled_obligation_rules, id])]
        : current.enabled_obligation_rules.filter(ruleId => ruleId !== id),
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Шаг {step + 1} из 4</p>
            <h2 id="company-profile-title" className="text-lg font-black text-bx-text mt-1">
              {company ? 'Настройка компании' : 'Новая компания'}
            </h2>
            <p className="text-xs text-bx-muted mt-1">Сначала выбираем форму, затем показываем только нужные поля и календарь.</p>
          </div>
          <button type="button" aria-label="Закрыть настройки компании" onClick={onCancel} disabled={busy} className="text-bx-muted hover:text-bx-text text-xl px-2">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 0 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Кто вы?</p>
                <h3 className="mt-1 text-base font-black text-bx-text">Выберите форму предприятия</h3>
                <p className="mt-1 text-xs leading-relaxed text-bx-muted">От этого зависят поля профиля, подсказки по документам и список обязательств для календаря. Ничего не отправим в календарь без вашего выбора.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {LEGAL_FORMS.map(form => {
                  const selected = profile.legal_form === form.id;
                  return <button key={form.id} type="button" onClick={() => setField('legal_form', form.id)} aria-pressed={selected} className={`min-h-32 rounded-2xl border p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${selected ? 'border-blue-500 bg-blue-500/[0.10] shadow-sm ring-1 ring-blue-500/20' : 'border-bx-border bg-bx-bg hover:border-blue-500/35 hover:bg-blue-500/[0.04]'}`}><span className="text-sm font-black text-bx-text">{form.title}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">{form.short}</span><span className="mt-2 block text-[10px] leading-relaxed text-bx-muted">{form.hint}</span></button>;
                })}
              </div>
              <p className="text-[11px] text-bx-muted">Сейчас выбрано: <b className="text-bx-text">{formLabel(profile.legal_form)}</b>. При необходимости форму можно будет изменить с предварительным сравнением календаря.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-bx-border bg-bx-bg px-4 py-3 text-xs text-bx-muted">Форма: <b className="text-bx-text">{formLabel(profile.legal_form)}</b>. Показываем только применимые поля; банковские реквизиты можно заполнить позже.</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">Название компании</span>
                  <input value={profile.name} onChange={event => setField('name', event.target.value)} className={inputCls} placeholder={profile.legal_form === 'ip' || profile.legal_form === 'self_employed' ? 'ФИО владельца или название деятельности' : 'Название компании'} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-bx-muted">ИНН</span>
                  <input value={profile.inn ?? ''} onChange={event => setField('inn', event.target.value.replace(/\D/g, '').slice(0, 9) || null)} className={inputCls} placeholder="9 цифр" />
                </label>
                {(profile.legal_form === 'ip' || profile.legal_form === 'self_employed' || profile.legal_form === 'private_enterprise' || profile.legal_form === 'family_enterprise') && <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Владелец</span><input value={profile.profile_details.owner_name ?? ''} onChange={event => setDetail('owner_name', event.target.value)} className={inputCls} placeholder="ФИО владельца" /></label>}
                {!(profile.legal_form === 'ip' || profile.legal_form === 'self_employed') && <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Руководитель</span><input value={profile.profile_details.director_name ?? ''} onChange={event => setDetail('director_name', event.target.value)} className={inputCls} placeholder="ФИО руководителя" /></label>}
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
                  <input type="checkbox" checked={profile.is_vat_payer} onChange={event => updateWorkTraits({}, event.target.checked)} />
                  <span className="text-xs font-bold text-bx-text">Компания является плательщиком НДС</span>
                </label>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-300">Рабочие признаки</p>
                <p className="mt-1 text-[11px] leading-relaxed text-bx-muted">По этим ответам BX предложит применимые отчёты. Окончательное решение всё равно останется за бухгалтером.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-bx-muted">Основная деятельность</span>
                    <select value={profile.profile_details.primary_activity ?? ''} onChange={event => updateWorkTraits({ primary_activity: event.target.value as CompanyProfileDetails['primary_activity'] })} className={inputCls}>
                      <option value="">Нужно уточнить</option>
                      <option value="trade">Торговля</option>
                      <option value="services">Услуги</option>
                      <option value="production">Производство</option>
                      <option value="construction">Строительство</option>
                      <option value="agriculture">Сельское хозяйство</option>
                      <option value="other">Другое</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:pt-5">
                    {([
                      ['has_employees', 'Есть сотрудники'],
                      ['has_import', 'Есть импорт'],
                      ['has_export', 'Есть экспорт'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 rounded-xl border border-bx-border bg-bx-bg px-3 py-2.5 text-[10px] font-bold text-bx-text">
                        <input type="checkbox" checked={Boolean(profile.profile_details[key])} onChange={event => updateWorkTraits({ [key]: event.target.checked })} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-bx-border pt-5">
                {profile.legal_form !== 'self_employed' && <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Юридический адрес</span><input value={profile.profile_details.legal_address ?? ''} onChange={event => setDetail('legal_address', event.target.value)} className={inputCls} placeholder="Город, район, улица" /></label>}
                {(profile.legal_form === 'ip' || profile.legal_form === 'self_employed') && <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Адрес деятельности</span><input value={profile.profile_details.activity_address ?? ''} onChange={event => setDetail('activity_address', event.target.value)} className={inputCls} placeholder="Если отличается от адреса регистрации" /></label>}
                {profile.legal_form !== 'self_employed' && <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Банк и МФО · необязательно</span><div className="grid grid-cols-2 gap-2"><input value={profile.profile_details.bank_name ?? ''} onChange={event => setDetail('bank_name', event.target.value)} className={inputCls} placeholder="Банк" /><input value={profile.profile_details.mfo ?? ''} onChange={event => setDetail('mfo', event.target.value.replace(/\D/g, '').slice(0, 5))} className={inputCls} placeholder="МФО" /></div></label>}
                {profile.legal_form !== 'self_employed' && <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Расчётный счёт · необязательно</span><input value={profile.profile_details.bank_account ?? ''} onChange={event => setDetail('bank_account', event.target.value.replace(/\D/g, '').slice(0, 20))} className={inputCls} placeholder="20 цифр" /></label>}
                {profile.legal_form === 'joint_venture' && <><label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Страна иностранного партнёра</span><input value={profile.profile_details.foreign_partner_country ?? ''} onChange={event => setDetail('foreign_partner_country', event.target.value)} className={inputCls} placeholder="Например, Турция" /></label><label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Доля иностранного участия, %</span><input inputMode="decimal" value={profile.profile_details.foreign_share_percent ?? ''} onChange={event => setDetail('foreign_share_percent', event.target.value.replace(/[^\d.,]/g, ''))} className={inputCls} placeholder="0–100" /></label></>}
                {profile.legal_form === 'jsc' && <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Тип акций</span><select value={profile.profile_details.share_type ?? ''} onChange={event => setDetail('share_type', event.target.value as 'ordinary' | 'preferred' | '')} className={inputCls}><option value="">Уточнить позже</option><option value="ordinary">Обыкновенные</option><option value="preferred">Привилегированные</option></select></label>}
                {profile.legal_form === 'other' && <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Название формы</span><input value={profile.profile_details.custom_legal_form ?? ''} onChange={event => setDetail('custom_legal_form', event.target.value)} className={inputCls} placeholder="Например, учреждение" /></label>}
              </div>

              {profile.legal_form === 'farm' && <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">Агропрофиль · необязательно</p><div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3"><label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Район / регион</span><input value={profile.profile_details.farm_region ?? ''} onChange={event => setDetail('farm_region', event.target.value)} className={inputCls} placeholder="Регион" /></label><label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Площадь, га</span><input inputMode="decimal" value={profile.profile_details.farm_area_hectares ?? ''} onChange={event => setDetail('farm_area_hectares', event.target.value.replace(/[^\d.,]/g, ''))} className={inputCls} placeholder="0" /></label><label className="space-y-1.5"><span className="text-[10px] font-bold uppercase text-bx-muted">Направление / культура</span><input value={profile.profile_details.farm_specialization ?? ''} onChange={event => setDetail('farm_specialization', event.target.value)} className={inputCls} placeholder="Хлопок, сад, животноводство…" /></label></div><label className="mt-3 flex items-center gap-2 text-xs font-semibold text-bx-text"><input type="checkbox" checked={Boolean(profile.profile_details.seasonal)} onChange={event => setDetail('seasonal', event.target.checked)} />Сезонная деятельность</label></div>}

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

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-500">
                {formCalendarHint(profile.legal_form)} BX автоматически отметил только правила, однозначно связанные с выбранным режимом. Условные правила «для всех» включаются вручную.
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-bx-text">Обязательства на ближайшие {TAX_HORIZON_DAYS} дней</h3>
                  <p className="text-xs text-bx-muted mt-1">Применяется: {profile.enabled_obligation_rules.length}; нужно уточнить: {ruleOptions.filter(rule => (profile.profile_details.obligation_rule_decisions?.[rule.id] ?? rule.recommendedDecision) === 'needs_review').length}; событий: {previewEvents.length}</p>
                </div>
                <button type="button" onClick={() => setProfile(current => ({ ...current, enabled_obligation_rules: [], profile_details: { ...current.profile_details, obligation_rule_decisions: Object.fromEntries(ruleOptions.map(rule => [rule.id, 'needs_review'])) } }))} className="text-[11px] text-bx-muted hover:text-bx-text">Отметить всё «Уточнить»</button>
              </div>
              {company && <div className="grid gap-2 rounded-2xl border border-blue-500/25 bg-blue-500/[0.06] p-4 sm:grid-cols-3">
                <div><p className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Добавится</p><p className="mt-1 text-lg font-black tabular-nums text-bx-text">{calendarChange.added.length}</p></div>
                <div><p className="text-[9px] font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-300">Перестанет предлагаться</p><p className="mt-1 text-lg font-black tabular-nums text-bx-text">{calendarChange.removed.length}</p></div>
                <div><p className="text-[9px] font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-300">Останется</p><p className="mt-1 text-lg font-black tabular-nums text-bx-text">{calendarChange.unchanged.length}</p></div>
                <p className="sm:col-span-3 text-[10px] leading-relaxed text-bx-muted">После подтверждения обновятся только будущие системные обязательства. Ручные задачи и выполненная история не удаляются.</p>
              </div>}
              <div className="space-y-2">
                {ruleOptions.map(rule => {
                  const decision = profile.profile_details.obligation_rule_decisions?.[rule.id] ?? rule.recommendedDecision;
                  return (
                    <div key={rule.id} className={`rounded-2xl border px-4 py-3 ${decision === 'applies' ? 'border-emerald-500/35 bg-emerald-500/[0.07]' : decision === 'not_applicable' ? 'border-bx-border bg-bx-bg opacity-80' : 'border-amber-500/30 bg-amber-500/[0.06]'}`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-bx-text">{rule.title}</span>
                          <span className="block text-[10px] text-bx-muted mt-1">{rule.taxType} · {rule.dates.length > 0 ? rule.dates.join(', ') : `следующий срок пока вне горизонта ${TAX_HORIZON_DAYS} дней`}</span>
                          <span className="mt-1.5 block text-[10px] leading-relaxed text-bx-muted">Рекомендация BX: {rule.recommendationReason}</span>
                        </span>
                        <div className="grid grid-cols-3 gap-1 rounded-xl border border-bx-border bg-bx-surface p-1" role="group" aria-label={`Применимость: ${rule.title}`}>
                          {([
                            ['applies', 'Применяется'],
                            ['not_applicable', 'Не применяется'],
                            ['needs_review', 'Уточнить'],
                          ] as const).map(([value, label]) => (
                            <button key={value} type="button" onClick={() => setRuleDecision(rule.id, value)} aria-pressed={decision === value} className={`min-h-8 rounded-lg px-2 text-[9px] font-black transition ${decision === value ? value === 'applies' ? 'bg-emerald-600 text-white' : value === 'not_applicable' ? 'bg-bx-surface-2 text-bx-text shadow-sm' : 'bg-amber-500 text-slate-950' : 'text-bx-muted hover:text-bx-text'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {ruleOptions.length === 0 && <p className="text-xs text-bx-muted py-8 text-center">В текущем подтверждённом календаре нет сроков для выбранного периода.</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {company && <div className={`rounded-2xl border px-4 py-3 text-xs ${role === 'assistant' ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300' : role === 'viewer' ? 'border-bx-border bg-bx-bg text-bx-muted' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
                {role === 'loading' ? 'Проверяем ваши права…' : role === 'assistant' ? 'Вы работаете как помощник: изменения уйдут владельцу и бухгалтеру на подтверждение.' : role === 'viewer' ? 'Роль наблюдателя позволяет просматривать профиль, но не изменять его.' : role === 'accountant' ? 'Вы работаете как бухгалтер и можете применить изменения профиля.' : 'Вы работаете как владелец и можете применить изменения профиля.'}
              </div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['Компания', profile.name],
                  ['Форма', formLabel(profile.legal_form)],
                  ['Режим', profile.regime],
                  ['Начало в BX', profile.bx_start_date],
                  ['НДС', profile.is_vat_payer ? 'Плательщик' : 'Не плательщик'],
                  ['Правил', String(profile.enabled_obligation_rules.length)],
                  [`Событий на ${TAX_HORIZON_DAYS} дней`, String(previewEvents.length)],
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
          {step < 3 ? (
            <button onClick={next} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black">Продолжить</button>
          ) : (
            <button onClick={confirm} disabled={busy || role === 'loading' || role === 'viewer'} className="min-h-11 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? 'Сохраняем…' : role === 'loading' ? 'Проверяем права…' : role === 'viewer' ? 'Только просмотр' : company && role === 'assistant' ? 'Отправить предложение' : company ? 'Подтвердить изменения' : 'Создать компанию и календарь'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

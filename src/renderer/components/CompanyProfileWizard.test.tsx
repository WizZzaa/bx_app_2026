import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import CompanyProfileWizard, { type CompanyWizardInitial } from './CompanyProfileWizard';

const BASE_INITIAL: CompanyWizardInitial = {
  name: '  Test Company  ',
  inn: '123456789',
  regime: 'ОСН',
  legal_form: 'ooo',
  profile_details: {
    has_employees: true,
  },
  registration_date: '2026-01-10',
  bx_start_date: '2026-07-16',
  is_vat_payer: true,
};

function initialProfile(overrides: CompanyWizardInitial = {}): CompanyWizardInitial {
  return {
    ...BASE_INITIAL,
    ...overrides,
    profile_details: {
      ...BASE_INITIAL.profile_details,
      ...overrides.profile_details,
    },
  };
}

function setup(overrides: CompanyWizardInitial = {}) {
  const onConfirm = vi.fn(async () => undefined);
  render(
    <CompanyProfileWizard
      initial={initialProfile(overrides)}
      onCancel={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  return { onConfirm };
}

function continueToRules() {
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
}

function decisionGroup(ruleTitle: RegExp) {
  return screen.getByRole('group', { name: ruleTitle });
}

function chooseDecision(ruleTitle: RegExp, decision: 'Применяется' | 'Не применяется' | 'Уточнить') {
  fireEvent.click(within(decisionGroup(ruleTitle)).getByRole('button', { name: decision }));
}

function expectDecision(ruleTitle: RegExp, decision: 'Применяется' | 'Не применяется' | 'Уточнить') {
  expect(within(decisionGroup(ruleTitle)).getByRole('button', { name: decision }).getAttribute('aria-pressed')).toBe('true');
}

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 16, 12, 0, 0));
});

afterEach(cleanup);
afterAll(() => vi.useRealTimers());

describe('CompanyProfileWizard obligation decisions', () => {
  it('shows inline field errors and focuses the first invalid company field', () => {
    setup({ name: ' ', inn: '123', bx_start_date: '' });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    const companyName = screen.getByLabelText(/Ваша компания/) as HTMLInputElement;
    expect(companyName.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Укажите название компании или ФИО владельца.')).toBeTruthy();
    expect(screen.getByText('ИНН должен содержать ровно 9 цифр.')).toBeTruthy();
    expect(screen.getByText('Укажите дату начала работы в BX.')).toBeTruthy();
    expect(document.activeElement).toBe(companyName);
  });

  it('supports explicit applies, not-applicable and needs-review decisions', () => {
    setup();
    continueToRules();
    const excise = /Применимость: Акцизный налог/;

    chooseDecision(excise, 'Применяется');
    expectDecision(excise, 'Применяется');

    chooseDecision(excise, 'Не применяется');
    expectDecision(excise, 'Не применяется');

    chooseDecision(excise, 'Уточнить');
    expectDecision(excise, 'Уточнить');
  });

  it('does not replace explicit applies decisions when employee and VAT traits are disabled', () => {
    setup();
    continueToRules();
    const payroll = /Применимость: НДФЛ и соцналог/;
    const vat = /Применимость: НДС — отчётность/;

    chooseDecision(payroll, 'Не применяется');
    chooseDecision(payroll, 'Применяется');
    chooseDecision(vat, 'Не применяется');
    chooseDecision(vat, 'Применяется');

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Есть сотрудники' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Компания является плательщиком НДС' }));
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expectDecision(payroll, 'Применяется');
    expectDecision(vat, 'Применяется');
  });

  it('keeps an agreed enabled rule when the BX start date changes', () => {
    setup();
    continueToRules();
    const excise = /Применимость: Акцизный налог/;

    chooseDecision(excise, 'Применяется');
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    fireEvent.change(screen.getByLabelText('Начало работы в BX'), { target: { value: '2026-08-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expectDecision(excise, 'Применяется');
  });

  it('keeps an agreed compatible rule when the tax regime changes', () => {
    setup();
    continueToRules();
    const excise = /Применимость: Акцизный налог/;

    chooseDecision(excise, 'Применяется');
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    fireEvent.change(screen.getByLabelText('Налоговый режим'), { target: { value: 'Налог с оборота' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expectDecision(excise, 'Применяется');
  });

  it('passes the confirmed profile with explicit decisions to onConfirm', () => {
    const { onConfirm } = setup();
    continueToRules();
    const naturalIncome = /Применимость: НДФЛ и ИНПС с натуральных доходов/;

    chooseDecision(naturalIncome, 'Применяется');
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Создать компанию и календарь' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Company',
      inn: '123456789',
      regime: 'ОСН',
      bx_start_date: '2026-07-16',
      enabled_obligation_rules: expect.arrayContaining(['ndfl-nat-pay']),
      profile_details: expect.objectContaining({
        obligation_rule_decisions: expect.objectContaining({
          'ndfl-nat-pay': 'applies',
        }),
      }),
    }));
  });
});

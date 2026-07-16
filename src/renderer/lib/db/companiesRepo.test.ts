import { describe, expect, it } from 'vitest';
import { buildCompanyInsert } from './companiesRepo';

describe('buildCompanyInsert', () => {
  it('оставляет владельца базе данных и не отправляет клиентский user_id', () => {
    const payload = buildCompanyInsert({
      name: 'Новая компания',
      inn: '123456789',
      regime: 'Налог с оборота',
      legal_form: 'ooo',
      registration_date: null,
      bx_start_date: '2026-07-17',
      is_vat_payer: false,
      work_weekdays: [1, 2, 3, 4, 5],
      notification_channels: ['in_app'],
      preferred_language: 'ru',
      enabled_obligation_rules: [],
    });

    expect(payload).not.toHaveProperty('user_id');
    expect(payload).toMatchObject({ name: 'Новая компания', profile_status: 'confirmed' });
  });
});

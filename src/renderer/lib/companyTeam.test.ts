import { describe, expect, it } from 'vitest';
import {
  canManageCompanyTeam,
  getCompanyTeamErrorMessage,
  normalizeInviteEmail,
  type CompanyTeamMember,
} from './companyTeam';

const OWNER: CompanyTeamMember = {
  id: 'member-1',
  organization_id: 'company-1',
  user_id: 'user-1',
  invited_email: 'owner@example.com',
  role: 'owner',
  status: 'active',
};

describe('companyTeam', () => {
  it('normalizes invitation email before sending it to the database', () => {
    expect(normalizeInviteEmail('  Wife@Example.COM ')).toBe('wife@example.com');
  });

  it('allows team management only to an active owner', () => {
    expect(canManageCompanyTeam([OWNER], 'user-1')).toBe(true);
    expect(canManageCompanyTeam([{ ...OWNER, role: 'accountant' }], 'user-1')).toBe(false);
    expect(canManageCompanyTeam([{ ...OWNER, status: 'pending', user_id: null }], 'user-1')).toBe(false);
  });

  it('turns database errors into useful team messages', () => {
    expect(getCompanyTeamErrorMessage(new Error('duplicate key value violates unique constraint')))
      .toContain('уже');
    expect(getCompanyTeamErrorMessage(new Error('new row violates row-level security policy')))
      .toContain('владелец');
  });
});

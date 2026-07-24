import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyTeamPanel } from './CompanyTeamPanel';

const mocks = vi.hoisted(() => ({
  invite: vi.fn(),
  reload: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../lib/CompanyContext', () => ({
  useCompany: () => ({
    active: { id: 'company-1', name: 'ООО Тест', user_id: 'owner-1' },
    reload: mocks.reload,
  }),
}));

vi.mock('../lib/useCompanyTeam', () => ({
  useCompanyTeam: () => ({
    incomingInvites: [],
    members: [],
    loading: false,
    error: null,
    canManage: true,
    currentUserId: 'owner-1',
    invite: mocks.invite,
    acceptInvite: vi.fn(),
    rejectInvite: vi.fn(),
    removeMember: vi.fn(),
  }),
}));

vi.mock('../lib/ui/ToastContext', () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));

describe('CompanyTeamPanel invite form', () => {
  beforeEach(() => {
    mocks.invite.mockReset();
    mocks.invite.mockResolvedValue(undefined);
    mocks.success.mockReset();
  });

  it('uses labelled email and role fields and submits the existing invite contract', async () => {
    render(<CompanyTeamPanel />);

    const email = screen.getByRole('textbox', { name: /Email участника/ });
    const role = screen.getByRole('combobox', { name: 'Роль участника' });
    fireEvent.change(email, { target: { value: 'accountant@example.com' } });
    fireEvent.change(role, { target: { value: 'accountant' } });
    fireEvent.click(screen.getByRole('button', { name: 'Пригласить' }));

    await waitFor(() => expect(mocks.invite).toHaveBeenCalledWith('accountant@example.com', 'accountant'));
    expect(mocks.success).toHaveBeenCalled();
    expect((email as HTMLInputElement).value).toBe('');
  });
});

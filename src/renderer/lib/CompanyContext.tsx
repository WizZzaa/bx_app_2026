import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { companiesRepo } from './db/companiesRepo';
import { supabase } from './db/supabase';
import { emitPlannerReload } from '../pages/planner/plannerBus';
import { syncTaxDeadlines } from '../pages/planner/taxSeeder';
import { todayISO } from './dates';
import CompanyProfileWizard, { type CompanyWizardInitial } from '../components/CompanyProfileWizard';
import { useToast } from './ui/ToastContext';
import type { Company, CompanyProfileForm } from './db/types';

interface Ctx {
  companies: Company[];
  active: Company | null;
  setActive: (c: Company | null) => void;
  reload: () => Promise<void>;
  updateCompany: (id: string, updates: Partial<CompanyProfileForm> & { color?: string | null; is_active?: boolean }) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  startCompanyCreation: (initial?: CompanyWizardInitial) => void;
  startCompanyEdit: (company?: Company) => void;
}

const CompanyCtx = createContext<Ctx | null>(null);

const ACTIVE_KEY = 'bx_active_company';

function getCompanySaveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'Не удалось сохранить профиль компании';
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [active, setActiveState] = useState<Company | null>(null);
  const [wizard, setWizard] = useState<{ company?: Company; initial?: CompanyWizardInitial } | null>(null);
  const [wizardBusy, setWizardBusy] = useState(false);
  const lastTaxHorizonSyncDay = useRef<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const list = await companiesRepo.list();
      setCompanies(list);
      const savedId = localStorage.getItem(ACTIVE_KEY);
      const found = list.find(c => c.id === savedId) ?? null;
      setActiveState(found);
    } catch {
      setCompanies([]);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    let cancelled = false;

    async function syncDailyTaxHorizon() {
      const eligible = companies.filter(company =>
        company.is_active
        && company.profile_status === 'confirmed'
        && Boolean(company.bx_start_date)
        && (company.enabled_obligation_rules?.length ?? 0) > 0,
      );
      if (eligible.length === 0) return;

      const currentDay = todayISO();
      if (lastTaxHorizonSyncDay.current === currentDay) return;
      lastTaxHorizonSyncDay.current = currentDay;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          lastTaxHorizonSyncDay.current = null;
          return;
        }

        const ownedCompanies = eligible.filter(company => company.user_id === user.id);
        const results = await Promise.all(ownedCompanies.map(company => syncTaxDeadlines(user.id, company.id)));
        if (!cancelled && results.some(result => result.added > 0 || result.removed > 0)) {
          emitPlannerReload();
        }
      } catch (syncError) {
        lastTaxHorizonSyncDay.current = null;
        console.error('[CompanyProvider] daily tax horizon sync failed:', syncError);
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void syncDailyTaxHorizon();
    };

    void syncDailyTaxHorizon();
    const interval = window.setInterval(() => void syncDailyTaxHorizon(), 60 * 60 * 1000);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [companies]);

  const setActive = useCallback((c: Company | null) => {
    setActiveState(c);
    if (c) localStorage.setItem(ACTIVE_KEY, c.id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const updateCompany = useCallback(async (id: string, updates: Partial<CompanyProfileForm> & { color?: string | null; is_active?: boolean }) => {
    await companiesRepo.update(id, updates);
    await reload();
  }, [reload]);

  const removeCompany = useCallback(async (id: string) => {
    await companiesRepo.remove(id);
    if (active?.id === id) {
      setActive(null);
    }
    await reload();
  }, [active, reload, setActive]);

  const startCompanyCreation = useCallback((initial?: CompanyWizardInitial) => {
    setWizard({ initial });
  }, []);

  const startCompanyEdit = useCallback((company?: Company) => {
    const target = company ?? active;
    if (target) setWizard({ company: target });
  }, [active]);

  async function confirmCompanyProfile(profile: CompanyProfileForm) {
    if (!wizard) return;
    setWizardBusy(true);
    try {
      const saved = wizard.company
        ? await companiesRepo.update(wizard.company.id, profile)
        : await companiesRepo.add(profile);

      localStorage.setItem(ACTIVE_KEY, saved.id);
      setActiveState(saved);
      await reload();

      const { data: { user } } = await supabase.auth.getUser();
      const syncResult = user
        ? await syncTaxDeadlines(user.id, saved.id)
        : { added: 0, removed: 0 };
      emitPlannerReload();
      setWizard(null);
      const changes = [
        syncResult.added > 0 ? `добавлено: ${syncResult.added}` : '',
        syncResult.removed > 0 ? `убрано: ${syncResult.removed}` : '',
      ].filter(Boolean).join(', ');
      toast.success(changes
        ? `Профиль подтверждён; обязательства — ${changes}`
        : 'Профиль компании подтверждён');
    } catch (saveError) {
      console.error('[CompanyProfileWizard] save failed:', saveError);
      const message = getCompanySaveErrorMessage(saveError);
      toast.error(message.includes('column')
        ? 'Схема профиля компании ещё не обновлена на сервере'
        : message);
    } finally {
      setWizardBusy(false);
    }
  }

  return (
    <CompanyCtx.Provider value={{ companies, active, setActive, reload, updateCompany, removeCompany, startCompanyCreation, startCompanyEdit }}>
      {children}
      {wizard && (
        <CompanyProfileWizard
          company={wizard.company}
          initial={wizard.initial}
          busy={wizardBusy}
          onCancel={() => setWizard(null)}
          onConfirm={confirmCompanyProfile}
        />
      )}
    </CompanyCtx.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyCtx);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}

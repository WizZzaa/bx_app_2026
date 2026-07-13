import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { companiesRepo } from './db/companiesRepo';
import type { Company } from './db/types';

interface Ctx {
  companies: Company[];
  active: Company | null;
  setActive: (c: Company | null) => void;
  reload: () => Promise<void>;
  addCompany: (input: { name: string; inn?: string; regime?: string }) => Promise<void>;
  updateCompany: (id: string, updates: { name?: string; inn?: string | null; regime?: string | null; color?: string | null }) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
}

const CompanyCtx = createContext<Ctx | null>(null);

const ACTIVE_KEY = 'bx_active_company';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [active, setActiveState] = useState<Company | null>(null);

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

  const setActive = useCallback((c: Company | null) => {
    setActiveState(c);
    if (c) localStorage.setItem(ACTIVE_KEY, c.id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const addCompany = useCallback(async (input: { name: string; inn?: string; regime?: string }) => {
    await companiesRepo.add(input);
    await reload();
  }, [reload]);

  const updateCompany = useCallback(async (id: string, updates: { name?: string; inn?: string | null; regime?: string | null; color?: string | null }) => {
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

  return (
    <CompanyCtx.Provider value={{ companies, active, setActive, reload, addCompany, updateCompany, removeCompany }}>
      {children}
    </CompanyCtx.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyCtx);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}

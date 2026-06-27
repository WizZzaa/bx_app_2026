import { supabase, isSupabaseConfigured } from './supabase';
import { indicators as localIndicators, taxes as localTaxes } from '../../data/reference/finance';
import type { Indicator, TaxRate } from '../../data/reference/types';

// Чтение справочников: сначала Supabase (источник правды), при ошибке/офлайне —
// локальный фолбэк. Это и есть «облако + локальный кэш».

export async function loadIndicators(): Promise<{ data: Indicator[]; source: 'cloud' | 'local' }> {
  if (isSupabaseConfigured) {
    try {
      const { data: inds, error } = await supabase
        .from('bx_ref_indicators')
        .select('id, key, name, short_name, unit, hint');
      if (error) throw error;

      const { data: vals, error: vErr } = await supabase
        .from('bx_ref_indicator_values')
        .select('indicator_id, value, valid_from, valid_to, basis, verified')
        .order('valid_from', { ascending: false });
      if (vErr) throw vErr;

      const mapped: Indicator[] = (inds ?? []).map(i => ({
        key: i.key,
        name: i.name,
        shortName: i.short_name,
        unit: i.unit,
        hint: i.hint ?? undefined,
        meta: { verified: false, updatedAt: new Date().toISOString().slice(0, 10) },
        history: (vals ?? [])
          .filter(v => v.indicator_id === i.id)
          .map(v => ({ value: Number(v.value), from: v.valid_from, to: v.valid_to ?? undefined, basis: v.basis ?? undefined })),
      }));
      if (mapped.length) return { data: mapped, source: 'cloud' };
    } catch {
      // падаем в локальный фолбэк
    }
  }
  return { data: localIndicators, source: 'local' };
}

export interface AccountRow {
  code: string;
  name: string;
  account_class: string;
  type: string | null;
}
export interface NsbuRow {
  number: number;
  title: string;
  description: string | null;
}

export async function loadAccounts(): Promise<AccountRow[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('bx_ref_accounts')
      .select('code, name, account_class, type, sort')
      .order('sort', { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function loadNsbu(): Promise<NsbuRow[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('bx_ref_nsbu')
      .select('number, title, description')
      .order('number', { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function loadTaxes(): Promise<{ data: TaxRate[]; source: 'cloud' | 'local' }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('bx_ref_taxes')
        .select('name, rate, base, note, regime, sort')
        .order('sort', { ascending: true });
      if (error) throw error;
      if (data?.length) {
        return {
          data: data.map(t => ({ name: t.name, rate: t.rate, base: t.base, note: t.note ?? undefined, regime: t.regime ?? undefined })),
          source: 'cloud',
        };
      }
    } catch {
      // фолбэк
    }
  }
  return { data: localTaxes, source: 'local' };
}

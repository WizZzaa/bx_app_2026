import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Конфиг Supabase. URL и publishable-ключ безопасны для клиента
// (доступ ограничен RLS-политиками). Значения берутся из Vite env,
// с фолбэком на зашитые публичные значения проекта bxuz.

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bqejnrsuvcscimyptxwl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = Boolean(SUPABASE_ANON_KEY);

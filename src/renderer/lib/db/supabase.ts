import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Конфиг Supabase. URL и publishable-ключ безопасны для клиента
// (доступ ограничен RLS-политиками). Значения берутся из Vite env,
// с фолбэком на зашитые публичные значения проекта bxuz.

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bqejnrsuvcscimyptxwl.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZWpucnN1dmNzY2lteXB0eHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzY4NDEsImV4cCI6MjA2ODk1Mjg0MX0.XppqeGzphFZ48mxe4_QuXjvCxno5ls2Tnp2D7q_I4vg';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = Boolean(SUPABASE_ANON_KEY);

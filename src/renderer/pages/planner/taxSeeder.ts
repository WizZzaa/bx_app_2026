import { supabase } from '../../lib/db/supabase';
import { taxDeadlines } from '../../data/taxCalendar';
import type { NewEvent } from './useEvents';

const SEEDED_KEY = 'bx_tax_seeded_years';

function getSeededYears(): number[] {
  try { return JSON.parse(localStorage.getItem(SEEDED_KEY) || '[]'); } catch { return []; }
}
function markSeeded(year: number) {
  const years = getSeededYears();
  if (!years.includes(year)) {
    localStorage.setItem(SEEDED_KEY, JSON.stringify([...years, year]));
  }
}

export async function seedTaxDeadlines(year: number, userId: string, companyId: string | null): Promise<number> {
  if (getSeededYears().includes(year)) return 0;

  const events: NewEvent[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  for (const dl of taxDeadlines) {
    const months = dl.month !== null ? [dl.month] : [1,2,3,4,5,6,7,8,9,10,11,12];
    for (const m of months) {
      const day = String(dl.day).padStart(2,'0');
      const mon = String(m).padStart(2,'0');
      const dateStr = `${year}-${mon}-${day}`;
      // Прошедшие дедлайны сразу помечаем done — они не должны считаться "просроченными"
      const isPast = dateStr < todayStr;
      events.push({
        company_id: companyId,
        type: 'tax_deadline',
        title: dl.title,
        date: dateStr,
        due_date: dateStr,
        status: isPast ? 'done' : 'todo',
        priority: dl.kind === 'payment' ? 'high' : 'normal',
        tags: [dl.taxType],
        tax_type: dl.taxType,
        kind: dl.kind,
        regime: dl.regime,
        note: dl.note ?? null,
        source: 'seeded',
        reminder_at: null,
      });
    }
  }

  if (events.length === 0) return 0;

  const { error } = await supabase.from('bx_events').insert(
    events.map(e => ({ ...e, user_id: userId }))
  );

  if (!error) {
    markSeeded(year);
    return events.length;
  }
  console.error('Tax seed error:', error);
  return 0;
}

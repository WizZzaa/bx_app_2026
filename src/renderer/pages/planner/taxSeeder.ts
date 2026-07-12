import { supabase } from '../../lib/db/supabase';
import { taxDeadlines } from '../../data/taxCalendar';
import type { NewEvent } from './useEvents';
import { todayISO } from '../../lib/dates';

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
  const todayStr = todayISO();

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

  const { data: insertedEvents, error } = await supabase
    .from('bx_events')
    .insert(events.map(e => ({ ...e, user_id: userId })))
    .select();

  if (!error && insertedEvents) {
    markSeeded(year);

    // Дополнительно создаем Kanban-карточки на доске "Отчётность и платежи" или дефолтной доске
    try {
      const { data: boards } = await supabase
        .from('bx_boards')
        .select('*')
        .eq('company_id', companyId);

      const targetBoard = boards?.find(b => b.name === 'Отчётность и платежи') 
        || boards?.find(b => b.is_default) 
        || boards?.[0];

      if (targetBoard && targetBoard.columns && targetBoard.columns.length > 0) {
        const firstColId = targetBoard.columns[0].id;
        const cardsToInsert = insertedEvents.map((e: any, idx: number) => ({
          user_id: userId,
          board_id: targetBoard.id,
          column_id: firstColId,
          title: e.title,
          description: e.note || null,
          priority: e.priority || 'normal',
          labels: e.tags || null,
          checklist: [],
          due_date: e.due_date || null,
          event_id: e.id,
          position: idx + 1
        }));

        const { error: cardError } = await supabase.from('bx_cards').insert(cardsToInsert);
        if (cardError) console.error('Error seeding card deadlines:', cardError);
      }
    } catch (e) {
      console.error('Failed to create synced Kanban cards for seeded deadlines:', e);
    }

    return events.length;
  }
  console.error('Tax seed error:', error);
  return 0;
}

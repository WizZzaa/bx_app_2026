import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Planner A2 Apple-style contract', () => {
  it('keeps the planner workspace, command bar and calm semantic tokens together', () => {
    const planner = read('src/renderer/pages/Planner.tsx');
    const css = read('src/renderer/pages/planner/PlannerA2.css');

    expect(planner).toContain('bx-planner-a2');
    expect(planner).toContain('bx-planner-commandbar');
    expect(planner).toContain('bx-planner-hero__status');
    expect(planner).toContain('aria-label="Вид планировщика"');
    expect(css).toContain('var(--bx-brand-soft)');
    expect(css).toContain('var(--bx-surface)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('@media (prefers-reduced-transparency: reduce)');
    expect(css).toContain('@media (forced-colors: active)');
  });

  it('renders task forms as viewport-level accessible sheets', () => {
    for (const file of ['EventModal.tsx', 'DailyTasksModal.tsx', 'CardModal.tsx', 'BoardModal.tsx', 'ArchivePanel.tsx']) {
      const source = read(`src/renderer/pages/planner/${file}`);
      expect(source, file).toContain('createPortal(');
      expect(source, file).toContain('document.body');
      expect(source, file).toContain('role="dialog"');
      expect(source, file).toContain('aria-modal="true"');
      expect(source, file).toContain('bx-sheet');
    }
  });

  it('does not change planner repositories or persistence contracts', () => {
    const css = read('src/renderer/pages/planner/PlannerA2.css');
    const planner = read('src/renderer/pages/Planner.tsx');

    expect(css).not.toContain('localStorage.removeItem');
    expect(css).not.toContain('supabase');
    expect(planner).toContain('useEvents()');
    expect(planner).toContain('nextRecurrenceISO');
    expect(planner).toContain('onEventDrop={handleEventDrop}');
  });
});

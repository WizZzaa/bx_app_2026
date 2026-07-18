import { describe, expect, it } from 'vitest';
import { buildContentAuditInventory, summarizeContentAudit } from './contentAudit';

describe('content audit inventory', () => {
  it('collects every local content source into one register', () => {
    const summary = summarizeContentAudit();

    expect(summary.byKind.obligation).toBe(35);
    expect(summary.byKind.knowledge).toBe(36);
    expect(summary.byKind.template).toBe(15);
    expect(summary.total).toBe(86);
  });

  it('uses stable unique keys across content types', () => {
    const items = buildContentAuditInventory();
    expect(new Set(items.map(item => item.key)).size).toBe(items.length);
  });

  it('does not call content ready without full editorial metadata', () => {
    const items = buildContentAuditInventory();
    for (const item of items.filter(entry => entry.status === 'ready')) {
      expect(item.issues).toEqual([]);
      expect(item.updatedAt).toBeTruthy();
      if (item.kind !== 'template') expect(item.sourceUrl).toBeTruthy();
    }
  });
});

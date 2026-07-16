import { describe, expect, it, vi } from 'vitest';
import { collectEventPages } from './useEvents';

describe('collectEventPages', () => {
  it('loads rows beyond the first Supabase page', async () => {
    const allRows = Array.from({ length: 2005 }, (_, index) => index);
    const fetchPage = vi.fn(async (from: number, to: number) => allRows.slice(from, to + 1));

    const rows = await collectEventPages(fetchPage, 1000);

    expect(rows).toEqual(allRows);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 1000, 1999);
  });

  it('stops after an exact-size page and an empty page', async () => {
    const allRows = Array.from({ length: 1000 }, (_, index) => index);
    const fetchPage = vi.fn(async (from: number, to: number) => allRows.slice(from, to + 1));

    await expect(collectEventPages(fetchPage, 1000)).resolves.toEqual(allRows);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});

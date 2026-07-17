import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {} }));
vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({ default: '/pdf.worker.mjs' }));
vi.mock('xlsx', () => ({ utils: {} }));

import { escapeDocumentHtml, groupPdfTextItems } from './PdfConvert';

describe('PDF tools regression', () => {
  it('allows local and Tesseract workers in the production CSP', () => {
    const viteConfig = readFileSync('vite.renderer.config.mts', 'utf8');
    expect(viteConfig).toContain("worker-src 'self' blob: https://cdn.jsdelivr.net");
    expect(viteConfig).toContain("script-src 'self' https://cdn.jsdelivr.net");
  });

  it('groups PDF text in reading order', () => {
    expect(groupPdfTextItems([
      { str: 'мир', transform: [1, 0, 0, 1, 60, 100] },
      { str: 'Привет', transform: [1, 0, 0, 1, 10, 101] },
      { str: 'Вторая строка', transform: [1, 0, 0, 1, 10, 80] },
    ])).toEqual(['Привет\tмир', 'Вторая строка']);
  });

  it('escapes document text before creating a Word-compatible file', () => {
    expect(escapeDocumentHtml('<script>&"')).toBe('&lt;script&gt;&amp;&quot;');
  });
});

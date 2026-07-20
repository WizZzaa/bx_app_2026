import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('local development server security', () => {
  it('binds the renderer server to loopback only', () => {
    const viteConfig = readFileSync('vite.renderer.config.mts', 'utf8');

    expect(viteConfig).toContain("host: '127.0.0.1'");
    expect(viteConfig).not.toMatch(/host:\s*true/);
    expect(viteConfig).toContain('port: 5173');
  });

  it('keeps the Vitest API and UI servers disabled', () => {
    const vitestConfig = readFileSync('vitest.config.ts', 'utf8');

    expect(vitestConfig).toMatch(/api:\s*false/);
    expect(vitestConfig).toMatch(/ui:\s*false/);
  });
});

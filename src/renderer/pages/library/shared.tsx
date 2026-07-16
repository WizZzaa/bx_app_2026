import React from 'react';
import { KB_CATEGORY_META } from '../../data/knowledge';

// Общие примитивы объединённой Базы знаний: иконки, цвета категорий,
// текстовые помощники. Использовались в Knowledge.tsx, вынесены при
// объединении со Справочниками (v1.47).

const PATHS: Record<string, React.ReactNode> = {
  coins: <><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
  alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  arrowR: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
  arrowL: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
  table: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></>,
  calc: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
  wrench: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>,
};

export function Icon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{PATHS[name] ?? null}</svg>;
}

export const COLOR: Record<string, { text: string; bg: string; ring: string }> = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    ring: 'hover:border-blue-500/40' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'hover:border-emerald-500/40' },
  cyan:    { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    ring: 'hover:border-cyan-500/40' },
  purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  ring: 'hover:border-purple-500/40' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'hover:border-amber-500/40' },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/10',     ring: 'hover:border-red-500/40' },
};
export const catColor = (cat: string) => COLOR[KB_CATEGORY_META[cat]?.color ?? 'blue'] ?? COLOR.blue;

export function readMinutes(body: string): number {
  const words = body.replace(/[#*`>|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 150));
}

export function excerpt(body: string): string {
  for (const raw of body.split('\n')) {
    const l = raw.trim();
    if (l && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('-')) {
      return l.replace(/\*\*/g, '').replace(/`/g, '').slice(0, 120);
    }
  }
  return '';
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-|-$/g, '');
}

export function highlight(text: string, q: string): React.ReactNode {
  if (!q || q.length < 2) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark className="rounded border border-amber-400/70 bg-amber-200 px-1 py-0.5 font-extrabold text-amber-950 shadow-[inset_0_-1px_0_rgba(217,119,6,0.22)] dark:border-amber-400/40 dark:bg-amber-300/20 dark:text-amber-100">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
}

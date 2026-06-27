// Браузерные уведомления для Планировщика.
// Запрашивает разрешение и проверяет reminder_at каждые 5 минут.

import type { BxEvent } from '../pages/planner/useEvents';

const NOTIFIED_KEY = 'bx_notified_events';

function getNotified(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')); } catch { return new Set(); }
}
function markNotified(id: string) {
  const s = getNotified(); s.add(id);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...s]));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function checkReminders(events: BxEvent[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const notified = getNotified();

  for (const ev of events) {
    if (!ev.reminder_at || ev.status === 'done' || notified.has(ev.id)) continue;
    const remindAt = new Date(ev.reminder_at);
    if (remindAt <= now) {
      new Notification('BX — Напоминание', {
        body: ev.title,
        icon: '/icon.png',
        tag: ev.id,
      });
      markNotified(ev.id);
    }
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startReminderLoop(getEvents: () => BxEvent[]) {
  if (intervalId) clearInterval(intervalId);
  checkReminders(getEvents());
  intervalId = setInterval(() => checkReminders(getEvents()), 5 * 60 * 1000);
}

export function stopReminderLoop() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

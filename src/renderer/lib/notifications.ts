// Браузерные уведомления для Планировщика.
// Запрашивает разрешение и проверяет reminder_at каждую минуту.

import type { BxEvent } from '../pages/planner/useEvents';
import { logger } from './logger';

const NOTIFIED_KEY = 'bx_notified_events';
type ReminderWindow = Window & { bx?: { tray?: { showNotification?: (title: string, body: string, route?: string) => Promise<boolean> } } }

function trayNotification() {
  return (window as ReminderWindow).bx?.tray?.showNotification
}

function getNotified(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')); }
  catch (err) { logger.debug('notifications', 'Битый кэш отправленных уведомлений', err); return new Set(); }
}
function markNotified(id: string) {
  const s = getNotified(); s.add(id);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...s]));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (trayNotification()) return true;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function checkReminders(events: BxEvent[]) {
  const showInElectron = trayNotification();
  if (!showInElectron && (!('Notification' in window) || Notification.permission !== 'granted')) return;
  const now = new Date();
  const notified = getNotified();

  for (const ev of events) {
    if (!ev.reminder_at || ev.status === 'done' || notified.has(ev.id)) continue;
    const remindAt = new Date(ev.reminder_at);
    if (remindAt <= now) {
      if (showInElectron) {
        // Main process suppresses the Windows toast while the Bix widget is visible.
        // Marking the event here also prevents a delayed duplicate after the widget closes.
        void showInElectron('BX — Напоминание', ev.title, '/planner');
      } else {
        new Notification('BX — Напоминание', {
          body: ev.title,
          icon: '/icon.png',
          tag: ev.id,
        });
      }
      markNotified(ev.id);
    }
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startReminderLoop(getEvents: () => BxEvent[]) {
  if (intervalId) clearInterval(intervalId);
  checkReminders(getEvents());
  intervalId = setInterval(() => checkReminders(getEvents()), 60 * 1000);
}

export function stopReminderLoop() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

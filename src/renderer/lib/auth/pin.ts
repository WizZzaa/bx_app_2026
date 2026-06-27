// Локальный PIN-замок. PIN хранится только на этой машине в виде хэша.
// crypto.subtle работает только в secure context (HTTPS / localhost).
// При доступе по HTTP в локальной сети используется fallback-хэш.

const PIN_KEY = 'bx_pin_hash';
const SALT = 'bx_pin_v1_2026';

async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + text));
    return 'sub_' + [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for insecure HTTP (local network preview via IP address).
  // A 4-digit PIN has 10k combinations — hash strength is not the limiting factor.
  return pureDjb2(SALT + text);
}

function pureDjb2(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return 'djb_' + h.toString(16).padStart(8, '0');
}

export function hasPin(): boolean {
  return Boolean(localStorage.getItem(PIN_KEY));
}

export async function setPin(pin: string): Promise<void> {
  localStorage.setItem(PIN_KEY, await sha256(pin));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return false;
  return stored === (await sha256(pin));
}

export function clearPin(): void {
  localStorage.removeItem(PIN_KEY);
}

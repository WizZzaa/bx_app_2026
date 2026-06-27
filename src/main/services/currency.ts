// Курсы валют ЦБ РУз через открытый API cbu.uz.
// Эндпоинт по конкретной валюте: https://cbu.uz/uz/arkhiv-kursov-valyut/json/{CCY}/
// История на дату:               .../json/{CCY}/{YYYY-MM-DD}/
import type { CurrencyRate } from '../../shared/types';

const FLAGS: Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺', GBP: '🇬🇧', KZT: '🇰🇿', CNY: '🇨🇳' };
const DEFAULT_CODES = ['USD', 'EUR', 'RUB'];

interface CbuItem {
  Ccy: string;
  CcyNm_RU: string;
  Rate: string;
  Diff: string;
  Date: string;
}

export async function fetchRates(codes: string[] = DEFAULT_CODES): Promise<CurrencyRate[]> {
  const res = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/');
  if (!res.ok) throw new Error(`cbu.uz HTTP ${res.status}`);
  const data: CbuItem[] = await res.json();
  const wanted = new Set(codes);

  return data
    .filter(i => wanted.has(i.Ccy))
    .map(i => ({
      code: i.Ccy,
      name: i.CcyNm_RU,
      flag: FLAGS[i.Ccy] ?? '🏳️',
      value: parseFloat(i.Rate),
      diff: parseFloat(i.Diff) || 0,
      date: i.Date,
    }))
    // упорядочим как в codes
    .sort((a, b) => codes.indexOf(a.code) - codes.indexOf(b.code));
}

// Курс одной валюты на конкретную дату (для конвертера «на дату» в будущем)
export async function fetchRateOnDate(code: string, date: string): Promise<CurrencyRate | null> {
  const res = await fetch(`https://cbu.uz/ru/arkhiv-kursov-valyut/json/${code}/${date}/`);
  if (!res.ok) throw new Error(`cbu.uz HTTP ${res.status}`);
  const data: CbuItem[] = await res.json();
  const i = data[0];
  if (!i) return null;
  return {
    code: i.Ccy,
    name: i.CcyNm_RU,
    flag: FLAGS[i.Ccy] ?? '🏳️',
    value: parseFloat(i.Rate),
    diff: parseFloat(i.Diff) || 0,
    date: i.Date,
  };
}

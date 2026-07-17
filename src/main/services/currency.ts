// Курсы валют ЦБ РУз через открытый API cbu.uz.
// Эндпоинт по конкретной валюте: https://cbu.uz/uz/arkhiv-kursov-valyut/json/{CCY}/
// История на дату:               .../json/{CCY}/{YYYY-MM-DD}/
import type { BankExchangeRate, CurrencyRate } from '../../shared/types';

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

const BANK_SOURCES = {
  ipakYuli: {
    id: 'ipak-yuli' as const,
    name: 'Ipak Yuli Bank',
    url: 'https://ru.ipakyulibank.uz/physical/obmen-valyut',
  },
  aloqabank: {
    id: 'aloqabank' as const,
    name: 'Aloqabank',
    url: 'https://aloqabank.uz/ru/',
  },
  trustbank: {
    id: 'trustbank' as const,
    name: 'Trustbank',
    url: 'https://trustbank.uz/ru/',
  },
};

function numeric(value: string): number {
  return Number(value.replace(/[\s\u00A0]/g, '').replace(',', '.'));
}

function toBankRate(
  bank: (typeof BANK_SOURCES)[keyof typeof BANK_SOURCES],
  code: string,
  buy: number,
  sell: number,
  centralBank: number | null,
  updatedAt: string | null,
): BankExchangeRate {
  return { bankId: bank.id, bankName: bank.name, sourceUrl: bank.url, updatedAt, code, buy, sell, centralBank };
}

export function parseIpakYuliRates(html: string): BankExchangeRate[] {
  const marker = '"В кассе","CurrencyTable"';
  const markerIndex = html.lastIndexOf(marker);
  const cashSection = markerIndex >= 0
    ? html.slice(markerIndex + marker.length).split('"В банкомате"')[0]
    : '';
  const updatedEpoch = cashSection.match(/,(\d{10}),0(?:,|$)/)?.[1];
  const updatedAt = updatedEpoch ? new Date(Number(updatedEpoch) * 1000).toISOString() : null;
  const rates: BankExchangeRate[] = [];
  const pattern = /"([A-Z]{3})","[^"]*",\{"buy":\d+,"sell":\d+,"cb":\d+\},(\d+),(\d+),(\d+)/g;

  for (const match of cashSection.matchAll(pattern)) {
    rates.push(toBankRate(
      BANK_SOURCES.ipakYuli,
      match[1],
      Number(match[2]) / 100,
      Number(match[3]) / 100,
      Number(match[4]) / 100,
      updatedAt,
    ));
  }
  return rates;
}

export function parseAloqabankRates(html: string): BankExchangeRate[] {
  const raw = html.match(/var arCurrencyRates = (\{.*?\});/)?.[1];
  if (!raw) return [];
  const payload = JSON.parse(raw) as {
    BANK?: { BUY?: Record<string, string | number>; SALE?: Record<string, string | number> };
  };
  const buy = payload.BANK?.BUY ?? {};
  const sell = payload.BANK?.SALE ?? {};
  const updatedAt = html.match(/Данные от\s*([^<]+)/i)?.[1]?.trim() ?? null;

  return Object.keys(buy)
    .filter(code => code !== 'UZS' && Number(buy[code]) > 0 && Number(sell[code]) > 0)
    .map(code => toBankRate(BANK_SOURCES.aloqabank, code, Number(buy[code]), Number(sell[code]), null, updatedAt));
}

export function parseTrustbankRates(html: string): BankExchangeRate[] {
  const updatedAt = html.match(/покупка\/продажа\s*-\s*Данные от\s*([^<]+)/i)?.[1]?.trim() ?? null;
  const rates = new Map<string, BankExchangeRate>();
  const tables = html.matchAll(/<table class="rate__currency_table">([\s\S]*?)<\/table>/g);

  for (const table of tables) {
    const code = table[1].match(/icon__([A-Z]{3})/)?.[1];
    if (!code || rates.has(code)) continue;
    const values = [...table[1].matchAll(/rate__currency_value[\s\S]*?<span>([\d\s.,]+)<\/span>/g)]
      .map(match => numeric(match[1]));
    if (values.length < 3 || !values[0] || !values[1]) continue;
    rates.set(code, toBankRate(BANK_SOURCES.trustbank, code, values[0], values[1], values[2] || null, updatedAt));
  }
  return [...rates.values()];
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'user-agent': 'BX/2.28 (+https://bx.uz)' },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`${url} HTTP ${response.status}`);
  return response.text();
}

export async function fetchBankExchangeRates(codes: string[] = DEFAULT_CODES): Promise<BankExchangeRate[]> {
  const wanted = new Set(codes);
  const requests = [
    fetchText(BANK_SOURCES.ipakYuli.url).then(parseIpakYuliRates),
    fetchText(BANK_SOURCES.aloqabank.url).then(parseAloqabankRates),
    fetchText(BANK_SOURCES.trustbank.url).then(parseTrustbankRates),
  ];
  const settled = await Promise.allSettled(requests);
  const rates = settled.flatMap(result => result.status === 'fulfilled' ? result.value : [])
    .filter(rate => wanted.has(rate.code));
  if (!rates.length) throw new Error('Official bank rates are unavailable');
  return rates;
}

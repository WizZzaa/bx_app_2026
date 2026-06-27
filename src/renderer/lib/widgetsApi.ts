import type { WeatherData, CurrencyRate } from '../../shared/types';

// Доступ к window.bx (расширяем тип из onecApi.ts через отдельную декларацию)
interface WidgetBridge {
  widgets?: {
    getWeather(): Promise<WeatherData>;
    getRates(codes?: string[]): Promise<CurrencyRate[]>;
    getRateOnDate(code: string, date: string): Promise<CurrencyRate | null>;
  };
}

// cbu.uz: курс валюты на дату (формат даты YYYY-MM-DD)
async function fetchRateOnDateDirect(code: string, date: string): Promise<CurrencyRate | null> {
  const r = await fetch(`https://cbu.uz/ru/arkhiv-kursov-valyut/json/${code}/${date}/`);
  const d = await r.json();
  const i = d[0];
  if (!i) return null;
  return { code: i.Ccy, name: i.CcyNm_RU, flag: FLAGS[i.Ccy] ?? '🏳️', value: parseFloat(i.Rate), diff: parseFloat(i.Diff) || 0, date: i.Date };
}

function bridge(): WidgetBridge | undefined {
  return (typeof window !== 'undefined' ? (window as unknown as { bx?: WidgetBridge }).bx : undefined);
}

const FLAGS: Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺' };

// --- Прямой fetch (для браузерного preview, где нет Electron) ---
const WMO: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Ясно', icon: '☀️' }, 1: { desc: 'Преим. ясно', icon: '🌤' },
  2: { desc: 'Переменная облачность', icon: '⛅' }, 3: { desc: 'Пасмурно', icon: '☁️' },
  45: { desc: 'Туман', icon: '🌫' }, 61: { desc: 'Дождь', icon: '🌧' },
  71: { desc: 'Снег', icon: '🌨' }, 95: { desc: 'Гроза', icon: '⛈' },
};

async function fetchWeatherDirect(): Promise<WeatherData> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.3111&longitude=69.2797' +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m';
  const r = await fetch(url);
  const d = await r.json();
  const c = d.current;
  const m = WMO[c.weather_code] ?? { desc: 'Погода', icon: '🌡' };
  return {
    city: 'Ташкент',
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature),
    desc: m.desc, icon: m.icon,
    humidity: Math.round(c.relative_humidity_2m),
    wind: Math.round(c.wind_speed_10m / 3.6),
  };
}

async function fetchRatesDirect(codes: string[]): Promise<CurrencyRate[]> {
  const r = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/');
  const d = await r.json();
  const wanted = new Set(codes);
  return d
    .filter((i: { Ccy: string }) => wanted.has(i.Ccy))
    .map((i: { Ccy: string; CcyNm_RU: string; Rate: string; Diff: string; Date: string }) => ({
      code: i.Ccy, name: i.CcyNm_RU, flag: FLAGS[i.Ccy] ?? '🏳️',
      value: parseFloat(i.Rate), diff: parseFloat(i.Diff) || 0, date: i.Date,
    }))
    .sort((a: CurrencyRate, b: CurrencyRate) => codes.indexOf(a.code) - codes.indexOf(b.code));
}

export const widgetsApi = {
  async getWeather(): Promise<WeatherData> {
    const b = bridge();
    if (b?.widgets) return b.widgets.getWeather();
    return fetchWeatherDirect();
  },
  async getRates(codes = ['USD', 'EUR', 'RUB']): Promise<CurrencyRate[]> {
    const b = bridge();
    if (b?.widgets) return b.widgets.getRates(codes);
    return fetchRatesDirect(codes);
  },
  async getRateOnDate(code: string, date: string): Promise<CurrencyRate | null> {
    const b = bridge();
    if (b?.widgets) return b.widgets.getRateOnDate(code, date);
    return fetchRateOnDateDirect(code, date);
  },
};

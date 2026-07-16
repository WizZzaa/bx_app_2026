import type { WeatherData, CurrencyRate, BankExchangeRate } from '../../shared/types';

// Доступ к window.bx (расширяем тип из onecApi.ts через отдельную декларацию)
interface WidgetBridge {
  widgets?: {
    getWeather(): Promise<WeatherData>;
    getRates(codes?: string[]): Promise<CurrencyRate[]>;
    getRateOnDate(code: string, date: string): Promise<CurrencyRate | null>;
    getBankRates(codes?: string[]): Promise<BankExchangeRate[]>;
  };
}

// cbu.uz: курс валюты на дату (формат даты YYYY-MM-DD)
async function fetchRateOnDateDirect(code: string, date: string): Promise<CurrencyRate | null> {
  const r = await fetch(`https://cbu.uz/ru/arkhiv-kursov-valyut/json/${code}/${date}/`);
  const d = await r.json();
  const i = d[0];
  if (!i) return null;
  return { code: i.Ccy, name: i.CcyNm_RU, flag: FLAGS[i.Ccy] ?? '', value: parseFloat(i.Rate), diff: parseFloat(i.Diff) || 0, date: i.Date };
}

function bridge(): WidgetBridge | undefined {
  return (typeof window !== 'undefined' ? (window as unknown as { bx?: WidgetBridge }).bx : undefined);
}

const FLAGS: Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺' };

function mapRate(i: { Ccy: string; CcyNm_RU: string; Rate: string; Diff: string; Date: string }): CurrencyRate {
  return { code: i.Ccy, name: i.CcyNm_RU, flag: FLAGS[i.Ccy] ?? '', value: parseFloat(i.Rate), diff: parseFloat(i.Diff) || 0, date: i.Date };
}

// --- Прямой fetch (для браузерного preview, где нет Electron) ---
type Condition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'storm' | 'snow' | 'fog'
const WMO: Record<number, { desc: string; icon: string; condition: Condition }> = {
  0:  { desc: 'Ясно',                  icon: '☀️', condition: 'sunny' },
  1:  { desc: 'Преим. ясно',           icon: '🌤', condition: 'partly_cloudy' },
  2:  { desc: 'Переменная облачность',  icon: '⛅', condition: 'partly_cloudy' },
  3:  { desc: 'Пасмурно',              icon: '☁️', condition: 'cloudy' },
  45: { desc: 'Туман',                 icon: '🌫', condition: 'fog' },
  48: { desc: 'Изморозь',              icon: '🌫', condition: 'fog' },
  51: { desc: 'Морось',                icon: '🌦', condition: 'rainy' },
  61: { desc: 'Дождь',                 icon: '🌧', condition: 'rainy' },
  63: { desc: 'Дождь',                 icon: '🌧', condition: 'rainy' },
  65: { desc: 'Сильный дождь',         icon: '🌧', condition: 'rainy' },
  71: { desc: 'Снег',                  icon: '🌨', condition: 'snow' },
  73: { desc: 'Снег',                  icon: '🌨', condition: 'snow' },
  75: { desc: 'Сильный снег',          icon: '❄️', condition: 'snow' },
  80: { desc: 'Ливень',               icon: '🌧', condition: 'rainy' },
  95: { desc: 'Гроза',                icon: '⛈', condition: 'storm' },
  99: { desc: 'Гроза с градом',       icon: '⛈', condition: 'storm' },
};

async function fetchWeatherDirect(): Promise<WeatherData> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.3111&longitude=69.2797' +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m';
  const r = await fetch(url);
  const d = await r.json();
  const c = d.current;
  const m = WMO[c.weather_code] ?? { desc: 'Погода', icon: '🌡', condition: 'sunny' as Condition };
  return {
    city: 'Ташкент',
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature),
    desc: m.desc, icon: m.icon,
    humidity: Math.round(c.relative_humidity_2m),
    wind: Math.round(c.wind_speed_10m / 3.6),
    condition: m.condition,
  };
}

async function fetchRatesDirect(codes: string[]): Promise<CurrencyRate[]> {
  const r = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/');
  const d = await r.json();
  const wanted = new Set(codes);
  return d
    .filter((i: { Ccy: string }) => wanted.has(i.Ccy))
    .map(mapRate)
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
  async getRatesOnDate(codes: string[], date: string): Promise<CurrencyRate[]> {
    const b = bridge();
    if (b?.widgets) {
      const widgets = b.widgets;
      const rates = await Promise.all(codes.map(code => widgets.getRateOnDate(code, date)));
      return rates.filter((rate): rate is CurrencyRate => Boolean(rate));
    }
    const response = await fetch(`https://cbu.uz/ru/arkhiv-kursov-valyut/json/all/${date}/`);
    if (!response.ok) throw new Error(`CBU ${response.status}`);
    const data = await response.json();
    const wanted = new Set(codes);
    return data.filter((item: { Ccy: string }) => wanted.has(item.Ccy)).map(mapRate)
      .sort((a: CurrencyRate, b: CurrencyRate) => codes.indexOf(a.code) - codes.indexOf(b.code));
  },
  async getBankRates(codes = ['USD', 'EUR', 'RUB']): Promise<BankExchangeRate[]> {
    const b = bridge();
    if (b?.widgets) return b.widgets.getBankRates(codes);
    const response = await fetch(`/__bx/bank-rates?codes=${encodeURIComponent(codes.join(','))}`);
    if (!response.ok) throw new Error(`Bank rates ${response.status}`);
    return response.json();
  },
};

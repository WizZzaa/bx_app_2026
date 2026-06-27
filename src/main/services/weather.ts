// Погода через open-meteo (бесплатно, без API-ключа). Координаты — Ташкент.
import type { WeatherData } from '../../shared/types';

const LAT = 41.3111;
const LON = 69.2797;
const CITY = 'Ташкент';

// Сопоставление WMO weather_code → описание + эмодзи
const WMO: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Ясно', icon: '☀️' },
  1: { desc: 'Преим. ясно', icon: '🌤' },
  2: { desc: 'Переменная облачность', icon: '⛅' },
  3: { desc: 'Пасмурно', icon: '☁️' },
  45: { desc: 'Туман', icon: '🌫' },
  48: { desc: 'Изморозь', icon: '🌫' },
  51: { desc: 'Морось', icon: '🌦' },
  61: { desc: 'Дождь', icon: '🌧' },
  63: { desc: 'Дождь', icon: '🌧' },
  65: { desc: 'Сильный дождь', icon: '🌧' },
  71: { desc: 'Снег', icon: '🌨' },
  73: { desc: 'Снег', icon: '🌨' },
  75: { desc: 'Сильный снег', icon: '❄️' },
  80: { desc: 'Ливень', icon: '🌧' },
  95: { desc: 'Гроза', icon: '⛈' },
};

function describe(code: number) {
  return WMO[code] ?? { desc: 'Погода', icon: '🌡' };
}

export async function fetchWeather(): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`open-meteo HTTP ${res.status}`);
  const data = await res.json();
  const c = data.current;
  const { desc, icon } = describe(c.weather_code);

  return {
    city: CITY,
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature),
    desc,
    icon,
    humidity: Math.round(c.relative_humidity_2m),
    wind: Math.round(c.wind_speed_10m / 3.6), // км/ч → м/с
  };
}

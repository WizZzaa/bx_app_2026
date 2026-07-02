// Погода через open-meteo (бесплатно, без API-ключа). Координаты — Ташкент.
import type { WeatherData } from '../../shared/types';

const LAT = 41.3111;
const LON = 69.2797;
const CITY = 'Ташкент';

type Condition = WeatherData['condition']

// Сопоставление WMO weather_code → описание + эмодзи + condition
const WMO: Record<number, { desc: string; icon: string; condition: Condition }> = {
  0:  { desc: 'Ясно',                 icon: '☀️',  condition: 'sunny' },
  1:  { desc: 'Преим. ясно',          icon: '🌤',  condition: 'partly_cloudy' },
  2:  { desc: 'Переменная облачность', icon: '⛅',  condition: 'partly_cloudy' },
  3:  { desc: 'Пасмурно',             icon: '☁️',  condition: 'cloudy' },
  45: { desc: 'Туман',                icon: '🌫',  condition: 'fog' },
  48: { desc: 'Изморозь',             icon: '🌫',  condition: 'fog' },
  51: { desc: 'Морось',               icon: '🌦',  condition: 'rainy' },
  53: { desc: 'Морось',               icon: '🌦',  condition: 'rainy' },
  55: { desc: 'Сильная морось',       icon: '🌧',  condition: 'rainy' },
  61: { desc: 'Дождь',                icon: '🌧',  condition: 'rainy' },
  63: { desc: 'Умеренный дождь',      icon: '🌧',  condition: 'rainy' },
  65: { desc: 'Сильный дождь',        icon: '🌧',  condition: 'rainy' },
  71: { desc: 'Снегопад',             icon: '🌨',  condition: 'snow' },
  73: { desc: 'Умеренный снег',       icon: '🌨',  condition: 'snow' },
  75: { desc: 'Сильный снег',         icon: '❄️',  condition: 'snow' },
  77: { desc: 'Снежные зёрна',        icon: '❄️',  condition: 'snow' },
  80: { desc: 'Ливень',               icon: '🌧',  condition: 'rainy' },
  81: { desc: 'Ливень',               icon: '🌧',  condition: 'rainy' },
  82: { desc: 'Сильный ливень',       icon: '⛈',  condition: 'storm' },
  85: { desc: 'Снежный ливень',       icon: '🌨',  condition: 'snow' },
  86: { desc: 'Сильный снежный ливень', icon: '❄️', condition: 'snow' },
  95: { desc: 'Гроза',                icon: '⛈',  condition: 'storm' },
  96: { desc: 'Гроза с градом',       icon: '⛈',  condition: 'storm' },
  99: { desc: 'Гроза с сильным градом', icon: '⛈', condition: 'storm' },
};

function describe(code: number): { desc: string; icon: string; condition: Condition } {
  return WMO[code] ?? { desc: 'Погода', icon: '🌡', condition: 'sunny' };
}

export async function fetchWeather(): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`open-meteo HTTP ${res.status}`);
  const data = await res.json();
  const c = data.current;
  const { desc, icon, condition } = describe(c.weather_code);

  return {
    city: CITY,
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature),
    desc,
    icon,
    humidity: Math.round(c.relative_humidity_2m),
    wind: Math.round(c.wind_speed_10m / 3.6), // км/ч → м/с
    condition,
  };
}

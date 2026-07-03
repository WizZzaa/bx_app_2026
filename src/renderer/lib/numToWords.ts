// Сумма прописью (RU + UZ latin) — общий модуль.
// Используется утилитой «Число прописью» и автозаполнением шаблонов документов.

// ─── Русский ───────────────────────────────────────────────────────────────

const RU_ONES_M  = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const RU_ONES_F  = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const RU_TEENS   = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
                    'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const RU_TENS    = ['', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят',
                    'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const RU_HUND    = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот',
                    'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

function ruPlural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function ruHundreds(n: number, feminine: boolean): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  if (h) parts.push(RU_HUND[h]);
  const rem = n % 100;
  if (rem >= 10 && rem <= 19) {
    parts.push(RU_TEENS[rem - 10]);
  } else {
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (t) parts.push(RU_TENS[t]);
    if (o) parts.push(feminine ? RU_ONES_F[o] : RU_ONES_M[o]);
  }
  return parts.join(' ');
}

export function toWordsRu(amount: number, currency: string): string {
  if (isNaN(amount) || amount < 0) return '';
  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);

  const chunks: { val: number; fem: boolean; one: string; few: string; many: string }[] = [
    { val: Math.floor(intPart / 1_000_000_000), fem: false, one: 'миллиард', few: 'миллиарда', many: 'миллиардов' },
    { val: Math.floor(intPart / 1_000_000) % 1000, fem: false, one: 'миллион', few: 'миллиона', many: 'миллионов' },
    { val: Math.floor(intPart / 1000) % 1000, fem: true, one: 'тысяча', few: 'тысячи', many: 'тысяч' },
    { val: intPart % 1000, fem: currency === 'sum', one: '', few: '', many: '' },
  ];

  const parts: string[] = [];
  for (const c of chunks) {
    if (!c.val) continue;
    const words = ruHundreds(c.val, c.fem);
    const label = c.one ? ruPlural(c.val, c.one, c.few, c.many) : '';
    parts.push(label ? `${words} ${label}` : words);
  }
  if (intPart === 0) parts.push('ноль');

  const currencyForms: Record<string, [string, string, string]> = {
    sum:    ['сум', 'сума', 'сумов'],
    usd:    ['доллар', 'доллара', 'долларов'],
    eur:    ['евро', 'евро', 'евро'],
    rub:    ['рубль', 'рубля', 'рублей'],
  };
  const decForms: Record<string, [string, string, string]> = {
    sum:    ['тийин', 'тийина', 'тийинов'],
    usd:    ['цент', 'цента', 'центов'],
    eur:    ['цент', 'цента', 'центов'],
    rub:    ['копейка', 'копейки', 'копеек'],
  };

  const cf = currencyForms[currency] ?? ['', '', ''];
  const df = decForms[currency] ?? ['', '', ''];

  const intWord = parts.join(' ') + ' ' + ruPlural(intPart % 1000 || intPart, cf[0], cf[1], cf[2]);
  const decWord = decPart.toString().padStart(2, '0') + ' ' + ruPlural(decPart, df[0], df[1], df[2]);

  return capitalize(intWord.trim()) + (decPart > 0 ? ' ' + decWord : '');
}

// ─── Узбекский ─────────────────────────────────────────────────────────────

const UZ_ONES = ['', 'bir', 'ikki', 'uch', 'to\'rt', 'besh', 'olti', 'yetti', 'sakkiz', 'to\'qqiz'];
const UZ_TEENS = ['o\'n', 'o\'n bir', 'o\'n ikki', 'o\'n uch', 'o\'n to\'rt', 'o\'n besh',
                  'o\'n olti', 'o\'n yetti', 'o\'n sakkiz', 'o\'n to\'qqiz'];
const UZ_TENS = ['', 'o\'n', 'yigirma', 'o\'ttiz', 'qirq', 'ellik',
                 'oltmish', 'yetmish', 'sakson', 'to\'qson'];
const UZ_HUND = ['', 'yuz', 'ikki yuz', 'uch yuz', 'to\'rt yuz', 'besh yuz',
                 'olti yuz', 'yetti yuz', 'sakkiz yuz', 'to\'qqiz yuz'];

function uzHundreds(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  if (h) parts.push(UZ_HUND[h]);
  const rem = n % 100;
  if (rem >= 10 && rem <= 19) {
    parts.push(UZ_TEENS[rem - 10]);
  } else {
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (t) parts.push(UZ_TENS[t]);
    if (o) parts.push(UZ_ONES[o]);
  }
  return parts.join(' ');
}

export function toWordsUz(amount: number, currency: string): string {
  if (isNaN(amount) || amount < 0) return '';
  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);

  const milliard = Math.floor(intPart / 1_000_000_000);
  const million  = Math.floor(intPart / 1_000_000) % 1000;
  const thousand = Math.floor(intPart / 1000) % 1000;
  const rest     = intPart % 1000;

  const parts: string[] = [];
  if (milliard) parts.push(uzHundreds(milliard) + ' milliard');
  if (million)  parts.push(uzHundreds(million) + ' million');
  if (thousand) parts.push(uzHundreds(thousand) + ' ming');
  if (rest)     parts.push(uzHundreds(rest));
  if (intPart === 0) parts.push('nol');

  const currencyForms: Record<string, [string, string]> = {
    sum: ['so\'m', 'tiyin'],
    usd: ['dollar', 'sent'],
    eur: ['evro', 'sent'],
    rub: ['rubl', 'tiyin'],
  };
  const [cur, dec] = currencyForms[currency] ?? ['', ''];

  const intStr = capitalize(parts.join(' ')) + ' ' + cur;
  const decStr = decPart.toString().padStart(2, '0') + ' ' + dec;
  return intStr.trim() + (decPart > 0 ? ' ' + decStr : '');
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}


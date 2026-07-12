import React from 'react';

// Денежный ввод с живыми разделителями тысяч: «1000000» → «1 000 000».
// Родитель хранит строку как есть; существующий парсинг (replace(/\s/g,'')) совместим.

function format(raw: string): string {
  // цифры + один разделитель дробной части (запятая или точка)
  const s = raw.replace(/[^\d.,]/g, '');
  const sepIdx = s.search(/[.,]/);
  let int = sepIdx === -1 ? s : s.slice(0, sepIdx);
  const frac = sepIdx === -1 ? '' : s.slice(sepIdx, sepIdx + 3).replace(/[.,](?=.*[.,])/g, '');
  int = int.replace(/^0+(?=\d)/, '');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return grouped + frac;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  big?: boolean;
  autoFocus?: boolean;
}

export default function MoneyInput({ value, onChange, placeholder = '0', big, autoFocus }: Props) {
  return (
    <input
      type="text"
      inputMode="decimal"
      autoFocus={autoFocus}
      value={value}
      onChange={e => onChange(format(e.target.value))}
      placeholder={placeholder}
      className={`w-full bg-bx-bg text-bx-text rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 tabular-nums ${
        big ? 'text-lg px-4 py-3' : 'text-sm px-3 py-2.5'
      }`}
    />
  );
}

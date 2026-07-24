import React from 'react';
import { MoneyField } from '../../components/ui/FormControls';

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
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  big?: boolean;
  autoFocus?: boolean;
  currency?: string;
  required?: boolean;
  containerClassName?: string;
}

export default function MoneyInput({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder = '0',
  big,
  autoFocus,
  currency = 'UZS',
  required,
  containerClassName,
}: Props) {
  return (
    <MoneyField
      label={label}
      hint={hint}
      error={error}
      required={required}
      containerClassName={containerClassName}
      currency={currency}
      autoFocus={autoFocus}
      value={value}
      onChange={e => onChange(format(e.target.value))}
      placeholder={placeholder}
      className={`tabular-nums ${big ? 'text-lg' : ''}`}
    />
  );
}

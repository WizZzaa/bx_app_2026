import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Icon from '../../lib/ui/Icon';
import { widgetsApi } from '../../lib/widgetsApi';
import type { CurrencyRate } from '../../../shared/types';
import { todayISO } from '../../lib/dates';

// Конвертер валют «на дату» — курс ЦБ РУз на любую историческую дату (для ГТД).

export default function CurrencyConverter() {
  const today = todayISO();
  const [code, setCode] = useState('USD');
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState('1');
  const [rate, setRate] = useState<CurrencyRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    setRate(null);
    try {
      const r = await widgetsApi.getRateOnDate(code, date);
      if (!r) setError('Курс на эту дату не найден');
      else setRate(r);
    } catch {
      setError('Ошибка запроса к cbu.uz');
    }
    setLoading(false);
  }

  const result = rate ? (parseFloat(amount || '0') * rate.value) : null;

  return (
    <Card title="Конвертер валют «на дату»" icon={<Icon name="exchange" className="h-5 w-5" />} description="Курс ЦБ РУз на любую историческую дату — для учёта ГТД.">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FormField label="Валюта" required>{field => (
            <select {...field} value={code} onChange={e => setCode(e.target.value)} className="w-full rounded-xl border border-bx-border bg-bx-bg px-3 py-2 text-sm text-bx-text">
              {['USD', 'EUR', 'RUB', 'GBP', 'KZT', 'CNY'].map(c => <option key={c}>{c}</option>)}
            </select>
          )}</FormField>
          <FormField label="Дата" required>{field => <input {...field} type="date" value={date} max={today} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-bx-border bg-bx-bg px-3 py-2 text-sm text-bx-text" />}</FormField>
          <FormField label="Сумма" required error={Number(amount) < 0 ? 'Введите сумму больше нуля' : undefined}>{field => <input {...field} type="number" min="0" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-xl border border-bx-border bg-bx-bg px-3 py-2 text-sm text-bx-text" />}</FormField>
        </div>

        <Button onClick={lookup} loading={loading}>Узнать курс</Button>

        {error && <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2.5">{error}</div>}

        {rate && result != null && (
          <div className="bg-bx-bg rounded-lg px-4 py-3 space-y-1">
            <div className="text-xs text-bx-muted">Курс на {rate.date}: 1 {rate.code} = {rate.value.toLocaleString('ru-RU')} сум</div>
            <div className="text-lg text-bx-text font-semibold">
              {parseFloat(amount || '0').toLocaleString('ru-RU')} {rate.code} = {result.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} сум
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

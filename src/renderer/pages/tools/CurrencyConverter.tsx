import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { DateField, MoneyField, Select } from '../../components/ui/FormControls';
import { StatePanel } from '../../components/ui/StatePanel';
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
  const [amountTouched, setAmountTouched] = useState(false);
  const numericAmount = Number(amount.replace(',', '.'));
  const amountInvalid = !Number.isFinite(numericAmount) || numericAmount <= 0;

  async function lookup() {
    setAmountTouched(true);
    if (amountInvalid) return;
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

  const result = rate ? numericAmount * rate.value : null;

  return (
    <Card title="Конвертер валют «на дату»" icon={<Icon name="exchange" className="h-5 w-5" />} description="Курс ЦБ РУз на любую историческую дату — для учёта ГТД.">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Select label="Валюта" required value={code} onChange={event => setCode(event.target.value)}>
            {['USD', 'EUR', 'RUB', 'GBP', 'KZT', 'CNY'].map(currency => <option key={currency}>{currency}</option>)}
          </Select>
          <DateField label="Дата курса" required value={date} max={today} onChange={event => setDate(event.target.value)} />
          <MoneyField
            label="Сумма"
            required
            currency={code}
            value={amount}
            error={amountTouched && amountInvalid ? 'Введите сумму больше нуля' : undefined}
            onBlur={() => setAmountTouched(true)}
            onChange={event => setAmount(event.target.value.replace(/[^\d.,]/g, ''))}
          />
        </div>

        <Button onClick={lookup} loading={loading} disabled={amountTouched && amountInvalid}>Узнать курс</Button>

        {error && (
          <StatePanel
            status="error"
            title="Курс не получен"
            description={error}
            action={<Button variant="secondary" onClick={lookup}>Повторить</Button>}
          />
        )}

        {rate && result != null && (
          <div className="bg-bx-bg rounded-lg px-4 py-3 space-y-1">
            <div className="text-xs text-bx-muted">Курс на {rate.date}: 1 {rate.code} = {rate.value.toLocaleString('ru-RU')} сум</div>
            <div className="text-lg text-bx-text font-semibold">
              {numericAmount.toLocaleString('ru-RU')} {rate.code} = {result.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} сум
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

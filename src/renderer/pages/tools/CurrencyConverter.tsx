import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { widgetsApi } from '../../lib/widgetsApi';
import type { CurrencyRate } from '../../../shared/types';

// Конвертер валют «на дату» — курс ЦБ РУз на любую историческую дату (для ГТД).

export default function CurrencyConverter() {
  const today = new Date().toISOString().slice(0, 10);
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
    <Card title="Конвертер валют «на дату»" icon="💱" description="Курс ЦБ РУз на любую историческую дату — для учёта ГТД.">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Валюта</label>
            <select value={code} onChange={e => setCode(e.target.value)} className="w-full bg-[#0f1117] text-slate-200 text-sm px-3 py-2 rounded-lg border border-[#1e2535]">
              {['USD', 'EUR', 'RUB', 'GBP', 'KZT', 'CNY'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Дата</label>
            <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} className="w-full bg-[#0f1117] text-slate-200 text-sm px-3 py-2 rounded-lg border border-[#1e2535]" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Сумма</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#0f1117] text-slate-200 text-sm px-3 py-2 rounded-lg border border-[#1e2535]" />
          </div>
        </div>

        <Button onClick={lookup} loading={loading}>Узнать курс</Button>

        {error && <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2.5">{error}</div>}

        {rate && result != null && (
          <div className="bg-[#0f1117] rounded-lg px-4 py-3 space-y-1">
            <div className="text-xs text-slate-500">Курс на {rate.date}: 1 {rate.code} = {rate.value.toLocaleString('ru-RU')} сум</div>
            <div className="text-lg text-white font-semibold">
              {parseFloat(amount || '0').toLocaleString('ru-RU')} {rate.code} = {result.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} сум
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

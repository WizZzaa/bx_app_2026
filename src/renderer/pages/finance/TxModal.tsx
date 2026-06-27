import React, { useState, useEffect } from 'react';
import type { BxTransaction, NewTransaction } from './useTransactions';
import { useExchangeRates } from '../../lib/useExchangeRates';

interface Props {
  tx?: BxTransaction | null;
  defaultType?: 'income' | 'expense';
  companyId: string | null;
  onSave: (data: NewTransaction) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const INCOME_CATS  = ['Выручка', 'Услуги', 'Аванс от клиента', 'Проценты', 'Возврат', 'Прочее'];
const EXPENSE_CATS = ['Зарплата', 'Аренда', 'Налоги и взносы', 'Закупка товара', 'Материалы', 'Коммуналка', 'Связь / интернет', 'Банковские услуги', 'Транспорт', 'Реклама', 'Прочее'];

const field = 'w-full bg-[#0f1117] text-slate-200 px-3 py-2 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm';
const today = new Date().toISOString().slice(0, 10);

export default function TxModal({ tx, defaultType, companyId, onSave, onDelete, onClose }: Props) {
  const isEdit = Boolean(tx);
  const [type, setType]               = useState<'income' | 'expense'>(tx?.type ?? defaultType ?? 'income');
  const [amount, setAmount]           = useState(tx?.amount ? String(tx.amount) : '');
  const [currency, setCurrency]       = useState(tx?.currency ?? 'UZS');
  const [exchangeRate, setExchangeRate] = useState(tx?.exchange_rate ?? 1);
  const [date, setDate]               = useState(tx?.date ?? today);
  const [category, setCategory]       = useState(tx?.category ?? '');
  const [counterparty, setCounterparty] = useState(tx?.counterparty ?? '');
  const [description, setDescription] = useState(tx?.description ?? '');
  const [status, setStatus]           = useState<'paid' | 'unpaid'>(tx?.status ?? 'paid');
  const [confirmDel, setConfirmDel]   = useState(false);

  const { rates } = useExchangeRates();

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Эффект обновления курса при смене валюты (только если не редактируем существующую транзакцию при первом рендере)
  const handleCurrencyChange = (cur: string) => {
    setCurrency(cur);
    if (cur === 'UZS') {
      setExchangeRate(1);
    } else {
      const liveRate = rates[cur] || 1;
      setExchangeRate(liveRate);
    }
  };

  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  function save() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onSave({
      company_id: companyId,
      type, amount: amt, date,
      currency,
      exchange_rate: currency === 'UZS' ? 1 : Number(exchangeRate),
      category: category.trim() || null,
      counterparty: counterparty.trim() || null,
      description: description.trim() || null,
      status,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#141820] border border-[#2a3447] rounded-2xl w-[440px] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2535]">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Редактировать операцию' : 'Новая операция'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Тип */}
          <div className="flex gap-2">
            <button onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${type === 'income' ? 'bg-emerald-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>↑ Доход</button>
            <button onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>↓ Расход</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Сумма</label>
              <input autoFocus type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className={field}
                onKeyDown={e => { if (e.key === 'Enter') save(); }} />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Валюта</label>
              <select value={currency} onChange={e => handleCurrencyChange(e.target.value)} className={field}>
                <option value="UZS">UZS (сум)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="RUB">RUB (₽)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {currency !== 'UZS' && (
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Курс к UZS</label>
                <input type="number" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} placeholder="1" className={field} />
              </div>
            )}
            <div className={currency === 'UZS' ? 'col-span-2' : ''}>
              <label className="text-[10px] text-slate-500 block mb-1">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Категория</label>
            <input list="tx-cats" value={category} onChange={e => setCategory(e.target.value)} placeholder="Выберите или впишите" className={field} />
            <datalist id="tx-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Контрагент</label>
            <input value={counterparty} onChange={e => setCounterparty(e.target.value)} placeholder="Клиент / поставщик" className={field} />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Комментарий</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Назначение" className={field} />
          </div>

          {/* Статус */}
          <div className="flex gap-2">
            <button onClick={() => setStatus('paid')}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${status === 'paid' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-[#1e2535] text-slate-500'}`}>✓ Оплачено</button>
            <button onClick={() => setStatus('unpaid')}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${status === 'unpaid' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'bg-[#1e2535] text-slate-500'}`}>
              ⏳ {type === 'income' ? 'Ждём оплату (дебиторка)' : 'К оплате (кредиторка)'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e2535]">
          <div>
            {isEdit && onDelete && (
              confirmDel
                ? <div className="flex items-center gap-2 text-xs"><span className="text-red-400">Удалить?</span><button onClick={onDelete} className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">Да</button><button onClick={() => setConfirmDel(false)} className="text-slate-500">нет</button></div>
                : <button onClick={() => setConfirmDel(true)} className="text-xs text-slate-600 hover:text-red-400">Удалить</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Отмена</button>
            <button onClick={save} disabled={!parseFloat(amount)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">{isEdit ? 'Сохранить' : 'Добавить'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


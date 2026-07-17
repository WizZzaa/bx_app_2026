import React, { useState, useEffect } from 'react';
import type { BxTransaction, NewTransaction } from './useTransactions';
import { useExchangeRates } from '../../lib/useExchangeRates';
import { todayISO } from '../../lib/dates';
import Icon from '../../lib/ui/Icon';
import { useCounterparties } from '../../lib/db/useCounterparties';

interface Props {
  tx?: BxTransaction | null;
  defaultType?: 'income' | 'expense';
  companyId: string | null;
  onSave: (data: NewTransaction) => void | Promise<void>;
  onDelete?: () => void;
  onClose: () => void;
}

const INCOME_CATS  = ['Выручка', 'Услуги', 'Аванс от клиента', 'Проценты', 'Возврат', 'Прочее'];
const EXPENSE_CATS = ['Зарплата', 'Аренда', 'Налоги и взносы', 'Закупка товара', 'Материалы', 'Коммуналка', 'Связь / интернет', 'Банковские услуги', 'Транспорт', 'Реклама', 'Прочее'];

const field = 'min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-semibold text-bx-text outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const today = todayISO();

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
  const [status, setStatus]           = useState<'paid' | 'unpaid'>(tx?.status ?? 'unpaid');
  const [confirmDel, setConfirmDel]   = useState(false);
  const [saving, setSaving]           = useState(false);

  const { rates } = useExchangeRates();
  const { counterparties } = useCounterparties(companyId);

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

  async function save() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || saving) return;
    setSaving(true);
    try {
      await onSave({
        company_id: companyId,
        type, amount: amt, date,
        currency,
        exchange_rate: currency === 'UZS' ? 1 : Number(exchangeRate),
        category: category.trim() || null,
        counterparty: counterparty.trim() || null,
        description: description.trim() || null,
        status,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="transaction-dialog-title" className="max-h-[92vh] w-[min(520px,calc(100vw-32px))] overflow-y-auto rounded-[24px] border border-bx-border bg-bx-surface shadow-2xl custom-scrollbar">
        <div className="flex items-center justify-between px-6 py-4 border-b border-bx-border">
          <div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Карточка обязательства</p><h2 id="transaction-dialog-title" className="mt-1 text-base font-black text-bx-text">{isEdit ? 'Изменить расчёт' : 'Добавить в контроль оплат'}</h2></div>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-bx-muted hover:bg-bx-surface-2 hover:text-bx-text"><Icon name="crossSmall" className="h-4 w-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Тип */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setType('income')}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-xs font-black transition-colors ${type === 'income' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-bx-border bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}><Icon name="trending" className="h-4 w-4" />Нам должны</button>
            <button type="button" onClick={() => setType('expense')}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-xs font-black transition-colors ${type === 'expense' ? 'border-red-600 bg-red-600 text-white' : 'border-bx-border bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}><Icon name="finance" className="h-4 w-4" />Мы должны</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted block mb-1.5">Сумма *</label>
              <input autoFocus type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className={field}
                onKeyDown={e => { if (e.key === 'Enter') void save(); }} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted block mb-1.5">Валюта</label>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted block mb-1.5">Курс к UZS</label>
                <input type="number" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} placeholder="1" className={field} />
              </div>
            )}
            <div className={currency === 'UZS' ? 'col-span-2' : ''}>
              <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted block mb-1.5">{status === 'unpaid' ? 'Срок оплаты' : 'Дата оплаты'}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted block mb-1.5">Категория</label>
            <input list="tx-cats" value={category} onChange={e => setCategory(e.target.value)} placeholder="Выберите или впишите" className={field} />
            <datalist id="tx-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted block mb-1.5">Контрагент</label>
            <input list="transaction-counterparties" value={counterparty} onChange={e => setCounterparty(e.target.value)} placeholder="Выберите из организаций или впишите" className={field} />
            <datalist id="transaction-counterparties">{counterparties.map(item => <option key={item.id} value={item.name}>{item.inn}</option>)}</datalist>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-bx-muted block mb-1.5">Назначение или комментарий</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Назначение" className={field} />
          </div>

          {/* Статус */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStatus('paid')}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-xs font-black transition-colors ${status === 'paid' ? 'border-blue-500/40 bg-blue-600 text-white' : 'border-bx-border bg-bx-surface-2 text-bx-muted'}`}><Icon name="check" className="h-4 w-4" />Оплачено</button>
            <button type="button" onClick={() => setStatus('unpaid')}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-xs font-black transition-colors ${status === 'unpaid' ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200' : 'border-bx-border bg-bx-surface-2 text-bx-muted'}`}>
              <Icon name="clock" className="h-4 w-4" />{type === 'income' ? 'Ждём оплату' : 'К оплате'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-bx-border">
          <div>
            {isEdit && onDelete && (
              confirmDel
                ? <div className="flex items-center gap-2 text-xs"><span className="text-red-500">Удалить?</span><button type="button" onClick={onDelete} className="min-h-9 rounded-lg bg-red-500 px-3 font-bold text-white">Да</button><button type="button" onClick={() => setConfirmDel(false)} className="min-h-9 px-2 text-bx-muted">Нет</button></div>
                : <button type="button" onClick={() => setConfirmDel(true)} className="min-h-10 text-xs font-bold text-bx-muted hover:text-red-500">Удалить</button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="min-h-11 px-4 text-xs font-bold text-bx-muted hover:text-bx-text">Отмена</button>
            <button type="button" onClick={() => void save()} disabled={!parseFloat(amount) || saving} className="min-h-11 rounded-xl bg-blue-600 px-5 text-xs font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Сохраняю…' : isEdit ? 'Сохранить изменения' : 'Добавить в контроль'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

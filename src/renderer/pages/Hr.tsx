import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmployees, type BxEmployee, type NewEmployee } from './hr/useEmployees'
import { calcPayroll, fmtSum, DEFAULT_RATES, type PayrollRates } from './hr/payroll'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'
import { exportPayrollToExcel } from '../lib/excelExport'
import { setCalcPrefill } from './calc/prefill'
import { useEconomicIndicators } from '../lib/useEconomicIndicators'

const EMPTY: NewEmployee = {
  company_id: null, full_name: '', position: '', department: '', hire_date: '',
  salary: 0, employment_type: 'основное', status: 'active',
  pinfl: '', inn: '', phone: '', note: '',
};

const field = 'w-full bg-bx-bg text-bx-text px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm';

export default function Hr() {
  const { active } = useCompany();
  const { employees, add, update, remove } = useEmployees(active?.id ?? null);
  const toast = useToast()
  const navigate = useNavigate();
  const { brv, mrot } = useEconomicIndicators()

  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch]     = useState('');
  const [showFired, setShowFired] = useState(false);
  const [form, setForm]         = useState<NewEmployee>(EMPTY);
  const [rates, setRates]       = useState<PayrollRates>(DEFAULT_RATES);

  useEffect(() => {
    if (brv && mrot) {
      setRates(prev => ({ ...prev, brv, mrot }))
    }
  }, [brv, mrot])
  const [saved, setSaved]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const filtered = useMemo(() => {
    let list = employees.filter(e => showFired || e.status === 'active');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.full_name.toLowerCase().includes(q) || (e.position||'').toLowerCase().includes(q));
    }
    return list;
  }, [employees, search, showFired]);

  // Итоги по активным
  const totals = useMemo(() => {
    const act = employees.filter(e => e.status === 'active');
    const fund = act.reduce((s, e) => s + (e.salary || 0), 0);
    const cost = act.reduce((s, e) => s + calcPayroll(e.salary, rates).employerCost, 0);
    return { count: act.length, fund, cost };
  }, [employees, rates]);

  const current: BxEmployee | null = activeId ? (employees.find(e => e.id === activeId) ?? null) : null;
  const editing = creating || Boolean(current);
  const data = creating ? form : (current ? toForm(current) : EMPTY);
  const payroll = calcPayroll(data.salary, rates);

  function toForm(e: BxEmployee): NewEmployee {
    return {
      company_id: e.company_id, full_name: e.full_name, position: e.position, department: e.department,
      hire_date: e.hire_date, salary: e.salary, employment_type: e.employment_type, status: e.status,
      pinfl: e.pinfl, inn: e.inn, phone: e.phone, note: e.note,
    };
  }

  function openNew() { setCreating(true); setActiveId(null); setForm({ ...EMPTY, company_id: active?.id ?? null }); setConfirmDel(false); }
  function openEmp(e: BxEmployee) { setCreating(false); setActiveId(e.id); setConfirmDel(false); }

  function setField<K extends keyof NewEmployee>(k: K, v: NewEmployee[K]) {
    if (creating) setForm(prev => ({ ...prev, [k]: v }));
    else if (current) update(current.id, { [k]: v } as Partial<NewEmployee>);
  }

  async function saveNew() {
    if (!form.full_name.trim()) return;
    const created = await add(form);
    if (created) { setCreating(false); setActiveId(created.id); flash(); toast.success('Сотрудник добавлен'); }
  }
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  async function del() { if (current) { await remove(current.id); setActiveId(null); setConfirmDel(false); toast.info('Сотрудник удалён'); } }

  // Платёжная ведомость по всем активным сотрудникам за месяц
  function printPayrollSheet() {
    const act = employees.filter(e => e.status === 'active');
    if (act.length === 0) { toast.error('Нет активных сотрудников'); return; }
    const w = window.open('', '_blank'); if (!w) return;
    const month = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    let tGross = 0, tNdfl = 0, tInps = 0, tNet = 0, tSoc = 0, tCost = 0;
    const rows = act.map((e, i) => {
      const p = calcPayroll(e.salary, rates);
      tGross += p.gross; tNdfl += p.ndfl; tInps += p.inps; tNet += p.net; tSoc += p.social; tCost += p.employerCost;
      return `<tr>
        <td>${i + 1}</td><td>${e.full_name}</td><td>${e.position || ''}</td>
        <td class="r">${fmtSum(p.gross)}</td><td class="r">${fmtSum(p.ndfl)}</td><td class="r">${fmtSum(p.inps)}</td>
        <td class="r b">${fmtSum(p.net)}</td><td class="r">${fmtSum(p.social)}</td><td class="sig"></td></tr>`;
    }).join('');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Платёжная ведомость</title><style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:30px;color:#000}
      h2{margin:0 0 2px}.sub{color:#666;font-size:11px;margin-bottom:14px}
      table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:5px 7px}
      th{background:#f3f4f6;font-size:11px}.r{text-align:right}.b{font-weight:bold}
      .sig{width:90px}tfoot td{font-weight:bold;background:#fafafa}
      @media print{body{margin:12mm}}</style></head><body>
      <h2>Платёжная ведомость</h2>
      <div class="sub">за ${month}${active?.name ? ' · ' + active.name : ''} · ставки: НДФЛ ${rates.ndfl}%, ИНПС ${rates.inps}%, соцналог ${rates.social}%</div>
      <table><thead><tr>
        <th>№</th><th>ФИО</th><th>Должность</th><th>Начислено</th><th>НДФЛ</th><th>ИНПС</th><th>К выплате</th><th>Соцналог</th><th>Подпись</th>
      </tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td colspan="3">ИТОГО (${act.length})</td><td class="r">${fmtSum(tGross)}</td><td class="r">${fmtSum(tNdfl)}</td><td class="r">${fmtSum(tInps)}</td><td class="r">${fmtSum(tNet)}</td><td class="r">${fmtSum(tSoc)}</td><td></td></tr></tfoot>
      </table>
      <p style="margin-top:20px;font-size:11px">Полная стоимость для работодателя: <b>${fmtSum(tCost)}</b></p>
      <p style="margin-top:24px;font-size:11px">Руководитель ___________________     Гл. бухгалтер ___________________</p>
      <p style="margin-top:16px;color:#999;font-size:10px">Сформировано в BX. Сверяйтесь со ставками на soliq.uz.</p>
      </body></html>`);
    w.document.close(); w.focus(); w.print();
  }

  function printPayslip() {
    const w = window.open('', '_blank'); if (!w) return;
    const p = payroll;
    const row = (l: string, v: string, b = false) => `<tr><td style="padding:4px 8px">${l}</td><td style="padding:4px 8px;text-align:right;${b?'font-weight:bold':''}">${v}</td></tr>`;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Расчётный лист</title>
      <style>body{font-family:Arial,sans-serif;font-size:13px;margin:40px;color:#000}h2{margin:0 0 4px}table{border-collapse:collapse;width:100%;max-width:480px;margin-top:12px}td{border-bottom:1px solid #eee}@media print{body{margin:15mm}}</style>
      </head><body>
      <h2>Расчётный лист</h2>
      <div style="color:#666;font-size:12px">за ${new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</div>
      <p><b>${data.full_name||'—'}</b><br>${data.position||''} ${data.department?'· '+data.department:''}<br>${data.pinfl?'ПИНФЛ: '+data.pinfl:''}</p>
      <table>
        ${row('Начислено (оклад)', fmtSum(p.gross), true)}
        ${row(`НДФЛ (${rates.ndfl}%)`, '− '+fmtSum(p.ndfl))}
        ${row(`ИНПС (${rates.inps}%)`, '− '+fmtSum(p.inps))}
        ${row('Итого удержано', '− '+fmtSum(p.totalWithheld))}
        ${row('К выплате на руки', fmtSum(p.net), true)}
      </table>
      <table style="margin-top:16px">
        ${row(`Соцналог работодателя (${rates.social}%)`, fmtSum(p.social))}
        ${row('Полная стоимость для работодателя', fmtSum(p.employerCost), true)}
      </table>
      <p style="margin-top:24px;color:#999;font-size:11px">Сформировано в BX — Помощник Бухгалтера. Сверяйтесь с актуальными ставками на soliq.uz.</p>
      </body></html>`);
    w.document.close(); w.focus(); w.print();
  }

  // Экспорт в Excel
  const handleExportExcel = () => {
    const activeEmployees = employees.filter(e => e.status === 'active')
    if (activeEmployees.length === 0) {
      toast.error('Нет активных сотрудников для экспорта')
      return
    }
    exportPayrollToExcel(activeEmployees, rates.brv, rates.mrot, `Ведомость_${active?.name || 'компания'}_${new Date().toISOString().slice(0, 7)}`)
    toast.success('Ведомость экспортирована в Excel')
  }

  // Нативный экспорт расчетного листа в PDF
  const handleExportPayslipPDF = async () => {
    const p = payroll
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Расчётный лист</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:13px;margin:40px;color:#000}
        h2{margin:0 0 4px}
        table{border-collapse:collapse;width:100%;max-width:480px;margin-top:12px}
        td{border-bottom:1px solid #eee;padding:6px 8px}
      </style>
      </head><body>
      <h2>Расчётный лист</h2>
      <div style="color:#666;font-size:12px">за ${new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</div>
      <p><b>${data.full_name||'—'}</b><br>${data.position||''} ${data.department?'· '+data.department:''}<br>${data.pinfl?'ПИНФЛ: '+data.pinfl:''}</p>
      <table>
        <tr><td><b>Начислено (оклад)</b></td><td style="text-align:right;font-weight:bold">${fmtSum(p.gross)}</td></tr>
        <tr><td>НДФЛ (${rates.ndfl}%)</td><td style="text-align:right">− ${fmtSum(p.ndfl)}</td></tr>
        <tr><td>ИНПС (${rates.inps}%)</td><td style="text-align:right">− ${fmtSum(p.inps)}</td></tr>
        <tr><td>Итого удержано</td><td style="text-align:right">− ${fmtSum(p.totalWithheld)}</td></tr>
        <tr><td><b>К выплате на руки</b></td><td style="text-align:right;font-weight:bold">${fmtSum(p.net)}</td></tr>
      </table>
      <table style="margin-top:16px">
        <tr><td>Соцналог работодателя (${rates.social}%)</td><td style="text-align:right">${fmtSum(p.social)}</td></tr>
        <tr><td><b>Полная стоимость для работодателя</b></td><td style="text-align:right;font-weight:bold">${fmtSum(p.employerCost)}</td></tr>
      </table>
      <p style="margin-top:24px;color:#999;font-size:11px">Сформировано в BX — Помощник Бухгалтера. Сверяйтесь с актуальными ставками на soliq.uz.</p>
      </body></html>`

    if (window.bx?.pdf?.generate) {
      const ok = await window.bx.pdf.generate(html, `Расчетный_лист_${data.full_name.replace(/\s+/g, '_')}.pdf`)
      if (ok) toast.success('PDF успешно сохранен')
    } else {
      toast.error('Функция генерации PDF доступна только в Electron')
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Список сотрудников */}
      <aside className="w-64 flex-shrink-0 border-r border-bx-border flex flex-col">
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-base font-semibold text-bx-text">Сотрудники</h1>
          <p className="text-xs text-slate-500 mt-0.5">Кадры и зарплата</p>
        </div>
        <div className="px-3 pb-2 space-y-1.5">
          <button onClick={openNew} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">+ Сотрудник</button>
          <button onClick={printPayrollSheet} className="w-full py-2 bg-bx-surface-2 hover:bg-bx-border-2 text-slate-300 text-xs font-medium rounded-lg transition-colors">🖨 Ведомость за месяц</button>
          <button onClick={handleExportExcel} className="w-full py-2 bg-bx-surface-2 hover:bg-bx-border-2 text-slate-300 text-xs font-medium rounded-lg transition-colors">📊 Экспорт ведомости (XLSX)</button>
        </div>
        <div className="px-3 pb-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className={`${field} text-xs py-1.5`} />
        </div>
        <div className="px-3 pb-2">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
            <input type="checkbox" checked={showFired} onChange={e => setShowFired(e.target.checked)} className="accent-blue-500" />
            Показывать уволенных
          </label>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {filtered.map(e => (
            <button key={e.id} onClick={() => openEmp(e)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeId === e.id && !creating ? 'bg-blue-600/20' : 'hover:bg-bx-surface-2'}`}>
              <p className={`text-xs font-medium ${e.status === 'fired' ? 'text-slate-600 line-through' : activeId === e.id && !creating ? 'text-blue-400' : 'text-bx-text'}`}>{e.full_name}</p>
              <p className="text-[10px] text-slate-600">{e.position || '—'} · {fmtSum(e.salary)}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-[11px] text-slate-600 text-center py-6">Нет сотрудников</p>}
        </nav>
        {/* Итоги */}
        <div className="px-4 py-3 border-t border-bx-border space-y-1">
          <div className="flex justify-between text-[11px]"><span className="text-slate-500">Активных</span><span className="text-slate-300">{totals.count}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-slate-500">ФОТ</span><span className="text-slate-300">{fmtSum(totals.fund)}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-slate-500">Расходы</span><span className="text-slate-400">{fmtSum(totals.cost)}</span></div>
        </div>
      </aside>

      {/* Детали */}
      <div className="flex-1 overflow-y-auto">
        {!editing ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <p className="text-5xl mb-3">👥</p>
            <h2 className="text-lg font-semibold text-bx-text mb-2">HR и зарплата</h2>
            <p className="text-sm text-slate-500 max-w-sm mb-6">Добавьте сотрудника или выберите из списка. Зарплата считается автоматически: НДФЛ, ИНПС, соцналог, на руки.</p>
            <button onClick={openNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg">+ Добавить сотрудника</button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-bx-text">{creating ? 'Новый сотрудник' : data.full_name || 'Сотрудник'}</h2>
              {saved && <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Сохранено</span>}
            </div>

            {/* Карточка */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 block mb-1">ФИО *</label>
                <input value={data.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Иванов Иван Иванович" className={field} />
              </div>
              <div><label className="text-[10px] text-slate-500 block mb-1">Должность</label><input value={data.position||''} onChange={e => setField('position', e.target.value)} className={field} /></div>
              <div><label className="text-[10px] text-slate-500 block mb-1">Отдел</label><input value={data.department||''} onChange={e => setField('department', e.target.value)} className={field} /></div>
              <div><label className="text-[10px] text-slate-500 block mb-1">Оклад (сум/мес)</label><input type="number" value={data.salary||''} onChange={e => setField('salary', parseFloat(e.target.value)||0)} className={field} /></div>
              <div><label className="text-[10px] text-slate-500 block mb-1">Дата приёма</label><input type="date" value={data.hire_date||''} onChange={e => setField('hire_date', e.target.value)} className={field} /></div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Тип занятости</label>
                <select value={data.employment_type} onChange={e => setField('employment_type', e.target.value as NewEmployee['employment_type'])} className={field}>
                  <option value="основное">Основное место</option>
                  <option value="совместительство">Совместительство</option>
                  <option value="договор ГПХ">Договор ГПХ</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Статус</label>
                <select value={data.status} onChange={e => setField('status', e.target.value as NewEmployee['status'])} className={field}>
                  <option value="active">Работает</option>
                  <option value="fired">Уволен</option>
                </select>
              </div>
              <div><label className="text-[10px] text-slate-500 block mb-1">ПИНФЛ</label><input value={data.pinfl||''} onChange={e => setField('pinfl', e.target.value)} className={field} /></div>
              <div><label className="text-[10px] text-slate-500 block mb-1">ИНН</label><input value={data.inn||''} onChange={e => setField('inn', e.target.value)} className={field} /></div>
              <div className="col-span-2"><label className="text-[10px] text-slate-500 block mb-1">Телефон</label><input value={data.phone||''} onChange={e => setField('phone', e.target.value)} className={field} /></div>
            </div>

            {creating && (
              <div className="flex gap-2 mb-6">
                <button onClick={saveNew} disabled={!form.full_name.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">Создать</button>
                <button onClick={() => setCreating(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm">Отмена</button>
              </div>
            )}

            {/* Расчёт зарплаты */}
            <div className="bg-bx-surface border border-bx-border rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-bx-text">💰 Расчёт зарплаты</h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>Ставки %:</span>
                  <label className="flex items-center gap-1">НДФЛ<input type="number" step="0.1" value={rates.ndfl} onChange={e => setRates(r => ({...r, ndfl: parseFloat(e.target.value)||0}))} className="w-12 bg-bx-bg border border-bx-border-2 rounded px-1 py-0.5 text-slate-300" /></label>
                  <label className="flex items-center gap-1">ИНПС<input type="number" step="0.1" value={rates.inps} onChange={e => setRates(r => ({...r, inps: parseFloat(e.target.value)||0}))} className="w-12 bg-bx-bg border border-bx-border-2 rounded px-1 py-0.5 text-slate-300" /></label>
                  <label className="flex items-center gap-1">Соц<input type="number" step="0.1" value={rates.social} onChange={e => setRates(r => ({...r, social: parseFloat(e.target.value)||0}))} className="w-12 bg-bx-bg border border-bx-border-2 rounded px-1 py-0.5 text-slate-300" /></label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                <Row label="Начислено (оклад)" value={fmtSum(payroll.gross)} strong />
                <Row label={`Соцналог работодателя (${rates.social}%)`} value={fmtSum(payroll.social)} muted />
                <Row label={`НДФЛ (${rates.ndfl}%)`} value={'− ' + fmtSum(payroll.ndfl)} />
                <Row label="Полная стоимость" value={fmtSum(payroll.employerCost)} accent />
                <Row label={`ИНПС (${rates.inps}%)`} value={'− ' + fmtSum(payroll.inps)} />
                <div />
                <Row label="К выплате на руки" value={fmtSum(payroll.net)} strong accent />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={printPayslip} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg">🖨️ Расчётный лист</button>
                <button onClick={handleExportPayslipPDF} className="px-4 py-2 border border-bx-border-2 text-slate-300 hover:text-white text-xs font-medium rounded-lg bg-bx-surface hover:bg-bx-surface-2 transition-colors">📥 Скачать PDF</button>
                <button onClick={() => { setCalcPrefill({ calc: 'vacation', annual: data.salary * 12 }); navigate('/calc'); }}
                  title="Открыть калькулятор отпускных с годовым доходом сотрудника"
                  className="px-4 py-2 border border-bx-border-2 text-slate-300 hover:text-white text-xs font-medium rounded-lg bg-bx-surface hover:bg-bx-surface-2 transition-colors">🏖 Отпускные</button>
                <button onClick={() => { setCalcPrefill({ calc: 'sick', annual: data.salary * 12 }); navigate('/calc'); }}
                  title="Открыть калькулятор больничных с годовым доходом сотрудника"
                  className="px-4 py-2 border border-bx-border-2 text-slate-300 hover:text-white text-xs font-medium rounded-lg bg-bx-surface hover:bg-bx-surface-2 transition-colors">🤒 Больничные</button>
              </div>
              {!creating && current && (
                confirmDel ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-400">Удалить сотрудника?</span>
                    <button onClick={del} className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">Да</button>
                    <button onClick={() => setConfirmDel(false)} className="text-slate-500">нет</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDel(true)} className="text-xs text-slate-600 hover:text-red-400">Удалить</button>
                )
              )}
            </div>

            <p className="text-[10px] text-slate-700 mt-4">⚠️ Ставки указаны по умолчанию (НДФЛ 12%, ИНПС 0.1%, соцналог 12%). Сверяйтесь с актуальной редакцией НК РУз на soliq.uz — для бюджетных организаций и отдельных режимов ставки отличаются.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong, muted, accent }: { label: string; value: string; strong?: boolean; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-bx-border/60 py-1">
      <span className={`text-xs ${muted ? 'text-slate-600' : 'text-slate-500'}`}>{label}</span>
      <span className={`${strong ? 'font-semibold' : ''} ${accent ? 'text-emerald-400' : muted ? 'text-slate-500' : 'text-bx-text'} text-sm`}>{value}</span>
    </div>
  );
}

import React, { useState } from 'react';
import CalcResult from './CalcResult';

// Утилизационный сбор РУз: Постановление Президента РУз № ПП-3292 (2017) и изменения
// Формула: Базовая ставка × коэффициент объёма двигателя × коэффициент возраста
// Базовая ставка: 3 300 000 UZS (2024–2026)

const BASE_RATE = 3_300_000;

type VehicleCategory = 'passenger' | 'commercial' | 'moto';

interface EngineGroup {
  label: string;
  coeff: number;
}

const PASSENGER_ENGINES: EngineGroup[] = [
  { label: 'до 1 000 куб.см', coeff: 1.5 },
  { label: '1 001 – 2 000 куб.см', coeff: 2.5 },
  { label: '2 001 – 3 000 куб.см', coeff: 5.0 },
  { label: '3 001 – 3 500 куб.см', coeff: 10.0 },
  { label: 'свыше 3 500 куб.см', coeff: 15.0 },
];

const COMMERCIAL_ENGINES: EngineGroup[] = [
  { label: 'Грузовой до 5 т (дизель)', coeff: 8.0 },
  { label: 'Грузовой 5–20 т', coeff: 15.0 },
  { label: 'Грузовой свыше 20 т', coeff: 30.0 },
  { label: 'Автобус до 20 мест', coeff: 8.0 },
  { label: 'Автобус свыше 20 мест', coeff: 15.0 },
];

const MOTO_ENGINES: EngineGroup[] = [
  { label: 'до 150 куб.см', coeff: 0.5 },
  { label: '151 – 500 куб.см', coeff: 1.0 },
  { label: 'свыше 500 куб.см', coeff: 2.0 },
];

const AGE_COEFFS = [
  { label: 'Новый (до 3 лет)', coeff: 1.0 },
  { label: '3–7 лет', coeff: 1.5 },
  { label: '7–10 лет', coeff: 2.5 },
  { label: 'Более 10 лет', coeff: 4.0 },
];

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

export default function RecyclingCalc() {
  const [category, setCategory] = useState<VehicleCategory>('passenger');
  const [engineIdx, setEngineIdx] = useState(0);
  const [ageIdx, setAgeIdx] = useState(0);

  const engines =
    category === 'passenger' ? PASSENGER_ENGINES :
    category === 'commercial' ? COMMERCIAL_ENGINES : MOTO_ENGINES;

  const safeEngineIdx = Math.min(engineIdx, engines.length - 1);
  const engineCoeff = engines[safeEngineIdx].coeff;
  const ageCoeff = AGE_COEFFS[ageIdx].coeff;
  const fee = BASE_RATE * engineCoeff * ageCoeff;

  function switchCategory(c: VehicleCategory) {
    setCategory(c);
    setEngineIdx(0);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['passenger', 'commercial', 'moto'] as VehicleCategory[]).map(c => (
          <button key={c} onClick={() => switchCategory(c)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${category === c ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
          >
            {c === 'passenger' ? '🚗 Легковые' : c === 'commercial' ? '🚛 Коммерч.' : '🏍 Мото'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs text-bx-muted mb-1.5">Объём двигателя / тип</label>
        <select
          value={safeEngineIdx}
          onChange={e => setEngineIdx(Number(e.target.value))}
          className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm"
        >
          {engines.map((e, i) => (
            <option key={i} value={i}>{e.label} (коэфф. ×{e.coeff})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-bx-muted mb-1.5">Возраст транспортного средства</label>
        <div className="grid grid-cols-2 gap-2">
          {AGE_COEFFS.map((a, i) => (
            <button key={i} onClick={() => setAgeIdx(i)}
              className={`py-2 px-3 rounded-lg text-xs text-left transition-colors ${ageIdx === i ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
            >
              {a.label}<br /><span className="opacity-75">×{a.coeff}</span>
            </button>
          ))}
        </div>
      </div>

      <CalcResult
        title={`Утильсбор — ${engines[safeEngineIdx].label}, ${AGE_COEFFS[ageIdx].label.toLowerCase()}`}
        rows={[
          { label: 'Базовая ставка', value: `${fmt(BASE_RATE)} UZS` },
          { label: 'Коэфф. объёма/типа', value: `×${engineCoeff}` },
          { label: 'Коэфф. возраста', value: `×${ageCoeff}` },
          { label: 'Утилизационный сбор', value: `${fmt(fee)} UZS`, highlight: true },
        ]}
      />

      <p className="text-[11px] text-bx-muted">
        ПП РУз № ПП-3292, с изм. Базовая ставка 3 300 000 UZS (2024–2026).
        Уплачивается до регистрации ТС в ГИБДД. Уточняйте актуальные коэффициенты на сайте ГНК.
      </p>
    </div>
  );
}

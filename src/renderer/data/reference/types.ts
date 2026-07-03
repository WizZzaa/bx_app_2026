// Типы справочных данных. Слой абстрагирован так, чтобы позже заменить
// статические TS-модули на загрузку из локальной БД (SQLite) и серверную
// синхронизацию без изменения UI.

export interface DataMeta {
  /** Проверено ли значение по официальному источнику */
  verified: boolean;
  /** Источник (URL или название документа) */
  source?: string;
  /** Дата актуальности данных (YYYY-MM-DD) */
  updatedAt: string;
}

/** Историческое значение показателя (БРВ, МРОТ, ставка рефинансирования) */
export interface IndicatorValue {
  /** Значение (сум для БРВ/МРОТ, % для ставки) */
  value: number;
  /** Действует с даты (YYYY-MM-DD) */
  from: string;
  /** Действует по (YYYY-MM-DD), пусто = по настоящее время */
  to?: string;
  /** Основание (номер постановления/указа) */
  basis?: string;
  /** Сверено ли значение с официальным источником */
  verified?: boolean;
}

export interface Indicator {
  key: string;            // 'brv' | 'mrot' | 'refi'
  name: string;           // 'Базовая расчётная величина'
  shortName: string;      // 'БРВ'
  unit: string;           // 'сум' | '%'
  hint?: string;          // когда применять
  history: IndicatorValue[]; // новые сверху
  meta: DataMeta;
}

/** Ставка налога */
export interface TaxRate {
  name: string;           // 'НДС'
  rate: string;           // '12%' (строкой — бывают диапазоны/условия)
  base: string;           // объект налогообложения
  note?: string;          // условия применения
  regime?: string;        // 'ОСН' | 'Налог с оборота' | 'все'
}

/** Код бюджетной классификации / счёт для платёжки */
export interface PaymentCode {
  code: string;           // КБК / код назначения
  name: string;           // назначение платежа
  account?: string;       // казначейский счёт
  category: string;       // группа (налоги, штрафы, пошлины)
}

export interface ReferenceSection {
  indicators: Indicator[];
  taxes: TaxRate[];
  paymentCodes: PaymentCode[];
  meta: DataMeta;
}

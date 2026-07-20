import { Dexie, type Table } from 'dexie'
import type { DocTemplate } from '../../data/templates'

export interface BxTransaction {
  id: string
  user_id: string
  company_id: string | null
  type: 'income' | 'expense'
  amount: number
  currency?: string        // 'UZS', 'USD', 'EUR', 'RUB'
  exchange_rate?: number   // Курс валюты к UZS на дату транзакции
  date: string            // YYYY-MM-DD
  category: string | null
  counterparty: string | null
  description: string | null
  status: 'paid' | 'unpaid'
  created_at: string
  updated_at: string
}

export interface BxEmployee {
  [key: string]: unknown
  id: string
  company_id: string | null
  full_name: string
  position?: string | null
  salary: number
  phone?: string | null
  employment_type?: string | null
  status?: string | null
  updated_at?: string | null
  last_synced_at?: string | null
}

export interface BxCounterparty {
  id: string
  company_id: string | null
  name: string
  inn: string
  mfo: string | null
  bank_name: string | null
  bank_account: string | null
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface SyncConflict {
  id: string
  entity: 'transactions' | 'employees'
  targetId: string
  localData: SyncEntityData
  serverData: SyncEntityData
  createdAt: string
}

export type SyncEntityData = Record<string, unknown>

export interface ExchangeRate {
  code: string // USD, EUR, RUB
  rate: number // курс к UZS
  date: string // дата в формате YYYY-MM-DD
  diff: string // разница
}

export class BusinessBxDatabase extends Dexie {
  transactions!: Table<BxTransaction & { last_synced_at?: string | null }, string>
  employees!: Table<BxEmployee, string> // Избегаем циклического импорта
  counterparties!: Table<BxCounterparty, string>
  conflicts!: Table<SyncConflict, string>
  templates!: Table<DocTemplate, string>
  exchange_rates!: Table<ExchangeRate, string>

  constructor() {
    super('BusinessBxDatabase')
    this.version(4).stores({
      transactions: 'id, company_id, date, type',
      employees: 'id, company_id, full_name, status',
      counterparties: 'id, company_id, inn, name',
      conflicts: 'id, entity, targetId',
      templates: 'id, category, title',
      exchange_rates: 'code, date'
    })
  }
}

export const db = new BusinessBxDatabase()

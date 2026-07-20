import * as XLSX from 'xlsx'
import type { BxTransaction } from './db/localDb'

interface PayrollEmployee {
  full_name: string
  employment_type: string
  position?: string | null
  salary: number
  inn?: string | null
  pinfl?: string | null
  status: string
}

export const exportTransactionsToExcel = (transactions: BxTransaction[], fileName = 'Транзакции') => {
  const formatted = transactions.map(t => ({
    'Дата': new Date(t.date).toLocaleDateString('ru-RU'),
    'Тип': t.type === 'income' ? 'Доход' : 'Расход',
    'Сумма (сум)': t.amount,
    'Категория': t.category || 'Без категории',
    'Контрагент': t.counterparty || '',
    'Описание': t.description || '',
    'Статус': t.status === 'paid' ? 'Оплачено' : 'Не оплачено'
  }))

  const worksheet = XLSX.utils.json_to_sheet(formatted)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Транзакции')
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

export const exportPayrollToExcel = (employees: PayrollEmployee[], _brv: number, _mrot: number, fileName = 'Зарплатная_ведомость') => {
  const formatted = employees.map(emp => {
    // Расчет согласно payroll.ts
    const salary = emp.salary
    const inps = emp.employment_type === 'договор ГПХ' ? 0 : Math.round(salary * 0.001)
    const ndfl = Math.round(salary * 0.12)
    const netSalary = salary - ndfl // ИНПС вычитается из НДФЛ, поэтому чистая зарплата = Оклад - НДФЛ

    return {
      'ФИО сотрудника': emp.full_name,
      'Тип занятости': emp.employment_type,
      'Должность': emp.position || '',
      'Оклад (сум)': salary,
      'НДФЛ 12% (сум)': ndfl,
      'ИНПС 0.1% (сум)': inps,
      'Налог в бюджет (НДФЛ - ИНПС)': ndfl - inps,
      'На руки (сум)': netSalary,
      'ИНН': emp.inn || '',
      'ПИНФЛ': emp.pinfl || '',
      'Статус': emp.status === 'active' ? 'Активен' : 'Уволен'
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(formatted)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ведомость')
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

describe('SheetJS compatibility', () => {
  it('reads an uploaded XLSX workbook and converts its sheet to CSV', () => {
    const sourceSheet = XLSX.utils.aoa_to_sheet([
      ['Дата', 'Сумма'],
      ['2026-07-20', 125000],
    ])
    const sourceWorkbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(sourceWorkbook, sourceSheet, 'Операции')

    const uploadedBytes = XLSX.write(sourceWorkbook, { bookType: 'xlsx', type: 'array' })
    const uploadedWorkbook = XLSX.read(uploadedBytes, { type: 'array' })

    expect(uploadedWorkbook.SheetNames).toEqual(['Операции'])
    expect(XLSX.utils.sheet_to_csv(uploadedWorkbook.Sheets['Операции'])).toContain('2026-07-20,125000')
  })

  it('creates an export workbook from application rows', () => {
    const exportSheet = XLSX.utils.json_to_sheet([
      { Категория: 'Услуги', 'Сумма (сум)': 85000 },
    ])
    const exportWorkbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(exportWorkbook, exportSheet, 'Транзакции')

    const exportedBytes = XLSX.write(exportWorkbook, { bookType: 'xlsx', type: 'array' })
    const reopenedWorkbook = XLSX.read(exportedBytes, { type: 'array' })
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      reopenedWorkbook.Sheets['Транзакции'],
    )

    expect(rows).toEqual([{ Категория: 'Услуги', 'Сумма (сум)': 85000 }])
  })
})

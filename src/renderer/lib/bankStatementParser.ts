export interface ParsedTransaction {
  date: string // YYYY-MM-DD
  amount: number
  type: 'income' | 'expense'
  counterparty: string
  description: string
  status: 'paid'
  category?: string
}

export const parseBankStatement = (fileContent: string, companyInn: string | null): ParsedTransaction[] => {
  const lines = fileContent.split(/\r?\n/)
  const transactions: ParsedTransaction[] = []

  let currentDoc: any = null
  let inDocSection = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('СекцияДокумент=')) {
      inDocSection = true
      currentDoc = {}
      continue
    }

    if (trimmed === 'КонецДокумента') {
      if (inDocSection && currentDoc) {
        // Парсим накопленный документ
        const amount = parseFloat(currentDoc['Сумма'] || '0')
        const rawDate = currentDoc['Дата'] || '' // Обычно DD.MM.YYYY
        let date = new Date().toISOString().slice(0, 10)

        if (rawDate) {
          const parts = rawDate.split('.')
          if (parts.length === 3) {
            // Превращаем DD.MM.YYYY в YYYY-MM-DD
            date = `${parts[2]}-${parts[1]}-${parts[0]}`
          } else if (rawDate.includes('-')) {
            date = rawDate // Если вдруг в формате YYYY-MM-DD
          }
        }

        const payerInn = currentDoc['ПлательщикИНН'] || ''
        const recipientInn = currentDoc['ПолучательИНН'] || ''
        const payerName = currentDoc['Плательщик'] || currentDoc['Плательщик1'] || ''
        const recipientName = currentDoc['Получатель'] || currentDoc['Получатель1'] || ''
        const description = currentDoc['НазначениеПлатежа'] || ''

        // Если ИНН плательщика совпадает с ИНН нашей компании, это расход. Иначе доход.
        let type: 'income' | 'expense' = 'income'
        let counterparty = payerName

        if (companyInn && payerInn === companyInn) {
          type = 'expense'
          counterparty = recipientName
        } else if (companyInn && recipientInn === companyInn) {
          type = 'income'
          counterparty = payerName
        } else {
          // Если ИНН не совпадает или не задан, смотрим по косвенным признакам
          // или по умолчанию считаем доходом
          type = 'income'
          counterparty = payerName
        }

        // Чистим имя контрагента от лишних сведений
        if (counterparty) {
          // Пример: р/с... в АКБ... -> берем только первую часть до р/с
          const idx = counterparty.indexOf(' р/с')
          if (idx !== -1) {
            counterparty = counterparty.substring(0, idx)
          }
          counterparty = counterparty.replace(/"/g, '').trim()
        }

        if (amount > 0) {
          transactions.push({
            date,
            amount,
            type,
            counterparty: counterparty || 'Неизвестный контрагент',
            description,
            status: 'paid'
          })
        }
      }
      inDocSection = false
      currentDoc = null
      continue
    }

    if (inDocSection && currentDoc) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim()
        const value = trimmed.substring(eqIdx + 1).trim()
        currentDoc[key] = value
      }
    }
  }

  return transactions
}

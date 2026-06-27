import { db } from '../db/localDb'

export const buildLocalDataContext = async (userQuery: string): Promise<string> => {
  const queryLower = userQuery.toLowerCase()
  let context = ''

  // 1. Финансовая сводка при запросах о деньгах
  const isFinanceQuery = queryLower.includes('финанс') || 
                         queryLower.includes('деньг') || 
                         queryLower.includes('трат') || 
                         queryLower.includes('расход') || 
                         queryLower.includes('доход') || 
                         queryLower.includes('баланс') || 
                         queryLower.includes('отчет') ||
                         queryLower.includes('прибыл')

  if (isFinanceQuery) {
    try {
      const txs = await db.transactions.toArray()
      const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      
      context += `\nЛокальная финансовая статистика (всего транзакций в базе: ${txs.length}):\n`
      context += `- Общий доход: ${totalIncome.toLocaleString()} сум\n`
      context += `- Общий расход: ${totalExpense.toLocaleString()} сум\n`
      context += `- Чистая прибыль: ${(totalIncome - totalExpense).toLocaleString()} сум\n`
      
      const recent = txs.slice(0, 5)
      if (recent.length > 0) {
        context += `Последние 5 транзакций:\n`
        for (const t of recent) {
          context += `- ${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()} сум (${t.category ?? 'Без категории'}, контрагент: ${t.counterparty ?? 'Не указан'})\n`
        }
      }
    } catch (e) {
      console.error('[buildLocalDataContext] Ошибка получения транзакций:', e)
    }
  }

  // 2. Поиск реквизитов контрагентов
  try {
    const counterparties = await db.counterparties.toArray()
    const matchedCps = counterparties.filter(c => 
      queryLower.includes(c.name.toLowerCase()) || 
      (c.inn && queryLower.includes(c.inn))
    )
    if (matchedCps.length > 0) {
      context += `\nРеквизиты найденных контрагентов:\n`
      for (const cp of matchedCps) {
        context += `- Организация: "${cp.name}" (ИНН: ${cp.inn || 'н/д'}, МФО: ${cp.mfo || 'н/д'}, р/с: ${cp.bank_account || 'н/д'}, Банк: ${cp.bank_name || 'н/д'}, Телефон: ${cp.phone || 'н/д'}, Адрес: ${cp.address || 'н/д'})\n`
      }
    }
  } catch (e) {
    console.error('[buildLocalDataContext] Ошибка получения контрагентов:', e)
  }

  // 3. Поиск по сотрудникам и зарплате
  try {
    const employees = await db.employees.toArray()
    const hasHrKeywords = queryLower.includes('сотрудник') || 
                           queryLower.includes('штат') || 
                           queryLower.includes('зарплат') || 
                           queryLower.includes('оклад') ||
                           employees.some(e => queryLower.includes(e.full_name.toLowerCase()))

    if (hasHrKeywords) {
      const specific = employees.filter(e => queryLower.includes(e.full_name.toLowerCase()))
      const listToDisplay = specific.length > 0 ? specific : employees.slice(0, 10)
      
      context += `\nКадровые данные (всего сотрудников в базе: ${employees.length}):\n`
      for (const emp of listToDisplay) {
        context += `- ${emp.full_name}: Должность: "${emp.position || 'н/д'}", Оклад: ${emp.salary.toLocaleString()} сум, Статус: ${emp.status === 'active' ? 'Работает' : 'Уволен'}, ИНН: ${emp.inn || 'н/д'}\n`
      }
    }
  } catch (e) {
    console.error('[buildLocalDataContext] Ошибка получения сотрудников:', e)
  }

  return context
}

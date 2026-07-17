import type { DocTemplate, TemplateVar } from '../data/templates'

export type TemplateFieldGroup = 'document' | 'ourParty' | 'counterparty' | 'people' | 'terms'

export interface TemplateGuide {
  whenToUse: string
  result: string
  checks: string[]
}

const GUIDES: Record<string, TemplateGuide> = {
  'contract-sale': {
    whenToUse: 'Когда одна компания продаёт другой товары и нужно закрепить цену, поставку и гарантию.',
    result: 'Договор купли-продажи с реквизитами сторон и условиями поставки.',
    checks: ['Сверьте товар и сумму со спецификацией', 'Уточните НДС и срок поставки', 'Проверьте полномочия подписантов'],
  },
  'contract-services': {
    whenToUse: 'Для бухгалтерских, консультационных, IT и других услуг — разовых или регулярных.',
    result: 'Договор оказания услуг с периодом, стоимостью и порядком приёмки.',
    checks: ['Опишите измеримый результат услуг', 'Уточните период и тип оплаты', 'Сверьте стороны и подписантов'],
  },
  'contract-rent': {
    whenToUse: 'Для передачи офиса, склада или другого помещения во временное пользование.',
    result: 'Договор аренды с объектом, сроком, платой и депозитом.',
    checks: ['Точно опишите объект и площадь', 'Проверьте срок и дату начала', 'Уточните коммунальные платежи и депозит'],
  },
  'contract-loan': {
    whenToUse: 'Когда организация или физлицо передаёт деньги с обязательством возврата.',
    result: 'Договор займа с суммой, сроком возврата и ставкой.',
    checks: ['Проверьте сумму цифрами и прописью', 'Уточните процентность займа', 'Зафиксируйте дату возврата'],
  },
  'act-services': {
    whenToUse: 'После выполнения работ или услуг, чтобы подтвердить объём и отсутствие претензий.',
    result: 'Акт выполненных работ для подписания сторонами.',
    checks: ['Сошлитесь на правильный договор', 'Сверьте период и перечень работ', 'Проверьте сумму и НДС'],
  },
  invoice: {
    whenToUse: 'Чтобы выставить контрагенту сумму к оплате по договору или заказу.',
    result: 'Счёт на оплату с банковскими реквизитами и назначением платежа.',
    checks: ['Сверьте банковские реквизиты', 'Проверьте плательщика и назначение', 'Уточните срок действия счёта'],
  },
  reconciliation: {
    whenToUse: 'Для сверки взаимных расчётов с контрагентом за выбранный период.',
    result: 'Акт сверки с начальным остатком, оборотами и итоговым сальдо.',
    checks: ['Сверьте период с учётной системой', 'Проверьте дебет и кредит', 'Подтвердите итоговое сальдо'],
  },
  'order-hire': {
    whenToUse: 'При оформлении приёма сотрудника на работу после согласования условий.',
    result: 'Приказ о приёме с должностью, датой и оплатой.',
    checks: ['Сверьте ФИО и ПИНФЛ', 'Проверьте дату начала работы', 'Сопоставьте условия с трудовым договором'],
  },
  'order-dismiss': {
    whenToUse: 'При прекращении трудового договора с сотрудником.',
    result: 'Приказ об увольнении с датой и основанием.',
    checks: ['Проверьте основание увольнения', 'Сверьте последний рабочий день', 'Убедитесь в наличии подтверждающих документов'],
  },
  'order-vacation': {
    whenToUse: 'Для оформления ежегодного или другого вида отпуска сотрудника.',
    result: 'Приказ на отпуск с периодом и количеством дней.',
    checks: ['Сверьте график отпусков', 'Проверьте даты и число дней', 'Уточните рабочий период'],
  },
  'order-business-trip': {
    whenToUse: 'Перед направлением сотрудника в служебную командировку.',
    result: 'Приказ о командировке с местом, сроком и целью.',
    checks: ['Проверьте место и цель поездки', 'Сверьте даты и длительность', 'Уточните источник оплаты расходов'],
  },
  'poa-general': {
    whenToUse: 'Когда сотруднику или представителю нужно действовать от имени организации.',
    result: 'Доверенность с перечнем полномочий и сроком действия.',
    checks: ['Ограничьте полномочия необходимым объёмом', 'Проверьте паспортные данные', 'Уточните срок и право передоверия'],
  },
  'ved-invoice': {
    whenToUse: 'Для внешнеторговой поставки и передачи коммерческих данных покупателю.',
    result: 'Коммерческий инвойс с товаром, валютой и условиями поставки.',
    checks: ['Сверьте валюту и Incoterms', 'Проверьте описание и количество товара', 'Уточните банковские реквизиты и страну назначения'],
  },
}

const OUR_PREFIXES = ['seller', 'provider', 'landlord', 'lender', 'executor', 'org1', 'company', 'supplier', 'principal']
const CP_PREFIXES = ['buyer', 'client', 'tenant', 'borrower', 'customer', 'recipient', 'org2', 'payer', 'contractor']
const DOCUMENT_KEYS = ['num', 'date', 'city', 'period', 'currency']
const PEOPLE_KEYS = ['employee', 'passport', 'pinfl', 'position', 'department', 'trip', 'vacation', 'dismiss', 'hire']

export function getTemplateGuide(template: DocTemplate): TemplateGuide {
  return GUIDES[template.id] ?? {
    whenToUse: template.description || 'Для повторяющегося документа с автоматически подставляемыми реквизитами.',
    result: `Готовый документ «${template.title}» для проверки и выгрузки.`,
    checks: ['Заполните все поля без квадратных скобок', 'Сверьте реквизиты и даты', 'Перед подписанием проверьте текст с ответственным специалистом'],
  }
}

export function getFieldGroup(variable: TemplateVar): TemplateFieldGroup {
  const key = variable.key.toLowerCase()
  const prefix = key.split('_')[0]
  if (OUR_PREFIXES.includes(prefix)) return 'ourParty'
  if (CP_PREFIXES.includes(prefix)) return 'counterparty'
  if (PEOPLE_KEYS.some(part => key.includes(part))) return 'people'
  if (DOCUMENT_KEYS.some(part => key.includes(part))) return 'document'
  return 'terms'
}

export const FIELD_GROUP_META: Record<TemplateFieldGroup, { title: string; description: string }> = {
  document: { title: 'Документ', description: 'Номер, дата, место и базовые параметры' },
  ourParty: { title: 'Наша сторона', description: 'Реквизиты вашей компании и подписанта' },
  counterparty: { title: 'Контрагент', description: 'Данные второй стороны документа' },
  people: { title: 'Сотрудник и основание', description: 'Кадровые данные, даты и подтверждающие сведения' },
  terms: { title: 'Условия и суммы', description: 'Предмет, стоимость, сроки и дополнительные условия' },
}

export function groupTemplateVars(vars: TemplateVar[]): Array<{ id: TemplateFieldGroup; vars: TemplateVar[] }> {
  const order: TemplateFieldGroup[] = ['document', 'ourParty', 'counterparty', 'people', 'terms']
  return order
    .map(id => ({ id, vars: vars.filter(variable => getFieldGroup(variable) === id) }))
    .filter(group => group.vars.length > 0)
}

export function getFieldHint(variable: TemplateVar): string {
  if (variable.hint) return variable.hint
  const key = variable.key.toLowerCase()
  if (key.includes('tin') || key.includes('inn')) return 'Введите ИНН без пробелов и проверьте по карточке организации.'
  if (key.includes('date')) return 'Дата попадёт в текст документа в русском формате.'
  if (key.includes('amount') || key.includes('price') || key.includes('salary')) return 'Введите сумму цифрами без разделителей; сумма прописью заполнится автоматически, если такое поле есть.'
  if (key.includes('rep')) return 'ФИО лица, которое подпишет документ.'
  if (variable.type === 'textarea') return 'Опишите предмет достаточно точно, чтобы его можно было проверить по акту или приложению.'
  return 'Это значение будет подставлено во все соответствующие места документа.'
}

export function getMissingVars(template: DocTemplate, values: Record<string, string>): TemplateVar[] {
  return template.vars.filter(variable => !(values[variable.key] ?? '').trim())
}

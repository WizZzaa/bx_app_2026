import type { BxTicket } from './useTickets';

export const TICKET_STATUS: Record<BxTicket['status'], { label: string; cls: string; activeCls: string }> = {
  open: {
    label: 'Открыт',
    cls: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    activeCls: 'border-white/20 bg-white/15 text-white',
  },
  answered: {
    label: 'Есть ответ',
    cls: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    activeCls: 'border-white/20 bg-white/15 text-white',
  },
  closed: {
    label: 'Закрыт',
    cls: 'border-bx-border bg-bx-surface-2 text-bx-muted',
    activeCls: 'border-white/20 bg-white/15 text-white',
  },
};

export const SUPPORT_CATEGORIES = [
  { value: 'bx', label: 'Приложение BX', hint: 'Страница, данные или функция', icon: 'dashboard' },
  { value: '1c', label: '1С', hint: 'Запуск, обмен или настройка', icon: 'monitor' },
  { value: 'eimzo', label: 'E-Imzo / ЭЦП', hint: 'Ключ, подпись или вход', icon: 'ecp' },
  { value: 'documents', label: 'Документы', hint: 'Шаблон, печать или файл', icon: 'templates' },
  { value: 'computer', label: 'Компьютер', hint: 'Windows, принтер или сеть', icon: 'tools' },
  { value: 'other', label: 'Другое', hint: 'Если раздел не подходит', icon: 'message' },
] as const;

export type SupportCategory = typeof SUPPORT_CATEGORIES[number]['value'];
export type SupportImpact = 'normal' | 'blocking';

export const SUPPORT_IMPACTS: Record<SupportImpact, { label: string; hint: string }> = {
  normal: { label: 'Можно продолжать работу', hint: 'Вопрос или ошибка не блокирует основные действия' },
  blocking: { label: 'Работа остановлена', hint: 'Нельзя выполнить важную операцию или сдать отчёт' },
};

export function formatTicketDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU');
}

export function buildSupportMessage(body: string, category: SupportCategory, impact: SupportImpact): string {
  const categoryLabel = SUPPORT_CATEGORIES.find(item => item.value === category)?.label ?? 'Другое';
  return [
    body.trim(),
    '',
    '— Контекст обращения —',
    `Раздел: ${categoryLabel}`,
    `Влияние на работу: ${SUPPORT_IMPACTS[impact].label}`,
  ].join('\n');
}

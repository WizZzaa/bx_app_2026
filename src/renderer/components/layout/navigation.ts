export type AppPlatform = 'all' | 'windows-mixed'

export interface AppNavigationItem {
  id: string
  to: string
  icon: string
  label: string
  shortLabel?: string
  description: string
  keywords?: readonly string[]
  platform?: AppPlatform
}

export interface FunctionCatalogGroup {
  id: string
  title: string
  description: string
  span: 'md' | 'lg'
  items: readonly AppNavigationItem[]
}

// Единый реестр маршрутов оболочки. Он не заменяет React Router, но не даёт
// сайдбару, mobile More, каталогу и глобальному поиску расходиться в названиях.
export const APP_DESTINATIONS = {
  dashboard: { id: 'dashboard', to: '/dashboard', icon: 'dashboard', label: 'Главная', description: 'Сводка дня, ближайшие сроки и быстрые действия.' },
  ai: { id: 'ai', to: '/ai', icon: 'ai', label: 'AI-консультант', shortLabel: 'AI', description: 'Ответы по учёту и налогам с источниками.' },
  knowledge: { id: 'knowledge', to: '/knowledge', icon: 'knowledge', label: 'База знаний', description: 'Проверенные статьи и практические разъяснения.' },
  reference: { id: 'reference', to: '/reference', icon: 'reference', label: 'Справочники', description: 'Ставки, показатели, счета и нормативные значения.' },
  translator: { id: 'translator', to: '/translator', icon: 'languages', label: 'Переводчик', description: 'Текст и документы на русском, узбекском и английском.' },
  planner: { id: 'planner', to: '/planner', icon: 'planner', label: 'Календарь', description: 'Задачи, налоговые сроки и напоминания.' },
  functions: { id: 'functions', to: '/functions', icon: 'tools', label: 'Все функции', description: 'Единый каталог внутренних разделов BX.' },
  counterparties: { id: 'counterparties', to: '/counterparties', icon: 'users', label: 'Организации', description: 'Карточки компаний, реквизиты и рабочий контекст.' },
  documentTemplates: { id: 'document-templates', to: '/documents/templates', icon: 'templates', label: 'Шаблоны документов', description: 'Шаблоны для повседневной работы и договоров.' },
  documents: { id: 'documents', to: '/documents/my', icon: 'note', label: 'Мои документы', description: 'Созданные и сохранённые документы.' },
  finance: { id: 'finance', to: '/finance', icon: 'finance', label: 'Контроль оплат', description: 'Платежи, долги и финансовые операции.' },
  currency: { id: 'currency', to: '/currency', icon: 'exchange', label: 'Курсы валют', description: 'Официальные курсы, конвертер и история.' },
  calc: { id: 'calc', to: '/calc', icon: 'calc', label: 'Калькуляторы', description: 'Налоговые и повседневные расчёты с версиями значений.' },
  tools: { id: 'tools', to: '/tools', icon: 'tools', label: 'Утилиты', description: 'PDF, проверки, 1С, E-Imzo и системная диагностика.', platform: 'windows-mixed' },
  services: { id: 'services', to: '/services', icon: 'services', label: 'Внешние сервисы', description: 'Госпорталы, банки, ЭДО и официальные сайты.' },
  news: { id: 'news', to: '/news', icon: 'news', label: 'Новости', description: 'Изменения законодательства и важные обновления.' },
  support: { id: 'support', to: '/support', icon: 'headset', label: 'Поддержка', description: 'Обращения, ответы и статус помощи.' },
  account: { id: 'account', to: '/account', icon: 'user', label: 'Личный кабинет', description: 'Тариф, лимиты, устройства и безопасность аккаунта.' },
  settings: { id: 'settings', to: '/settings', icon: 'settings', label: 'Настройки приложения', description: 'Тема, интерфейс, уведомления и локальные параметры.' },
} as const satisfies Record<string, AppNavigationItem>

// Каноническая информационная архитектура Windows и широкого Web.
// Вторичные функции не удалены: они собраны на самостоятельной /functions.
export const PRIMARY_NAVIGATION: readonly AppNavigationItem[] = [
  APP_DESTINATIONS.dashboard,
  APP_DESTINATIONS.ai,
  APP_DESTINATIONS.knowledge,
  APP_DESTINATIONS.reference,
  APP_DESTINATIONS.translator,
  APP_DESTINATIONS.planner,
  APP_DESTINATIONS.functions,
] as const

export const MOBILE_NAVIGATION: readonly AppNavigationItem[] = [
  APP_DESTINATIONS.dashboard,
  APP_DESTINATIONS.ai,
  APP_DESTINATIONS.knowledge,
  APP_DESTINATIONS.translator,
] as const

export const MORE_NAVIGATION: readonly AppNavigationItem[] = [
  APP_DESTINATIONS.functions,
  APP_DESTINATIONS.reference,
  APP_DESTINATIONS.planner,
  APP_DESTINATIONS.currency,
  APP_DESTINATIONS.calc,
  APP_DESTINATIONS.documentTemplates,
  APP_DESTINATIONS.documents,
  APP_DESTINATIONS.finance,
  APP_DESTINATIONS.counterparties,
  APP_DESTINATIONS.news,
  APP_DESTINATIONS.services,
  APP_DESTINATIONS.support,
  APP_DESTINATIONS.account,
  APP_DESTINATIONS.settings,
] as const

export const FUNCTION_CATALOG_GROUPS: readonly FunctionCatalogGroup[] = [
  {
    id: 'core',
    title: 'Каждый день',
    description: 'Главные рабочие сценарии BX.',
    span: 'lg',
    items: [APP_DESTINATIONS.ai, APP_DESTINATIONS.translator, APP_DESTINATIONS.planner, APP_DESTINATIONS.knowledge, APP_DESTINATIONS.reference],
  },
  {
    id: 'accounting',
    title: 'Учёт и документы',
    description: 'Организации, документы и контроль оплат.',
    span: 'lg',
    items: [APP_DESTINATIONS.counterparties, APP_DESTINATIONS.documentTemplates, APP_DESTINATIONS.documents, APP_DESTINATIONS.finance],
  },
  {
    id: 'tools',
    title: 'Расчёты и инструменты',
    description: 'Курсы, калькуляторы и прикладные утилиты.',
    span: 'md',
    items: [APP_DESTINATIONS.currency, APP_DESTINATIONS.calc, APP_DESTINATIONS.tools],
  },
  {
    id: 'information',
    title: 'Информация и помощь',
    description: 'Официальные порталы, новости и поддержка.',
    span: 'md',
    items: [APP_DESTINATIONS.services, APP_DESTINATIONS.news, APP_DESTINATIONS.support],
  },
] as const

export const ALL_CATALOG_DESTINATIONS: readonly AppNavigationItem[] = FUNCTION_CATALOG_GROUPS
  .flatMap(group => group.items)
  .filter((item, index, items) => items.findIndex(candidate => candidate.id === item.id) === index)

export function isNavigationPathActive(pathname: string, to: string): boolean {
  if (to === '/dashboard') return pathname === '/' || pathname === '/dashboard'
  return pathname === to || pathname.startsWith(`${to}/`)
}

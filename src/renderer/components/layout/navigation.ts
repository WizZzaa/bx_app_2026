export interface AppNavigationItem {
  to: string
  icon: string
  label: string
}

// Каноническая информационная архитектура Windows и широкого Web.
export const PRIMARY_NAVIGATION: readonly AppNavigationItem[] = [
  { to: '/dashboard', icon: 'dashboard', label: 'Главная' },
  { to: '/ai', icon: 'ai', label: 'AI-консультант' },
  { to: '/knowledge', icon: 'knowledge', label: 'База знаний' },
  { to: '/reference', icon: 'reference', label: 'Справочники' },
  { to: '/translator', icon: 'languages', label: 'Переводчик' },
  { to: '/planner', icon: 'planner', label: 'Календарь' },
  { to: '/services', icon: 'services', label: 'Все сервисы' },
] as const

export const MOBILE_NAVIGATION: readonly AppNavigationItem[] = PRIMARY_NAVIGATION.slice(0, 3).concat(PRIMARY_NAVIGATION[4])

export const MORE_NAVIGATION: readonly AppNavigationItem[] = [
  { to: '/reference', icon: 'reference', label: 'Справочники' },
  { to: '/planner', icon: 'planner', label: 'Календарь' },
  { to: '/services', icon: 'services', label: 'Все сервисы' },
  { to: '/support', icon: 'headset', label: 'Поддержка' },
  { to: '/account', icon: 'user', label: 'Личный кабинет' },
  { to: '/settings', icon: 'settings', label: 'Настройки приложения' },
] as const

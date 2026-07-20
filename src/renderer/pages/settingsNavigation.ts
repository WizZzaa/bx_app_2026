export type SettingsSurface = 'account' | 'settings'
export type SettingsTab = 'overview' | 'workspace' | 'notifications' | 'security' | 'privacy' | 'ai' | 'team' | 'data' | 'integrations' | 'billing' | 'about'

export interface SettingsNavigationItem {
  id: SettingsTab
  label: string
  desc: string
  icon: string
}

const ITEMS: Readonly<Record<SettingsTab, SettingsNavigationItem>> = {
  overview: { id: 'overview', label: 'Обзор', desc: 'Тариф и ресурсы', icon: 'dashboard' },
  workspace: { id: 'workspace', label: 'Интерфейс', desc: 'Тема, масштаб, виджеты', icon: 'monitor' },
  notifications: { id: 'notifications', label: 'Уведомления', desc: 'Сроки и системные оповещения', icon: 'bell' },
  security: { id: 'security', label: 'Безопасность', desc: 'Устройства, PIN и сессии', icon: 'shield' },
  privacy: { id: 'privacy', label: 'Приватность', desc: 'Согласия и обработка данных', icon: 'lock' },
  ai: { id: 'ai', label: 'ИИ и приватность', desc: 'Облако или свой сервер', icon: 'ai' },
  team: { id: 'team', label: 'Команда', desc: 'Роли и приглашения', icon: 'users' },
  data: { id: 'data', label: 'Данные и копии', desc: 'Экспорт, импорт, кэш', icon: 'save' },
  integrations: { id: 'integrations', label: 'Профиль', desc: 'Аккаунт и Telegram', icon: 'user' },
  billing: { id: 'billing', label: 'Тариф и оплата', desc: 'Подписка и история платежей', icon: 'finance' },
  about: { id: 'about', label: 'О программе', desc: 'Версия и обновления', icon: 'info' },
}

const ACCOUNT_TABS: readonly SettingsTab[] = ['overview', 'integrations', 'billing', 'team', 'security', 'privacy']
const SETTINGS_TABS: readonly SettingsTab[] = ['workspace', 'notifications', 'ai', 'data', 'about']

export function navigationForSurface(surface: SettingsSurface): readonly SettingsNavigationItem[] {
  return (surface === 'account' ? ACCOUNT_TABS : SETTINGS_TABS).map(id => ITEMS[id])
}

export function initialTabForSurface(surface: SettingsSurface): SettingsTab {
  return surface === 'account' ? 'overview' : 'workspace'
}

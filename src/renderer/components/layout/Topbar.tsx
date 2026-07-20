import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildIndex, search, SearchItem } from '../../lib/searchIndex'
import CompanySwitcher from './CompanySwitcher'
import Icon from '../../lib/ui/Icon'
import { getSyncQueue, syncOfflineData } from '../../lib/db/syncQueue'
import { db } from '../../lib/db/localDb'
import ConflictModal from '../ConflictModal'
import { currentTheme, nextTheme, saveTheme, subscribeToTheme, type BxTheme } from '../../lib/theme'
import { useNotifications, type BxNotification } from '../../lib/useNotifications'

export default function Topbar({ onOpenSearch, onToggleMenu, menuExpanded, previewMode = false }: { onOpenSearch?: () => void; onToggleMenu?: () => void; menuExpanded?: boolean; previewMode?: boolean }) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SearchItem[]>([])
  const [results, setResults] = useState<SearchItem[]>([])
  const [open, setOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queueLength, setQueueLength] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [conflictsCount, setConflictsCount] = useState(0)
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(!previewMode)
  
  const [theme, setTheme] = useState<BxTheme>(() => currentTheme())
  
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const notifBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return subscribeToTheme(setTheme)
  }, [])

  const handleToggleTheme = () => {
    saveTheme(nextTheme(currentTheme()))
  }

  const handleOpenNotes = () => {
    localStorage.setItem('bx_tools_last', 'notes')
    window.dispatchEvent(new Event('storage'))
    navigate('/tools')
  }

  useEffect(() => { buildIndex().then(setItems); }, [])

  useEffect(() => {
    setResults(search(items, query))
    setOpen(query.trim().length > 0)
  }, [query, items])

  const handleUpdateStatus = async () => {
    setIsOnline(navigator.onLine)
    setQueueLength(getSyncQueue().length)
    try {
      const count = await db.conflicts.count()
      setConflictsCount(count)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    handleUpdateStatus()

    const handleOnline = () => {
      setIsOnline(true)
      handleUpdateStatus()
      handleSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      handleUpdateStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const interval = setInterval(handleUpdateStatus, 3000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
      if (notifBoxRef.current && !notifBoxRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleSync = async () => {
    if (syncing || !navigator.onLine) return
    setSyncing(true)
    await syncOfflineData()
    setSyncing(false)
    handleUpdateStatus()
  }

  function go(item: SearchItem) {
    navigate(item.route)
    setQuery('')
    setOpen(false)
  }

  async function openNotification(notification: BxNotification) {
    await markAsRead(notification.id)
    if (notification.event_id) {
      localStorage.setItem('bx_planner_open_event_id', notification.event_id)
      navigate('/planner')
      window.dispatchEvent(new CustomEvent('bx:open-planner-event', {
        detail: { eventId: notification.event_id },
      }))
      setNotifOpen(false)
    }
  }

  return (
    <header data-testid="app-topbar" className="bx-app-topbar flex min-h-16 flex-shrink-0 items-center gap-3 border-b border-bx-border bg-bx-surface px-3 sm:px-4 lg:px-6">
      {onToggleMenu && <button type="button" onClick={onToggleMenu} aria-label={menuExpanded ? 'Свернуть основное меню' : 'Развернуть основное меню'} aria-expanded={menuExpanded} className="bx-app-icon-button hidden h-11 w-11 flex-none items-center justify-center rounded-xl border border-bx-border bg-bx-surface-2 text-bx-muted md:flex"><Icon name="menu" className="h-5 w-5" /></button>}
      <div className="bx-app-search relative min-w-0 max-w-lg flex-1" ref={boxRef}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted"><Icon name="search" className="w-4 h-4" /></span>
          <input
            type="text"
            placeholder="Поиск по приложению…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query && setOpen(true)}
            className="bx-app-search__input w-full rounded-xl border border-bx-border-2 bg-bx-surface-2 py-1.5 pl-10 pr-16 text-sm text-bx-text transition-colors placeholder:text-bx-muted focus:outline-none"
          />
          {onOpenSearch && (
            <button onClick={onOpenSearch} title="Командная палитра (Ctrl+K)"
              className="bx-app-search__shortcut absolute right-2 top-1/2 hidden min-h-0 -translate-y-1/2 rounded-lg border border-bx-border-2 px-2 py-1 text-[10px] text-bx-muted transition-colors hover:text-bx-text sm:block">⌘K</button>
          )}
        </div>

        {open && (
          <div className="bx-app-popover absolute top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-bx-border-2 bg-bx-surface shadow-2xl">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-bx-muted">Ничего не найдено</div>
            ) : (
              results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => go(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bx-surface-2 transition-colors border-b border-bx-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                     <div className="text-sm text-bx-text truncate">{r.title}</div>
                     <div className="text-[11px] text-bx-muted truncate">{r.subtitle}</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 flex-shrink-0">{r.category}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Конфликты синхронизации */}
        {conflictsCount > 0 && (
          <button
            onClick={() => setConflictModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[11px] font-semibold animate-pulse cursor-pointer transition-colors"
          >
                  <Icon name="alert" className="h-3.5 w-3.5" /><span>Конфликты ({conflictsCount})</span>
          </button>
        )}

        {/* Индикатор сети и синхронизации */}
        <div className="hidden items-center gap-2 rounded-lg border border-bx-border bg-bx-surface px-2.5 py-1 xl:flex">
          <span className={`w-1.5 h-1.5 rounded-full ${
            queueLength > 0 
              ? isOnline ? 'bg-amber-500 animate-pulse' : 'bg-orange-500' 
              : isOnline ? 'bg-emerald-500' : 'bg-slate-600'
          }`} />
          <span className="text-[11px] text-bx-muted font-medium">
            {queueLength > 0
              ? isOnline 
                ? syncing ? 'Синхронизация...' : `Ожидает отправки (${queueLength})`
                : `Офлайн (${queueLength} в очереди)`
              : isOnline ? 'В сети' : 'Офлайн'}
          </span>
          {queueLength > 0 && isOnline && !syncing && (
            <button 
              onClick={handleSync}
              className="text-[10px] text-blue-400 hover:text-blue-300 ml-1 underline cursor-pointer"
            >
              Синхр.
            </button>
          )}
        </div>

        <div className="hidden lg:block"><CompanySwitcher /></div>

        {/* Быстрые заметки */}
        <button
          onClick={handleOpenNotes}
          className="bx-app-icon-button hidden h-11 w-11 items-center justify-center rounded-xl bg-bx-surface-2 text-bx-muted transition-colors xl:flex"
          title="Быстрые заметки"
        >
          <Icon name="note" className="w-4 h-4" />
        </button>

        {/* Переключатель темы */}
        <button
          onClick={handleToggleTheme}
          className="bx-app-icon-button hidden h-11 w-11 items-center justify-center rounded-xl bg-bx-surface-2 text-bx-muted transition-colors lg:flex"
          title={theme === 'system' ? 'Следующая тема: светлая' : theme === 'light' ? 'Следующая тема: тёмная' : theme === 'dark' ? 'Следующая тема: контрастная' : 'Следующая тема: как в системе'}
          aria-label="Сменить тему оформления"
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          ) : theme === 'light' ? (
            <Icon name="sun" className="w-4 h-4" />
          ) : theme === 'high-contrast' ? (
            <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-bx-accent shadow-[0_0_0_3px_rgb(var(--bx-accent-rgb)/0.14)]" />
          ) : (
            <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-bx-text/20 bg-bx-accent shadow-[0_0_0_3px_rgb(var(--bx-accent-rgb)/0.14)]" />
          )}
        </button>

        {/* Центр Уведомлений */}
        <div className="relative" ref={notifBoxRef}>
          <button
            onClick={() => {
              const nextState = !notifOpen
              setNotifOpen(nextState)
              setConflictModalOpen(false)
              if (nextState) {
                markAllAsRead()
              }
            }}
            className="bx-app-icon-button relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-bx-surface-2 text-bx-muted transition-colors"
            title="Уведомления"
          >
            <Icon name="bell" className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white leading-none scale-90">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="bx-app-popover absolute right-0 top-full z-50 mt-2 flex max-h-[420px] w-80 flex-col overflow-hidden rounded-2xl border border-bx-border-2 bg-bx-surface text-xs shadow-2xl">
              <div className="px-3 py-2.5 border-b border-bx-border bg-bx-surface/40 flex items-center justify-between">
                <span className="font-bold text-bx-text">Уведомления</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer">
                    Прочитать все
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-bx-muted text-[11px]">Нет новых уведомлений</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-2.5 rounded-lg border transition-colors ${
                      n.read ? 'bg-bx-bg/10 border-bx-border/60' : 'bg-blue-500/5 border-blue-500/15'
                    } flex items-start gap-2 justify-between`}>
                      <button
                        type="button"
                        onClick={() => { void openNotification(n) }}
                        className="space-y-0.5 flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 ${n.read ? 'opacity-0' : ''}`} />
                          <h4 className={`font-semibold text-bx-text truncate ${n.read ? '' : 'font-bold'}`}>{n.title}</h4>
                        </div>
                        <p className="text-[10.5px] text-bx-muted leading-relaxed whitespace-pre-wrap">{n.body}</p>
                        <p className="text-[9px] text-bx-muted/65 font-mono pt-0.5">
                          {new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </button>
                      <div className="flex flex-col gap-1.5">
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-[9px] text-blue-400 hover:text-blue-300 cursor-pointer"
                          >
                            Прочесть
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="text-[9px] text-bx-muted hover:text-red-400 cursor-pointer"
                        >
                          Скрыть
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/account')}
          className="bx-app-icon-button flex h-11 w-11 items-center justify-center rounded-xl bg-bx-surface-2 text-bx-muted transition-colors"
          title="Личный кабинет"
          aria-label="Открыть личный кабинет"
        >
          <Icon name="user" className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="bx-app-icon-button flex h-11 w-11 items-center justify-center rounded-xl bg-bx-surface-2 text-bx-muted transition-colors"
          title="Настройки приложения"
          aria-label="Открыть настройки приложения"
        >
          <Icon name="settings" className="w-4 h-4" />
        </button>
      </div>
      <ConflictModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        onResolved={handleUpdateStatus}
      />
    </header>
  )
}

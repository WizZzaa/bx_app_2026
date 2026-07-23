import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CompanySwitcher from './CompanySwitcher'
import Icon from '../../lib/ui/Icon'
import { getSyncQueue, syncOfflineData } from '../../lib/db/syncQueue'
import { db } from '../../lib/db/localDb'
import ConflictModal from '../ConflictModal'
import { useNotifications, type BxNotification } from '../../lib/useNotifications'

interface TopbarProps {
  onOpenSearch?: () => void
  onToggleMenu?: () => void
  menuExpanded?: boolean
  previewMode?: boolean
}

export default function Topbar({
  onOpenSearch,
  onToggleMenu,
  menuExpanded,
  previewMode = false,
}: TopbarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queueLength, setQueueLength] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [conflictsCount, setConflictsCount] = useState(0)
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(!previewMode)
  const navigate = useNavigate()
  const notifBoxRef = useRef<HTMLDivElement>(null)

  const handleOpenNotes = () => {
    localStorage.setItem('bx_tools_last', 'notes')
    window.dispatchEvent(new Event('storage'))
    navigate('/tools')
  }

  const handleUpdateStatus = async () => {
    setIsOnline(navigator.onLine)
    setQueueLength(getSyncQueue().length)
    try {
      setConflictsCount(await db.conflicts.count())
    } catch (error) {
      console.error(error)
    }
  }

  const handleSync = async () => {
    if (syncing || !navigator.onLine) return
    setSyncing(true)
    try {
      await syncOfflineData()
    } finally {
      setSyncing(false)
      void handleUpdateStatus()
    }
  }

  useEffect(() => {
    void handleUpdateStatus()

    const handleOnline = () => {
      setIsOnline(true)
      void handleUpdateStatus()
      void handleSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      void handleUpdateStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const interval = window.setInterval(() => { void handleUpdateStatus() }, 3000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (notifBoxRef.current && !notifBoxRef.current.contains(event.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function openNotification(notification: BxNotification) {
    await markAsRead(notification.id)
    if (!notification.event_id) return
    localStorage.setItem('bx_planner_open_event_id', notification.event_id)
    navigate('/planner')
    window.dispatchEvent(new CustomEvent('bx:open-planner-event', {
      detail: { eventId: notification.event_id },
    }))
    setNotifOpen(false)
  }

  const syncLabel = queueLength > 0
    ? isOnline
      ? syncing ? 'Синхронизация…' : `В очереди: ${queueLength}`
      : `Офлайн · ${queueLength}`
    : isOnline ? 'Всё синхронизировано' : 'Офлайн'

  return (
    <header data-testid="app-topbar" className="bx-app-topbar">
      {onToggleMenu && (
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label={menuExpanded ? 'Свернуть основное меню' : 'Развернуть основное меню'}
          aria-expanded={menuExpanded}
          className="bx-app-icon-button bx-app-topbar__menu hidden md:grid"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenSearch}
        className="bx-app-search-trigger"
        aria-label="Открыть глобальный поиск"
      >
        <Icon name="search" className="h-4 w-4" />
        <span className="truncate">Поиск, команда или раздел</span>
        <kbd className="bx-app-search-trigger__shortcut">⌘K</kbd>
      </button>

      <div className="bx-app-topbar__actions">
        {conflictsCount > 0 && (
          <button
            type="button"
            onClick={() => setConflictModalOpen(true)}
            className="bx-app-sync-state is-conflict"
            aria-label={`Открыть конфликты синхронизации: ${conflictsCount}`}
          >
            <Icon name="alert" className="h-4 w-4" />
            <span className="hidden xl:inline">Конфликты · {conflictsCount}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => { if (queueLength > 0 && isOnline) void handleSync() }}
          disabled={syncing || queueLength === 0 || !isOnline}
          className={`bx-app-sync-state ${isOnline ? 'is-online' : 'is-offline'} ${queueLength > 0 ? 'has-queue' : ''}`}
          aria-label={syncLabel}
          title={queueLength > 0 && isOnline ? 'Синхронизировать сейчас' : syncLabel}
        >
          <span className="bx-app-sync-state__dot" aria-hidden="true" />
          <span className="hidden xl:inline">{syncLabel}</span>
        </button>

        <div className="bx-app-topbar__company hidden lg:block">
          <CompanySwitcher />
        </div>

        <button
          type="button"
          onClick={handleOpenNotes}
          className="bx-app-icon-button hidden xl:grid"
          title="Быстрые заметки"
          aria-label="Открыть быстрые заметки"
        >
          <Icon name="note" className="h-4 w-4" />
        </button>

        <div className="relative" ref={notifBoxRef}>
          <button
            type="button"
            onClick={() => {
              const nextState = !notifOpen
              setNotifOpen(nextState)
              setConflictModalOpen(false)
              if (nextState) void markAllAsRead()
            }}
            className="bx-app-icon-button relative grid"
            title="Уведомления"
            aria-label={unreadCount > 0 ? `Уведомления: ${unreadCount} новых` : 'Уведомления'}
            aria-expanded={notifOpen}
            aria-haspopup="dialog"
          >
            <Icon name="bell" className="h-4 w-4" />
            {unreadCount > 0 && <span className="bx-app-notification-badge">{Math.min(unreadCount, 99)}</span>}
          </button>

          {notifOpen && (
            <section className="bx-app-popover bx-app-notifications" role="dialog" aria-label="Центр уведомлений">
              <header className="bx-app-notifications__header">
                <div>
                  <p>Центр уведомлений</p>
                  <strong>{notifications.length ? `${notifications.length} событий` : 'Всё спокойно'}</strong>
                </div>
                {unreadCount > 0 && (
                  <button type="button" onClick={() => { void markAllAsRead() }}>Прочитать все</button>
                )}
              </header>
              <div className="bx-app-notifications__list">
                {notifications.length === 0 ? (
                  <div className="bx-app-notifications__empty">
                    <span aria-hidden="true"><Icon name="bell" className="h-5 w-5" /></span>
                    <strong>Новых уведомлений нет</strong>
                    <p>Здесь появятся сроки, задачи и ответы поддержки.</p>
                  </div>
                ) : notifications.map(notification => (
                  <article key={notification.id} className={`bx-app-notification ${notification.read ? 'is-read' : 'is-unread'}`}>
                    <button type="button" onClick={() => { void openNotification(notification) }} className="bx-app-notification__body">
                      <span className="bx-app-notification__marker" aria-hidden="true" />
                      <span>
                        <strong>{notification.title}</strong>
                        <span>{notification.body}</span>
                        <time>{new Date(notification.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { void deleteNotification(notification.id) }}
                      className="bx-app-notification__dismiss"
                      aria-label={`Скрыть уведомление «${notification.title}»`}
                    >
                      Скрыть
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/account')}
          className="bx-app-profile-button"
          title="Личный кабинет"
          aria-label="Открыть личный кабинет"
        >
          <span className="bx-app-profile-button__avatar"><Icon name="user" className="h-4 w-4" /></span>
          <span className="hidden 2xl:block">Профиль</span>
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

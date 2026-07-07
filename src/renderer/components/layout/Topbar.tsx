import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildIndex, search, SearchItem } from '../../lib/searchIndex'
import CompanySwitcher from './CompanySwitcher'
import Icon from '../../lib/ui/Icon'
import { getSyncQueue, syncOfflineData } from '../../lib/db/syncQueue'
import { db } from '../../lib/db/localDb'
import ConflictModal from '../ConflictModal'

export default function Topbar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SearchItem[]>([])
  const [results, setResults] = useState<SearchItem[]>([])
  const [open, setOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queueLength, setQueueLength] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [conflictsCount, setConflictsCount] = useState(0)
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)

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

  return (
    <header className="flex items-center gap-4 px-6 h-12 bg-bx-bg border-b border-bx-border flex-shrink-0">
      <div className="flex-1 max-w-md relative" ref={boxRef}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted"><Icon name="search" className="w-4 h-4" /></span>
          <input
            type="text"
            placeholder="Поиск по приложению…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query && setOpen(true)}
            className="w-full bg-bx-surface-2 text-bx-text placeholder-slate-500 text-sm pl-9 pr-16 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          {onOpenSearch && (
            <button onClick={onOpenSearch} title="Командная палитра (Ctrl+K)"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-bx-muted border border-bx-border-2 rounded px-1.5 py-0.5 hover:text-bx-text hover:border-bx-border-2 transition-colors">⌘K</button>
          )}
        </div>

        {open && (
          <div className="absolute top-full mt-1.5 w-full bg-bx-surface border border-bx-border-2 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
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
            <span>⚠️ Конфликты ({conflictsCount})</span>
          </button>
        )}

        {/* Индикатор сети и синхронизации */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-bx-surface border border-bx-border">
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

        <CompanySwitcher />
        <button
          onClick={() => navigate('/settings')}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-bx-surface-2 hover:bg-bx-border-2 text-bx-muted transition-colors"
          title="Настройки"
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

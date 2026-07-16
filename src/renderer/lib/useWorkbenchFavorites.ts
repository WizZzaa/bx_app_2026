import { useState } from 'react'
import type { WorkbenchKind } from '../data/workbenchCatalog'

function storageKey(kind: WorkbenchKind) {
  return `bx_${kind}_favorites_v1`
}

function readFavorites(kind: WorkbenchKind): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(kind)) || '[]')
    return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function useWorkbenchFavorites(kind: WorkbenchKind) {
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites(kind))

  const toggleFavorite = (id: string) => {
    setFavorites(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id]
      localStorage.setItem(storageKey(kind), JSON.stringify(next))
      return next
    })
  }

  return { favorites, toggleFavorite }
}

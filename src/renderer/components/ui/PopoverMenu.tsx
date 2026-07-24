import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BxMotion } from '../../lib/ui/BxMotion'
import './popover-menu-a9.css'

const MENU_ITEMS = [
  '[role="menuitem"]:not([disabled])',
  '[role="menuitemradio"]:not([disabled])',
  '[role="menuitemcheckbox"]:not([disabled])',
].join(',')

export interface PopoverMenuProps {
  open: boolean
  onClose: () => void
  label: string
  x: number
  y: number
  children: React.ReactNode
  className?: string
}

export function PopoverMenu({ open, onClose, label, x, y, children, className = '' }: PopoverMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>(MENU_ITEMS) ?? [])
    const frame = window.requestAnimationFrame(() => items()[0]?.focus())
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      const controls = items()
      if (!controls.length) return
      const currentIndex = Math.max(0, controls.indexOf(document.activeElement as HTMLElement))
      const nextIndex = event.key === 'ArrowDown'
        ? (currentIndex + 1) % controls.length
        : event.key === 'ArrowUp'
          ? (currentIndex - 1 + controls.length) % controls.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? controls.length - 1
              : null
      if (nextIndex === null) return
      event.preventDefault()
      controls[nextIndex]?.focus()
    }
    const close = () => onClose()

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [onClose, open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <BxMotion
      ref={menuRef}
      preset="popover"
      role="menu"
      aria-label={label}
      className={`bx-d1-popover-menu ${className}`}
      style={{ left: x, top: y }}
    >
      {children}
    </BxMotion>,
    document.body,
  )
}

export default PopoverMenu

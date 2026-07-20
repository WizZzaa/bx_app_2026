import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BxMotion } from '../../lib/ui/BxMotion'
import './design-system.css'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const focusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(element => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')

export interface OverlayPanelProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  kind: 'dialog' | 'sheet'
  closeLabel?: string
  closeOnPopState?: boolean
  initialFocusRef?: React.RefObject<HTMLElement | null>
  className?: string
}

export function OverlayPanel({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  kind,
  closeLabel = 'Закрыть',
  closeOnPopState = false,
  initialFocusRef,
  className = '',
}: OverlayPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current
      const requested = initialFocusRef?.current
      if (requested && panel?.contains(requested)) requested.focus()
      else (panel ? focusableElements(panel)[0] : null)?.focus() ?? panel?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current
      if (!panel) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = focusableElements(panel)
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const onPopState = () => onClose()
    document.addEventListener('keydown', onKeyDown)
    if (closeOnPopState) window.addEventListener('popstate', onPopState)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      if (closeOnPopState) window.removeEventListener('popstate', onPopState)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [closeOnPopState, initialFocusRef, onClose, open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className={`bx-d1-overlay ${kind === 'sheet' ? 'bx-d1-overlay--sheet' : ''}`}
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <BxMotion
        ref={panelRef}
        preset={kind}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`bx-d1-${kind} ${className}`}
      >
        <header className="bx-d1-overlay__header">
          <div>
            <h2 id={titleId} className="bx-d1-overlay__title">{title}</h2>
            {description && (
              <p id={descriptionId} className="bx-d1-overlay__description">{description}</p>
            )}
          </div>
          <button type="button" className="bx-d1-overlay__close" aria-label={closeLabel} onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="bx-d1-overlay__body">{children}</div>
        {footer && <footer className="bx-d1-overlay__footer">{footer}</footer>}
      </BxMotion>
    </div>,
    document.body,
  )
}

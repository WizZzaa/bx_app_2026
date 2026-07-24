import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ConfirmationDialogProps } from './ConfirmationDialog'

const ConfirmationDialog = React.lazy(async () => {
  const module = await import('./ConfirmationDialog')
  return { default: module.ConfirmationDialog }
})

export type ConfirmationRequest = Pick<
  ConfirmationDialogProps,
  'title' | 'description' | 'confirmLabel' | 'cancelLabel' | 'tone'
>

type PendingConfirmation = ConfirmationRequest & {
  resolve: (confirmed: boolean) => void
}

export function useConfirmationDialog() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null)
  const pendingRef = useRef<PendingConfirmation | null>(null)

  const close = useCallback((confirmed: boolean) => {
    const current = pendingRef.current
    pendingRef.current = null
    setPending(null)
    current?.resolve(confirmed)
  }, [])

  const confirm = useCallback((request: ConfirmationRequest) => new Promise<boolean>(resolve => {
    pendingRef.current?.resolve(false)
    const next = { ...request, resolve }
    pendingRef.current = next
    setPending(next)
  }), [])

  useEffect(() => () => {
    pendingRef.current?.resolve(false)
    pendingRef.current = null
  }, [])

  const confirmationDialog = (
    <React.Suspense fallback={null}>
      <ConfirmationDialog
        open={pending !== null}
        title={pending?.title ?? ''}
        description={pending?.description ?? ''}
        confirmLabel={pending?.confirmLabel ?? 'Продолжить'}
        cancelLabel={pending?.cancelLabel}
        tone={pending?.tone}
        onConfirm={() => close(true)}
        onClose={() => close(false)}
      />
    </React.Suspense>
  )

  return { confirm, confirmationDialog }
}

export default useConfirmationDialog

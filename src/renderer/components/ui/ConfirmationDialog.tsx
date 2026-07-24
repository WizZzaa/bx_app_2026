import React, { useRef } from 'react'
import Button from './Button'
import { Dialog } from './Dialog'

export interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'default' | 'destructive'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: React.ReactNode
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  tone = 'default',
  loading = false,
  onConfirm,
  onClose,
  children,
}: ConfirmationDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      description={description}
      initialFocusRef={cancelRef}
      className="bx-d1-confirmation"
      footer={(
        <div className="bx-d1-confirmation__actions">
          <Button ref={cancelRef} variant="secondary" disabled={loading} onClick={onClose}>{cancelLabel}</Button>
          <Button variant={tone === 'destructive' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      )}
    >
      {children}
    </Dialog>
  )
}

export default ConfirmationDialog

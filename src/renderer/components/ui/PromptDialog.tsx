import React, { useId, useRef } from 'react'
import Button from './Button'
import { Dialog } from './Dialog'
import { Field } from './FormControls'

export interface PromptDialogProps {
  open: boolean
  title: string
  description?: string
  label: string
  value: string
  placeholder?: string
  submitLabel: string
  cancelLabel?: string
  maxLength?: number
  onValueChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
}

export function PromptDialog({
  open,
  title,
  description,
  label,
  value,
  placeholder,
  submitLabel,
  cancelLabel = 'Отмена',
  maxLength,
  onValueChange,
  onSubmit,
  onClose,
}: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const formId = `bx-prompt-${useId().replace(/:/g, '')}`

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      initialFocusRef={inputRef}
      className="bx-d1-confirmation"
      footer={(
        <div className="bx-d1-confirmation__actions">
          <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
          <Button type="submit" form={formId} disabled={!value.trim()}>{submitLabel}</Button>
        </div>
      )}
    >
      <form
        id={formId}
        onSubmit={event => {
          event.preventDefault()
          if (value.trim()) onSubmit()
        }}
      >
        <Field
          ref={inputRef}
          label={label}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
          required
          onChange={event => onValueChange(event.target.value)}
        />
      </form>
    </Dialog>
  )
}

export default PromptDialog

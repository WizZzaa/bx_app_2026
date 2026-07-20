import React, { useId } from 'react'

export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (props: FieldControlProps) => React.ReactNode
}

export default function FormField({ label, hint, error, required = false, children }: FormFieldProps) {
  const generatedId = useId()
  const fieldId = `bx-field-${generatedId.replace(/:/g, '')}`
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-semibold text-bx-text">
        {label}{required && <span className="ml-1 text-red-700 dark:text-red-400" aria-hidden="true">*</span>}
      </label>
      {children({
        id: fieldId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {hint && <p id={hintId} className="text-sm text-bx-muted">{hint}</p>}
      {error && <p id={errorId} className="text-sm font-medium text-red-700 dark:text-red-400" role="alert">{error}</p>}
    </div>
  )
}

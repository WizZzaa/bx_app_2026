import React, { useId } from 'react'

export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

export interface FormFieldProps {
  id?: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  optionalLabel?: string
  className?: string
  children: (props: FieldControlProps) => React.ReactNode
}

export default function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  optionalLabel = 'необязательно',
  className = '',
  children,
}: FormFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? `bx-field-${generatedId.replace(/:/g, '')}`
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`bx-d1-form-field ${className}`}>
      <label htmlFor={fieldId} className="bx-d1-form-field__label">
        <span>{label}</span>
        {required
          ? <span className="bx-d1-form-field__required" aria-hidden="true">обязательно</span>
          : optionalLabel && <span className="bx-d1-form-field__optional">{optionalLabel}</span>}
      </label>
      {children({
        id: fieldId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {hint && <p id={hintId} className="bx-d1-form-field__hint">{hint}</p>}
      {error && <p id={errorId} className="bx-d1-form-field__error" role="alert">{error}</p>}
    </div>
  )
}

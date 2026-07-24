import React, { useEffect, useRef, useState } from 'react'
import Icon from '../../lib/ui/Icon'
import FormField from './FormField'
import './form-controls-a9.css'

type SharedFieldProps = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  optionalLabel?: string
  containerClassName?: string
}

export type FieldProps = SharedFieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'required'>

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field({
  label,
  hint,
  error,
  required = false,
  optionalLabel,
  containerClassName,
  className = '',
  id,
  ...inputProps
}, ref) {
  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={containerClassName}
    >
      {control => (
        <input
          ref={ref}
          {...inputProps}
          {...control}
          required={required}
          className={`bx-d1-control ${className}`}
        />
      )}
    </FormField>
  )
})

export type SelectProps = SharedFieldProps & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'required'>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({
  label,
  hint,
  error,
  required = false,
  optionalLabel,
  containerClassName,
  className = '',
  id,
  children,
  ...selectProps
}, ref) {
  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={containerClassName}
    >
      {control => (
        <select
          ref={ref}
          {...selectProps}
          {...control}
          required={required}
          className={`bx-d1-control bx-d1-control--select ${className}`}
        >
          {children}
        </select>
      )}
    </FormField>
  )
})

export type DateFieldProps = Omit<FieldProps, 'type'>

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(function DateField(props, ref) {
  return <Field ref={ref} {...props} type="date" />
})

export interface MoneyFieldProps extends Omit<FieldProps, 'type' | 'inputMode'> {
  currency?: string
}

export const MoneyField = React.forwardRef<HTMLInputElement, MoneyFieldProps>(function MoneyField({
  currency = 'UZS',
  className = '',
  ...props
}, ref) {
  return (
    <div className="bx-d1-money-field">
      <Field
        ref={ref}
        {...props}
        type="text"
        inputMode="decimal"
        className={`bx-d1-control--money ${className}`}
      />
      <span className="bx-d1-money-field__currency" aria-hidden="true">{currency}</span>
    </div>
  )
})

export interface UploadProps extends SharedFieldProps {
  id?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  files?: readonly File[]
  onFiles: (files: File[]) => void
  chooseLabel?: string
  dropLabel?: string
  className?: string
}

export function Upload({
  id,
  label,
  hint,
  error,
  required = false,
  optionalLabel,
  containerClassName,
  accept,
  multiple = false,
  disabled = false,
  files = [],
  onFiles,
  chooseLabel = 'Выбрать файл',
  dropLabel = 'или перетащите его сюда',
  className = '',
}: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (!files.length && inputRef.current) inputRef.current.value = ''
  }, [files.length])

  const commitFiles = (list: FileList | null) => {
    const next = Array.from(list ?? [])
    if (next.length) onFiles(multiple ? next : next.slice(0, 1))
  }

  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={containerClassName}
    >
      {control => (
        <div
          className={`bx-d1-upload ${dragActive ? 'is-dragging' : ''} ${files.length ? 'has-files' : ''} ${className}`}
          onDragEnter={event => {
            if (disabled) return
            event.preventDefault()
            setDragActive(true)
          }}
          onDragOver={event => {
            if (disabled) return
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={event => {
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
            setDragActive(false)
          }}
          onDrop={event => {
            if (disabled) return
            event.preventDefault()
            setDragActive(false)
            commitFiles(event.dataTransfer.files)
          }}
        >
          <input
            ref={inputRef}
            {...control}
            type="file"
            accept={accept}
            multiple={multiple}
            required={required && files.length === 0}
            disabled={disabled}
            className="sr-only"
            onChange={event => commitFiles(event.target.files)}
          />
          <button
            type="button"
            disabled={disabled}
            className="bx-d1-upload__button"
            onClick={() => inputRef.current?.click()}
          >
            <span className="bx-d1-upload__icon" aria-hidden="true">
              <Icon name={files.length ? 'check' : 'download'} className="h-5 w-5" />
            </span>
            <span className="bx-d1-upload__copy">
              <strong>{files.length ? files.map(file => file.name).join(', ') : chooseLabel}</strong>
              <span>{files.length ? `${files.length} файл${files.length === 1 ? '' : 'а'} выбрано` : dropLabel}</span>
            </span>
          </button>
        </div>
      )}
    </FormField>
  )
}

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { PromptDialogProps } from './PromptDialog'

const PromptDialog = React.lazy(async () => {
  const module = await import('./PromptDialog')
  return { default: module.PromptDialog }
})

export type PromptRequest = Pick<
  PromptDialogProps,
  'title' | 'description' | 'label' | 'placeholder' | 'submitLabel' | 'cancelLabel' | 'maxLength'
> & {
  initialValue?: string
}

type PendingPrompt = PromptRequest & {
  resolve: (value: string | null) => void
}

export function usePromptDialog() {
  const [pending, setPending] = useState<PendingPrompt | null>(null)
  const [value, setValue] = useState('')
  const pendingRef = useRef<PendingPrompt | null>(null)

  const close = useCallback((result: string | null) => {
    const current = pendingRef.current
    pendingRef.current = null
    setPending(null)
    setValue('')
    current?.resolve(result)
  }, [])

  const prompt = useCallback((request: PromptRequest) => new Promise<string | null>(resolve => {
    pendingRef.current?.resolve(null)
    const next = { ...request, resolve }
    pendingRef.current = next
    setValue(request.initialValue ?? '')
    setPending(next)
  }), [])

  useEffect(() => () => {
    pendingRef.current?.resolve(null)
    pendingRef.current = null
  }, [])

  const promptDialog = (
    <React.Suspense fallback={null}>
      <PromptDialog
        open={pending !== null}
        title={pending?.title ?? ''}
        description={pending?.description}
        label={pending?.label ?? ''}
        value={value}
        placeholder={pending?.placeholder}
        submitLabel={pending?.submitLabel ?? 'Сохранить'}
        cancelLabel={pending?.cancelLabel}
        maxLength={pending?.maxLength}
        onValueChange={setValue}
        onSubmit={() => close(value.trim())}
        onClose={() => close(null)}
      />
    </React.Suspense>
  )

  return { prompt, promptDialog }
}

export default usePromptDialog

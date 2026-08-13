import { useState } from 'react'
import { useToastStore } from '@/store/toastStore'

interface BaseUseEntityFormOptions<TForm, TErrors extends object, TInput> {
  form: TForm
  resetForm: () => void
  validate: (form: TForm) => TErrors
  buildInput: (form: TForm) => TInput
  mutate: (input: TInput, callbacks: { onSuccess: () => void; onError: (error: unknown) => void }) => void
  successMessage: string
  /** Prefix used in the `console.error` call on mutation failure, e.g. `'ComputeEngineCreateForm submit'`. */
  logLabel: string
  onCancel: () => void
  onSuccess: () => void
}

type ExternalErrorState<TErrors extends object> =
  | {
      /** Supply when the caller owns error state externally (e.g. a Zustand store slice); otherwise the hook manages its own. */
      errors: TErrors
      setErrors: (errors: TErrors) => void
    }
  | {
      errors?: never
      setErrors?: never
    }

export type UseEntityFormOptions<TForm, TErrors extends object, TInput> = BaseUseEntityFormOptions<
  TForm,
  TErrors,
  TInput
> &
  ExternalErrorState<TErrors>

/**
 * Shared validate → submit → toast → error-log scaffold behind every
 * *CreateForm component. Each of the five services reimplemented this
 * orchestration identically; only `validate`/`buildInput`/copy differ per
 * resource, so those stay in the calling component while this hook owns the
 * submit lifecycle.
 */
export function useEntityForm<TForm, TErrors extends object, TInput>({
  form,
  resetForm,
  validate,
  buildInput,
  mutate,
  successMessage,
  logLabel,
  onCancel,
  onSuccess,
  errors: externalErrors,
  setErrors: setExternalErrors,
}: UseEntityFormOptions<TForm, TErrors, TInput>) {
  const [internalErrors, setInternalErrors] = useState<TErrors>({} as TErrors)
  const errors = externalErrors ?? internalErrors
  const setErrors = setExternalErrors ?? setInternalErrors
  const addToast = useToastStore((state) => state.addToast)

  function handleCancel() {
    resetForm()
    onCancel()
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    mutate(buildInput(form), {
      onSuccess: () => {
        resetForm()
        addToast(successMessage, 'success')
        onSuccess()
      },
      onError: (error) => {
        console.error(`[${logLabel}]`, error)
        addToast('Operation failed', 'error')
      },
    })
  }

  return { errors, handleCancel, handleSubmit }
}

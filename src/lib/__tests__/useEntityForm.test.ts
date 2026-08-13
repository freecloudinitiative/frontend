import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEntityForm } from '../useEntityForm'

describe('useEntityForm', () => {
  it('manages internal error state when external error props are omitted', () => {
    const resetForm = vi.fn()
    const validate = vi.fn((form: { name: string }): Record<string, string> => (form.name ? {} : { name: 'Name is required' }))
    const buildInput = vi.fn((form: { name: string }) => form)
    const mutate = vi.fn()
    const onCancel = vi.fn()
    const onSuccess = vi.fn()

    const { result } = renderHook(() =>
      useEntityForm({
        form: { name: '' },
        resetForm,
        validate,
        buildInput,
        mutate,
        successMessage: 'Created',
        logLabel: 'TestForm',
        onCancel,
        onSuccess,
      })
    )

    expect(result.current.errors).toEqual({})

    act(() => {
      result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    })

    expect(validate).toHaveBeenCalledWith({ name: '' })
    expect(result.current.errors).toEqual({ name: 'Name is required' })
    expect(mutate).not.toHaveBeenCalled()
  })

  it('uses external error state and setErrors when both are provided', () => {
    let externalErrors: Record<string, string> = {}
    const setErrors = vi.fn((errs: Record<string, string>) => {
      externalErrors = errs
    })
    const resetForm = vi.fn()
    const validate = vi.fn((form: { name: string }): Record<string, string> => (form.name ? {} : { name: 'Name is required' }))
    const buildInput = vi.fn((form: { name: string }) => form)
    const mutate = vi.fn()
    const onCancel = vi.fn()
    const onSuccess = vi.fn()

    const { result } = renderHook(() =>
      useEntityForm({
        form: { name: '' },
        resetForm,
        validate,
        buildInput,
        mutate,
        successMessage: 'Created',
        logLabel: 'TestForm',
        onCancel,
        onSuccess,
        errors: externalErrors,
        setErrors,
      })
    )

    act(() => {
      result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    })

    expect(setErrors).toHaveBeenCalledWith({ name: 'Name is required' })
  })

  it('handleCancel resets form and calls onCancel', () => {
    const resetForm = vi.fn()
    const onCancel = vi.fn()

    const { result } = renderHook(() =>
      useEntityForm({
        form: { name: 'test' },
        resetForm,
        validate: () => ({}),
        buildInput: (form) => form,
        mutate: vi.fn(),
        successMessage: 'Created',
        logLabel: 'TestForm',
        onCancel,
        onSuccess: vi.fn(),
      })
    )

    act(() => {
      result.current.handleCancel()
    })

    expect(resetForm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

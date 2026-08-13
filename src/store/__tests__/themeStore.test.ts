import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getInitialTheme, useThemeStore, isThemeId } from '@/store/themeStore'

describe('themeStore & getInitialTheme', () => {
  beforeEach(() => {
    const storageMap = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storageMap.get(key) ?? null,
        setItem: (key: string, value: string) => storageMap.set(key, value),
        removeItem: (key: string) => storageMap.delete(key),
        clear: () => storageMap.clear(),
      },
      writable: true,
      configurable: true,
    })
    document.documentElement.removeAttribute('data-theme')
  })

  it('isThemeId correctly validates theme values', () => {
    expect(isThemeId('default')).toBe(true)
    expect(isThemeId('navy')).toBe(true)
    expect(isThemeId('beige')).toBe(true)
    expect(isThemeId('mono')).toBe(true)
    expect(isThemeId('sketch')).toBe(true)
    expect(isThemeId('invalid')).toBe(false)
    expect(isThemeId(null)).toBe(false)
    expect(isThemeId(123)).toBe(false)
    expect(isThemeId({})).toBe(false)
  })

  it('returns "default" when localStorage is empty', () => {
    expect(getInitialTheme()).toBe('default')
  })

  it('returns "default" when accessing localStorage throws an exception (e.g. SecurityError)', () => {
    Object.defineProperty(window, 'localStorage', {
      get: () => {
        throw new Error('SecurityError: The operation is insecure.')
      },
      configurable: true,
    })
    expect(getInitialTheme()).toBe('default')
  })

  it('returns valid persisted theme from localStorage', () => {
    localStorage.setItem('fci-theme', JSON.stringify({ state: { theme: 'navy' } }))
    expect(getInitialTheme()).toBe('navy')
  })

  it('ignores invalid / corrupted theme in localStorage and falls back to default', () => {
    localStorage.setItem('fci-theme', JSON.stringify({ state: { theme: 'invalid-theme-value' } }))
    expect(getInitialTheme()).toBe('default')

    localStorage.setItem('fci-theme', '{invalid json}')
    expect(getInitialTheme()).toBe('default')
  })

  it('sets theme in store and updates data-theme attribute on documentElement', () => {
    useThemeStore.getState().setTheme('beige')
    expect(useThemeStore.getState().theme).toBe('beige')
    expect(document.documentElement.getAttribute('data-theme')).toBe('beige')
  })

  it('retains current state when persisted theme is invalid during merge', () => {
    const persistOptions = useThemeStore.persist.getOptions()
    expect(persistOptions.merge).toBeDefined()
    if (persistOptions.merge) {
      const merged = persistOptions.merge({ theme: 'corrupted' }, { theme: 'navy', setTheme: vi.fn() })
      expect((merged as { theme: string }).theme).toBe('navy')

      const validMerged = persistOptions.merge({ theme: 'sketch' }, { theme: 'navy', setTheme: vi.fn() })
      expect((validMerged as { theme: string }).theme).toBe('sketch')
    }
  })
})

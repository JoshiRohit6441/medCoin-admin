import { useCallback, useEffect, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from '../constants/searchDebounce'

export function useDebouncedSearch(initial = '', delayMs = SEARCH_DEBOUNCE_MS) {
  const [searchInput, setSearchInput] = useState(initial)
  const [debouncedSearch, setDebouncedSearch] = useState(initial.trim())

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [searchInput, delayMs])

  const resetSearch = useCallback(() => {
    setSearchInput('')
    setDebouncedSearch('')
  }, [])

  const hasSearchInput = Boolean(searchInput.trim() || debouncedSearch)

  return {
    searchInput,
    debouncedSearch,
    setSearchInput,
    resetSearch,
    hasSearchInput,
  }
}

/** Debounce any value (e.g. secondary filter fields). */
export function useDebouncedValue<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as FetchBaseQueryError).data
    if (typeof data === 'string') return data
    if (data && typeof data === 'object' && 'message' in data)
      return String((data as { message: unknown }).message)
  }
  return 'Something went wrong'
}

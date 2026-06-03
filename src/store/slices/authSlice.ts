import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  ACCESS_TOKEN_STORAGE_KEY,
} from '../../config/api'
import type { AdminUser } from '../../types/admin'

export type AuthState = {
  user: AdminUser | null
  accessToken: string | null
}

export function readStoredAccessToken(): string | null {
  try {
    return (
      localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ||
      sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    )
  } catch {
    return null
  }
}

function persistAccessToken(token: string, rememberMe: boolean) {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  if (rememberMe) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
  }
}

const initialState: AuthState = {
  user: null,
  accessToken: readStoredAccessToken(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AdminUser; token: string; rememberMe?: boolean }>,
    ) => {
      state.user = action.payload.user
      state.accessToken = action.payload.token
      try {
        persistAccessToken(action.payload.token, action.payload.rememberMe !== false)
      } catch {
        /* ignore */
      }
    },
    setUser: (state, action: PayloadAction<AdminUser | null>) => {
      state.user = action.payload
    },
    clearAuth: (state) => {
      state.user = null
      state.accessToken = null
      try {
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
        sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
      } catch {
        /* ignore */
      }
    },
  },
})

export const { setCredentials, setUser, clearAuth } = authSlice.actions
export default authSlice.reducer

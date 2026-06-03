import { createListenerMiddleware } from '@reduxjs/toolkit'
import { medcoinAdminApi } from './api/medcoinAdminApi'
import { clearAuth, setUser } from './slices/authSlice'
import type { AdminUser } from '../types/admin'

export const authListenerMiddleware = createListenerMiddleware()

authListenerMiddleware.startListening({
  matcher: medcoinAdminApi.endpoints.logout.matchFulfilled,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(clearAuth())
    listenerApi.dispatch(medcoinAdminApi.util.resetApiState())
  },
})

authListenerMiddleware.startListening({
  matcher: medcoinAdminApi.endpoints.getMe.matchFulfilled,
  effect: (action, listenerApi) => {
    listenerApi.dispatch(setUser(action.payload.user as AdminUser))
  },
})

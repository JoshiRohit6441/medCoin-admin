import { configureStore } from '@reduxjs/toolkit'
import { medcoinAdminApi } from './api/medcoinAdminApi'
import { authListenerMiddleware } from './authListeners'
import uiReducer from './slices/uiSlice'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [medcoinAdminApi.reducerPath]: medcoinAdminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(authListenerMiddleware.middleware)
      .concat(medcoinAdminApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

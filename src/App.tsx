import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { lazy, Suspense, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import PageLoader from './components/layout/PageLoader'
import GlobalModal from './components/modals/GlobalModal'
import GuestRoute from './components/auth/GuestRoute'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { store } from './store'

const LoginPage = lazy(() => import('./components/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./components/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./components/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'))
const PatientsPage = lazy(() => import('./features/patients/PatientsPage'))
const ConsultationsPage = lazy(() => import('./features/consultations/ConsultationsPage'))
const MeetingsPage = lazy(() => import('./features/meetings/MeetingsPage'))
const TransactionsPage = lazy(() => import('./features/transactions/TransactionsPage'))
const DoctorsPage = lazy(() => import('./features/doctors/DoctorsPage'))
const SeveritiesPage = lazy(() => import('./features/severities/SeveritiesPage'))
const MyProfilePage = lazy(() => import('./features/profile/MyProfilePage'))
const ChangePasswordPage = lazy(() => import('./features/settings/ChangePasswordPage'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f2744', dark: '#0a1c30', light: '#1a3a5c' },
    background: { default: '#f9fafb', paper: '#ffffff' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h5: {
      fontSize: '1.35rem',
      '@media (min-width:600px)': { fontSize: '1.5rem' },
    },
    h6: {
      fontSize: '1.1rem',
      '@media (min-width:600px)': { fontSize: '1.25rem' },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '@media (pointer: coarse)': { minHeight: 44 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '@media (pointer: coarse)': { padding: 10 },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { minHeight: 48 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '@media (pointer: coarse)': { height: 32 },
        },
      },
    },
  },
})

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Lazy>
                    <LoginPage />
                  </Lazy>
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <Lazy>
                    <ForgotPasswordPage />
                  </Lazy>
                </GuestRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <GuestRoute>
                  <Lazy>
                    <ResetPasswordPage />
                  </Lazy>
                </GuestRoute>
              }
            />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route
                  index
                  element={
                    <Lazy>
                      <DashboardPage />
                    </Lazy>
                  }
                />
                <Route
                  path="patients"
                  element={
                    <Lazy>
                      <PatientsPage />
                    </Lazy>
                  }
                />
                <Route
                  path="consultations"
                  element={
                    <Lazy>
                      <ConsultationsPage />
                    </Lazy>
                  }
                />
                <Route
                  path="meetings"
                  element={
                    <Lazy>
                      <MeetingsPage />
                    </Lazy>
                  }
                />
                <Route
                  path="transactions"
                  element={
                    <Lazy>
                      <TransactionsPage />
                    </Lazy>
                  }
                />
                <Route
                  path="doctors"
                  element={
                    <Lazy>
                      <DoctorsPage />
                    </Lazy>
                  }
                />
                <Route
                  path="severities"
                  element={
                    <Lazy>
                      <SeveritiesPage />
                    </Lazy>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <Lazy>
                      <MyProfilePage />
                    </Lazy>
                  }
                />
                <Route
                  path="change-password"
                  element={
                    <Lazy>
                      <ChangePasswordPage />
                    </Lazy>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Lazy>
                      <SettingsPage />
                    </Lazy>
                  }
                />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <GlobalModal />
      </ThemeProvider>
    </Provider>
  )
}

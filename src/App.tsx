import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import GlobalModal from './components/modals/GlobalModal'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import GuestRoute from './components/auth/GuestRoute'
import LoginPage from './components/auth/LoginPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import ConsultationsPage from './features/consultations/ConsultationsPage'
import MeetingsPage from './features/meetings/MeetingsPage'
import TransactionsPage from './features/transactions/TransactionsPage'
import DashboardPage from './features/dashboard/DashboardPage'
import PatientsPage from './features/patients/PatientsPage'
import SeveritiesPage from './features/severities/SeveritiesPage'
import ChangePasswordPage from './features/settings/ChangePasswordPage'
import SettingsPage from './features/settings/SettingsPage'
import MyProfilePage from './features/profile/MyProfilePage'
import { store } from './store'

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
  },
})

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
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <GuestRoute>
                  <ResetPasswordPage />
                </GuestRoute>
              }
            />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="patients" element={<PatientsPage />} />
                <Route path="consultations" element={<ConsultationsPage />} />
                <Route path="meetings" element={<MeetingsPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="severities" element={<SeveritiesPage />} />
                <Route path="profile" element={<MyProfilePage />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
                <Route path="settings" element={<SettingsPage />} />
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

import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { useGetOverviewQuery } from '../../store/api/medcoinAdminApi'
import { getErrorMessage } from '../../utils/errorMessage'
import { AUTH_NAVY } from '../../components/auth/authTheme'

const NAVY = AUTH_NAVY
const CHART_COLORS = ['#0f2744', '#1a3a5c', '#2563eb', '#059669', '#ea580c', '#dc2626', '#94a3b8']

const STATE_COLORS: Record<string, string> = {
  EXPIRED: '#94a3b8',
  COMPLETED: '#059669',
  TRIAGE_IN_PROGRESS: '#2563eb',
  PAYMENT_PENDING: '#ea580c',
  BOOKING_PENDING: '#8b5cf6',
  BOOKED: '#0d9488',
  DOCTOR_NOTIFIED: '#1a3a5c',
  STARTED: '#cbd5e1',
  TRIAGE_COMPLETED: '#60a5fa',
  PAID: '#10b981',
}

const SEVERITY_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444',
  Unknown: '#94a3b8',
  '': '#94a3b8',
}

type KpiCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  accent: string
  to?: string
}

function KpiCard({ title, value, subtitle, icon, accent, to }: KpiCardProps) {
  const inner = (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2,
        borderColor: 'divider',
        transition: 'box-shadow 0.2s, transform 0.2s',
        ...(to
          ? {
              cursor: 'pointer',
              '&:hover': { boxShadow: 2, transform: 'translateY(-2px)' },
            }
          : {}),
      }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${accent}18`,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2, mt: 0.25 }}>
              {value}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )

  if (to) {
    return (
      <Box component={Link} to={to} sx={{ textDecoration: 'none', color: 'inherit' }}>
        {inner}
      </Box>
    )
  }
  return inner
}

function formatMoney(amount: number, currency: string) {
  if (currency === 'BRL') {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`
  }
  return `${amount} ${currency}`
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useGetOverviewQuery()

  if (isLoading) {
    return <LinearProgress />
  }

  if (isError) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>
  }

  const c = data?.counts
  const pay = data?.payments
  const byState = data?.consultationsByState ?? []
  const bySeverity = data?.consultationsBySeverity ?? []
  const byDay = data?.consultationsByDay ?? []

  const pieData = byState.map((row) => ({
    name: row.label,
    value: row.count,
    fill: STATE_COLORS[row.state || ''] || CHART_COLORS[0],
  }))

  const severityData = bySeverity.map((row) => ({
    name: row.severity || 'Unknown',
    count: row.count,
    fill: SEVERITY_COLORS[row.severity] || '#94a3b8',
  }))

  const completionRate =
    c?.consultations && c.consultations > 0
      ? Math.round(((c.bookedSessions ?? 0) / c.consultations) * 100)
      : 0

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          WhatsApp triage, payments, and scheduling at a glance.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
        }}
      >
        <KpiCard
          title="Patients"
          value={c?.patients ?? 0}
          subtitle="Unique WhatsApp contacts"
          icon={<GroupsOutlinedIcon />}
          accent="#2563eb"
          to="/patients"
        />
        <KpiCard
          title="Consultations"
          value={c?.consultations ?? 0}
          subtitle={`${c?.consultationsToday ?? 0} today · ${c?.consultationsThisWeek ?? 0} this week`}
          icon={<LocalHospitalOutlinedIcon />}
          accent={NAVY}
          to="/consultations"
        />
        <KpiCard
          title="Active sessions"
          value={c?.activeSessions ?? 0}
          subtitle={`${c?.paymentPending ?? 0} awaiting payment`}
          icon={<PendingActionsOutlinedIcon />}
          accent="#ea580c"
          to="/consultations"
        />
        <KpiCard
          title="Completed flow"
          value={c?.bookedSessions ?? 0}
          subtitle={`${completionRate}% reached booking+`}
          icon={<CheckCircleOutlinedIcon />}
          accent="#059669"
        />
        <KpiCard
          title="Upcoming doctor meetings"
          value={c?.upcomingMeetings ?? 0}
          subtitle={`${c?.pastMeetings ?? 0} completed (past)`}
          icon={<EventAvailableOutlinedIcon />}
          accent="#0d9488"
          to="/meetings?timing=upcoming"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <KpiCard
          title="Payments approved"
          value={pay?.approved ?? 0}
          subtitle={
            pay?.revenueEstimate?.label
              ? `Est. ${formatMoney(pay.revenueEstimate.amount, pay.revenueEstimate.currency)}`
              : 'Mercado Pago confirmed'
          }
          icon={<PaymentsOutlinedIcon />}
          accent="#059669"
          to="/transactions"
        />
        <KpiCard
          title="In processing"
          value={pay?.processing ?? 0}
          subtitle="MP still reviewing"
          icon={<TrendingUpOutlinedIcon />}
          accent="#8b5cf6"
          to="/transactions"
        />
        <KpiCard
          title="Expired"
          value={c?.expiredSessions ?? 0}
          subtitle="Sessions timed out"
          icon={<CalendarTodayOutlinedIcon />}
          accent="#94a3b8"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: NAVY, mb: 2 }}>
              Consultations — last 14 days
            </Typography>
            <Box sx={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={byDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(value) => [value, 'Consultations']}
                  />
                  <Bar dataKey="count" fill={NAVY} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: NAVY, mb: 2 }}>
              By triage severity
            </Typography>
            <Box sx={{ width: '100%', height: 280 }}>
              {severityData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No severity data yet.
                </Typography>
              ) : (
                <ResponsiveContainer>
                  <BarChart
                    data={severityData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {severityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: NAVY, mb: 2 }}>
              Consultations by state
            </Typography>
            <Box sx={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center' }}>
              {pieData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No data yet.
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: NAVY }}>
                Pipeline breakdown
              </Typography>
              <Chip label={`${c?.consultations ?? 0} total`} size="small" variant="outlined" />
            </Stack>
            <Stack spacing={2}>
              {byState.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No consultations yet.
                </Typography>
              ) : (
                byState.map((row) => (
                  <Box key={String(row.state)}>
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.count}{' '}
                        <Box component="span" sx={{ color: 'text.disabled' }}>
                          ({row.percent}%)
                        </Box>
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(row.percent, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: STATE_COLORS[row.state || ''] || NAVY,
                        },
                      }}
                    />
                  </Box>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}

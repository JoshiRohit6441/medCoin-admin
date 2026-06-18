import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import ListFilterBar from "../../components/forms/ListFilterBar";
import { DashboardPageSkeleton } from "../../components/layout/AppSkeletons";
import { useGetOverviewQuery, useGetZapiConnectionQuery } from "../../store/api/medcoinAdminApi";
import { getErrorMessage } from "../../utils/errorMessage";
import { buildDateRangeParams } from "../../utils/dateFormat";
import { AUTH_NAVY } from "../../components/auth/authTheme";
import { ACTIVE_SESSION_STATES } from "../../utils/consultationState";

const NAVY = AUTH_NAVY;
const CHART_PROPS = {
  accessibilityLayer: false,
  style: { outline: "none" },
} as const;

const CHART_CONTAINER_SX = {
  width: "100%",
  outline: "none",
  overflow: "visible",
  "& .recharts-wrapper, & .recharts-surface, & .recharts-layer, & .recharts-responsive-container":
    {
      outline: "none !important",
      overflow: "visible !important",
    },
  "& .recharts-wrapper:focus, & .recharts-wrapper:focus-visible, & .recharts-wrapper:focus-within, & .recharts-surface:focus, & .recharts-surface:focus-visible":
    {
      outline: "none !important",
      boxShadow: "none !important",
    },
  "& .recharts-tooltip-cursor, & .recharts-active-bar, & .recharts-active-shape":
    {
      display: "none !important",
    },
  "& .recharts-tooltip-wrapper": {
    zIndex: 1500,
    pointerEvents: "none",
  },
} as const;

const CHART_TOOLTIP_PROPS = {
  cursor: false,
  allowEscapeViewBox: { x: true, y: true },
  wrapperStyle: {
    zIndex: 1500,
    pointerEvents: "none",
    outline: "none",
  },
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(15, 39, 68, 0.12)",
    fontSize: 12,
    backgroundColor: "#fff",
    color: NAVY,
  },
  labelStyle: { fontWeight: 600, color: NAVY },
  itemStyle: { color: NAVY },
} as const;

const BAR_LABEL_STYLE = { fontSize: 11, fontWeight: 600, fill: NAVY };

type DonutDatum = { name: string; value: number; fill: string };

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeDonutSegment(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function ConsultationsByStateDonut({ data }: { data: DonutDatum[] }) {
  const [activeName, setActiveName] = useState<string | null>(null);
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 82;
  const innerR = 55;

  let cursor = 0;
  const segments = data.map((row) => {
    const start = cursor;
    const sweep = total > 0 ? (row.value / total) * 360 : 0;
    cursor += sweep;
    const end = cursor;
    const percent = total > 0 ? Math.round((row.value / total) * 100) : 0;
    const mid = (start + end) / 2;
    const labelPos = polarToCartesian(cx, cy, (innerR + outerR) / 2, mid);
    return { ...row, start, end, percent, labelPos };
  });

  const active = segments.find((seg) => seg.name === activeName) ?? null;

  return (
    <Stack spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <Box
          component="svg"
          viewBox={`0 0 ${size} ${size}`}
          sx={{ width: size, height: size, display: "block", overflow: "visible", outline: "none" }}
          aria-label="Consultations by state chart"
          focusable="false"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
        >
          {total > 0
            ? segments.map((seg) => (
                <path
                  key={seg.name}
                  d={describeDonutSegment(cx, cy, innerR, outerR, seg.start, seg.end)}
                  fill={seg.fill}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ cursor: "pointer", outline: "none" }}
                  opacity={active && active.name !== seg.name ? 0.45 : 1}
                  tabIndex={-1}
                  onClick={() =>
                    setActiveName((prev) => (prev === seg.name ? null : seg.name))
                  }
                  onMouseEnter={() => setActiveName(seg.name)}
                  onMouseLeave={() =>
                    setActiveName((prev) => (prev === seg.name ? null : prev))
                  }
                />
              ))
            : null}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={NAVY}
            fontSize={16}
            fontWeight={700}
          >
            {total}
          </text>
        </Box>
        {active ? (
          <Box
            sx={{
              position: "absolute",
              left: active.labelPos.x,
              top: active.labelPos.y,
              transform: "translate(-50%, calc(-100% - 8px))",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              borderRadius: 1,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(15, 39, 68, 0.12)",
              backgroundColor: "#fff",
              color: NAVY,
              px: 1.25,
              py: 0.75,
              fontSize: 12,
              zIndex: 1500,
            }}
          >
            <Typography sx={{ fontWeight: 600, color: NAVY, fontSize: 12, lineHeight: 1.6 }}>
              {active.name}
            </Typography>
            <Typography sx={{ color: NAVY, fontSize: 12, lineHeight: 1.6 }}>
              Consultations : {active.value} ({active.percent}%)
            </Typography>
          </Box>
        ) : null}
      </Box>
      <Stack
        direction="row"
        spacing={2}
        sx={{ flexWrap: "wrap", justifyContent: "center", px: 1 }}
      >
        {segments.map((seg) => (
          <Stack
            key={seg.name}
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center" }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                bgcolor: seg.fill,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
              {seg.name}: {seg.value} ({seg.percent}%)
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function DashboardChartBox({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{ ...CHART_CONTAINER_SX, ...sx }}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
    >
      {children}
    </Box>
  );
}

const CHART_COLORS = [
  "#0f2744",
  "#1a3a5c",
  "#2563eb",
  "#059669",
  "#ea580c",
  "#dc2626",
  "#94a3b8",
];

const STATE_COLORS: Record<string, string> = {
  EXPIRED: "#94a3b8",
  COMPLETED: "#059669",
  TRIAGE_IN_PROGRESS: "#2563eb",
  PAYMENT_PENDING: "#ea580c",
  BOOKING_PENDING: "#8b5cf6",
  BOOKED: "#0d9488",
  DOCTOR_NOTIFIED: "#1a3a5c",
  STARTED: "#cbd5e1",
  TRIAGE_COMPLETED: "#60a5fa",
  PAID: "#10b981",
};

const SEVERITY_COLORS: Record<string, string> = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
  Unknown: "#94a3b8",
  "": "#94a3b8",
};

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent: string;
  to?: string;
};

function KpiCard({ title, value, subtitle, icon, accent, to }: KpiCardProps) {
  const inner = (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 2,
        transition: "box-shadow 0.2s, transform 0.2s",
        ...(to
          ? {
              cursor: "pointer",
              "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
            }
          : {}),
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${accent}18`,
              color: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2, mt: 0.25 }}
            >
              {value}
            </Typography>
            {subtitle ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Box
        component={Link}
        to={to}
        sx={{ textDecoration: "none", color: "inherit" }}
      >
        {inner}
      </Box>
    );
  }
  return inner;
}

function formatMoney(amount: number, currency: string) {
  if (currency === "BRL") {
    return `R$ ${amount.toFixed(2).replace(".", ",")}`;
  }
  return `${amount} ${currency}`;
}

export default function DashboardPage() {
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const dateParams = useMemo(
    () => buildDateRangeParams(createdFrom, createdTo),
    [createdFrom, createdTo],
  );
  const { data, isLoading, isError, error } = useGetOverviewQuery(dateParams);
  const { data: zapi, isLoading: zapiLoading } = useGetZapiConnectionQuery();

  const showWhatsAppWarning =
    !zapiLoading && Boolean(zapi) && zapi?.connected !== true;

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  if (isError) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  }

  const c = data?.counts;
  const pay = data?.payments;
  const byState = data?.consultationsByState ?? [];
  const bySeverity = data?.consultationsBySeverity ?? [];
  const byDay = data?.consultationsByDay ?? [];

  const pieData = byState.map((row) => ({
    name: row.label,
    value: row.count,
    fill: STATE_COLORS[row.state || ""] || CHART_COLORS[0],
  }));

  const severityData = bySeverity.map((row) => ({
    name: row.severity || "Unknown",
    count: row.count,
    fill: SEVERITY_COLORS[row.severity] || "#94a3b8",
  }));

  const completionRate =
    c?.consultations && c.consultations > 0
      ? Math.round(((c.bookedSessions ?? 0) / c.consultations) * 100)
      : 0;

  return (
    <Stack spacing={3}>
      {showWhatsAppWarning ? (
        <Box component={Link} to="/settings" sx={{ textDecoration: "none", color: "inherit" }}>
          <Alert
            severity="warning"
            sx={{
              cursor: "pointer",
              "&:hover": {
                bgcolor: "warning.light",
              },
            }}
          >
            WhatsApp is not connected. Click here to open Settings and scan the QR code
            to connect your number.
          </Alert>
        </Box>
      ) : null}

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          WhatsApp triage, payments, and scheduling at a glance.
        </Typography>
      </Box>

      <ListFilterBar
        showSearch={false}
        from={createdFrom}
        to={createdTo}
        onFromChange={setCreatedFrom}
        onToChange={setCreatedTo}
        onReset={() => {
          setCreatedFrom("");
          setCreatedTo("");
        }}
        resetDisabled={!createdFrom && !createdTo}
        sx={{ maxWidth: { lg: 720 } }}
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(5, 1fr)",
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
          accent="#2563eb"
          to="/consultations"
        />
        <KpiCard
          title="Active sessions"
          value={c?.activeSessions ?? 0}
          subtitle={`${c?.paymentPending ?? 0} awaiting payment`}
          icon={<PendingActionsOutlinedIcon />}
          accent="#2563eb"
          to={`/consultations?state=${encodeURIComponent(ACTIVE_SESSION_STATES)}`}
        />
        <KpiCard
          title="Completed flow"
          value={c?.bookedSessions ?? 0}
          subtitle={`${completionRate}% reached booking+`}
          icon={<CheckCircleOutlinedIcon />}
          accent="#059669"
          to="/consultations?state=BOOKED,DOCTOR_NOTIFIED,COMPLETED"
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
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        }}
      >
        <KpiCard
          title="Payments approved"
          value={pay?.approved ?? 0}
          subtitle={
            pay?.revenueEstimate?.label
              ? `Est. ${formatMoney(pay.revenueEstimate.amount, pay.revenueEstimate.currency)}`
              : "Mercado Pago confirmed"
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
          to="/consultations?state=EXPIRED"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "visible" }}>
          <CardContent sx={{ overflow: "visible" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: NAVY, mb: 2 }}
            >
              Consultations
            </Typography>
            <DashboardChartBox sx={{ height: { xs: 220, sm: 280 }, overflow: "visible" }}>
              <ResponsiveContainer>
                <BarChart
                  {...CHART_PROPS}
                  data={byDay}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    {...CHART_TOOLTIP_PROPS}
                    formatter={(value) => [value ?? 0, "Consultations"]}
                  />
                  <Bar
                    dataKey="count"
                    fill={NAVY}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                    isAnimationActive={false}
                  >
                    <LabelList dataKey="count" position="top" style={BAR_LABEL_STYLE} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </DashboardChartBox>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "visible" }}>
          <CardContent sx={{ overflow: "visible" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: NAVY, mb: 0.5 }}
            >
              By triage severity
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 2 }}
            >
              Completed consultancies or sessions with severity assigned
            </Typography>
            <DashboardChartBox sx={{ height: { xs: 220, sm: 280 }, overflow: "visible" }}>
              {severityData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No severity data yet.
                </Typography>
              ) : (
                <ResponsiveContainer>
                  <BarChart
                    {...CHART_PROPS}
                    data={severityData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={56}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      {...CHART_TOOLTIP_PROPS}
                      formatter={(value) => [value ?? 0, "Sessions"]}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={28}
                      isAnimationActive={false}
                    >
                      {severityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="count" position="right" style={BAR_LABEL_STYLE} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </DashboardChartBox>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "visible" }}>
          <CardContent sx={{ overflow: "visible" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: NAVY, mb: 2 }}
            >
              Consultations by state
            </Typography>
            <Box sx={{ overflow: "visible" }}>
              {pieData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No data yet.
                </Typography>
              ) : (
                <ConsultationsByStateDonut data={pieData} />
              )}
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: NAVY }}
              >
                Pipeline breakdown
              </Typography>
              <Chip
                label={`${c?.consultations ?? 0} total`}
                size="small"
                variant="outlined"
              />
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
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.count}{" "}
                        <Box component="span" sx={{ color: "text.disabled" }}>
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
                        bgcolor: "#f1f5f9",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          bgcolor: STATE_COLORS[row.state || ""] || NAVY,
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
  );
}

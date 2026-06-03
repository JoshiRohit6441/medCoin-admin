export type ApiEnvelope<T> = {
  http_status_code: number
  http_status_message: string
  success: boolean
  data: T
  message: string
  timestamp: string
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ListResponse<T> = {
  items: T[]
  pagination: Pagination
}

export type AdminUser = {
  _id: string
  name?: string
  email?: string
  phone?: string
  role?: string
  status?: string
  admin?: boolean
  profilePic?: string
  createdAt?: string
  updatedAt?: string
}

export type LoginResponse = {
  user: AdminUser
  token: string
}

export type AppSettings = {
  doctorWhatsappPhone: string
  consultationPriceAmount: number
  consultationPriceCurrency: string
  sessionExpiryHours: number
  sessionExpiryWarnHours: number
  updatedAt?: string
}

export type ZapiConnection = {
  configured: boolean
  message?: string
  instanceId?: string
  clientTokenConfigured?: boolean
  connected?: boolean
  smartphoneConnected?: boolean
  enrolledPhone?: string | null
  enrolledPhoneSource?: string | null
  deviceName?: string | null
  deviceAbout?: string | null
  instanceName?: string | null
  receivedCallbackUrl?: string | null
  statusMessage?: string | null
  paymentStatus?: string | null
  webhookPath?: string
  suggestedWebhookUrl?: string | null
  meError?: unknown
  statusError?: unknown
  deviceError?: unknown
  zapiReachable?: boolean
  networkError?: { message?: string; code?: string | null } | null
}

export type ZapiQrResponse = {
  connected: boolean
  qrImage?: string | null
  message?: string
  expiresInSeconds?: number
  hint?: string
}

export type Patient = {
  _id: string
  phone: string
  name?: string
  age?: number | null
  createdAt?: string
  updatedAt?: string
}

export type ConsultationPatientRef = {
  _id: string
  phone?: string
  name?: string
  age?: number | null
  createdAt?: string
  updatedAt?: string
}

export type MatchedSeverityRef = {
  _id: string
  name?: string
  aiSeverityKey?: string
  isActive?: boolean
}

export type Consultation = {
  _id: string
  patient?: string | ConsultationPatientRef
  state?: string
  severity?: string
  messages?: { role: string; content: string }[]
  aiSummary?: string
  bookingCode?: string
  mercadoPagoPaymentId?: string
  mercadoPagoPreferenceId?: string
  mercadoPagoStatus?: string
  mercadoPagoStatusDetail?: string
  mercadoPagoPaymentMethod?: string
  paymentUrl?: string
  appointmentStartAt?: string | null
  appointmentEndAt?: string | null
  appointmentMeetingUrl?: string
  calendlyInviteeName?: string
  calendlyInviteeEmail?: string
  matchedSeverityLevel?: string | MatchedSeverityRef | null
  suggestedConsultancyText?: string
  lastActivityAt?: string
  createdAt?: string
  updatedAt?: string
}

export type Transaction = {
  _id: string
  sessionId: string
  patient?: ConsultationPatientRef
  state?: string
  severity?: string
  bookingCode?: string
  paymentStatus: 'none' | 'awaiting' | 'processing' | 'approved' | 'failed' | 'mock'
  paymentStatusLabel: string
  amount: number | null
  currency: string
  amountLabel: string | null
  mercadoPagoPaymentId?: string
  mercadoPagoPreferenceId?: string
  mercadoPagoStatus?: string
  mercadoPagoStatusDetail?: string
  mercadoPagoPaymentMethod?: string
  paymentUrl?: string
  appointmentStartAt?: string | null
  appointmentEndAt?: string | null
  appointmentMeetingUrl?: string
  calendlyInviteeName?: string
  calendlyInviteeEmail?: string
  aiSummary?: string
  suggestedConsultancyText?: string
  matchedSeverityLevel?: MatchedSeverityRef | null
  createdAt?: string
  updatedAt?: string
  lastActivityAt?: string
}

export type TransactionStats = {
  counts: {
    total: number
    withPayment: number
    approved: number
    paymentPending: number
    processing: number
    mock: number
  }
  revenueEstimate: {
    currency: string
    amount: number
    label: string | null
  }
  price: { amount: number | null; currency: string; label: string | null }
}

export type StaffMember = AdminUser

export type SeverityLevel = {
  _id: string
  name: string
  aiSeverityKey: 'Low' | 'Medium' | 'High'
  consultancySuggestion: string
  description?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type AdminOverview = {
  counts: {
    patients: number
    consultations: number
    severities: number
    admins: number
    activeSessions: number
    bookedSessions: number
    expiredSessions: number
    paymentPending: number
    consultationsToday: number
    consultationsThisWeek: number
    upcomingMeetings: number
    pastMeetings: number
  }
  payments: {
    approved: number
    processing: number
    pending: number
    revenueEstimate: {
      currency: string
      amount: number
      label: string | null
    }
  }
  consultationsByState: {
    state: string | null
    label: string
    count: number
    percent: number
  }[]
  consultationsBySeverity: { severity: string; count: number }[]
  consultationsByDay: { date: string; label: string; count: number }[]
}

export type DoctorMeeting = Consultation & {
  meetingTiming?: 'upcoming' | 'past' | 'unknown'
}

export type MeetingsSummary = {
  upcoming: number
  past: number
  total: number
}

export type ListQueryParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  q?: string
}

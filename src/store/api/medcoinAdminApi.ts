import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { ADMIN_API_BASE } from '../../config/api'
import { readStoredAccessToken, setCredentials, setUser } from '../slices/authSlice'
import type {
  AdminOverview,
  AdminUser,
  ApiEnvelope,
  Consultation,
  DoctorMeeting,
  MeetingsSummary,
  ListResponse,
  ListQueryParams,
  LoginResponse,
  Patient,
  SeverityLevel,
  Doctor,
  StaffMember,
  Transaction,
  TransactionStats,
  AppSettings,
  ZapiConnection,
  ZapiQrResponse,
} from '../../types/admin'
import { clearAuth } from '../slices/authSlice'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: ADMIN_API_BASE,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = readStoredAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

const medcoinAdminBaseQuery: BaseQueryFn<
  string | Parameters<typeof rawBaseQuery>[0],
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error) {
    if (result.error.status === 401) {
      api.dispatch(clearAuth())
    }
    return result
  }

  const body = result.data as ApiEnvelope<unknown> | undefined
  if (body && typeof body === 'object' && 'success' in body) {
    if (!body.success) {
      if (body.http_status_code === 401) {
        api.dispatch(clearAuth())
      }
      return {
        error: {
          status: body.http_status_code,
          data: body.message,
        } as FetchBaseQueryError,
      }
    }
    return { data: body.data }
  }

  return { data: result.data }
}

export const medcoinAdminApi = createApi({
  reducerPath: 'medcoinAdminApi',
  baseQuery: medcoinAdminBaseQuery,
  tagTypes: [
    'Patient',
    'Consultation',
    'Meeting',
    'Transaction',
    'Staff',
    'Severity',
    'Doctor',
    'Overview',
    'Me',
    'AuthReset',
    'Settings',
    'Zapi',
  ],
  endpoints: (builder) => ({
    login: builder.mutation<
      LoginResponse,
      { email: string; password: string; rememberMe?: boolean }
    >({
      query: ({ email, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: { email, password },
      }),
      async onQueryStarted({ rememberMe }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            setCredentials({
              user: data.user,
              token: data.token,
              rememberMe,
            }),
          )
        } catch {
          /* error handled by component */
        }
      },
    }),
    logout: builder.mutation<{ loggedOut: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query<{ user: AdminUser }, void>({
      query: () => '/me',
      providesTags: ['Me'],
    }),
    uploadProfileAvatar: builder.mutation<{ user: AdminUser }, File>({
      query: (file) => {
        const body = new FormData()
        body.append('avatar', file)
        return {
          url: '/me/avatar',
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data.user))
        } catch {
          /* UI */
        }
      },
    }),
    updateProfile: builder.mutation<
      { user: AdminUser },
      { name?: string; email?: string; phone?: string }
    >({
      query: (body) => ({
        url: '/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data.user))
        } catch {
          /* handled in UI */
        }
      },
    }),
    requestPasswordResetOtp: builder.mutation<
      { message: string; devOtp?: string; devNote?: string },
      { email: string }
    >({
      query: (body) => ({
        url: '/auth/forgot-password/request-otp',
        method: 'POST',
        body,
      }),
    }),
    verifyPasswordResetOtp: builder.mutation<
      { verified: boolean; message: string; expiresInMinutes?: number },
      { email: string; otp: string }
    >({
      query: (body) => ({
        url: '/auth/forgot-password/verify-otp',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AuthReset'],
    }),
    getResetPasswordStatus: builder.query<
      { ready: boolean; expiresInMinutes?: number },
      void
    >({
      query: () => '/auth/reset-password/status',
      providesTags: ['AuthReset'],
    }),
    resetPassword: builder.mutation<{ reset: boolean }, { newPassword: string }>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    changePassword: builder.mutation<
      { changed: boolean },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
    getOverview: builder.query<
      AdminOverview,
      { createdFrom?: string; createdTo?: string } | void
    >({
      query: (params) => ({ url: '/overview', params: params ?? {} }),
      providesTags: ['Overview'],
    }),
    listPatients: builder.query<
      ListResponse<Patient>,
      {
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: string
        search?: string
        q?: string
        createdFrom?: string
        createdTo?: string
      } | void
    >({
      query: (params) => ({ url: '/patients', params: params ?? {} }),
      providesTags: (res) =>
        res
          ? [
              ...res.items.map((p) => ({
                type: 'Patient' as const,
                id: p._id,
              })),
              { type: 'Patient', id: 'LIST' },
            ]
          : [{ type: 'Patient', id: 'LIST' }],
    }),
    getPatient: builder.query<{ item: Patient }, string>({
      query: (id) => `/patients/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Patient', id }],
    }),
    listConsultations: builder.query<
      ListResponse<Consultation>,
      {
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: string
        state?: string
        severity?: string
        patientId?: string
        hasPaymentId?: boolean
        booked?: boolean
        appointmentFrom?: string
        appointmentTo?: string
        createdFrom?: string
        createdTo?: string
        bookingCode?: string
        paymentStatus?: 'paid' | 'unpaid'
        search?: string
        q?: string
        activeOnly?: boolean
      } | void
    >({
      query: (params) => {
        const p = { ...(params ?? {}) }
        if (typeof p.hasPaymentId === 'boolean')
          (p as Record<string, string>).hasPaymentId = String(p.hasPaymentId)
        if (typeof p.booked === 'boolean')
          (p as Record<string, string>).booked = String(p.booked)
        if (typeof p.activeOnly === 'boolean')
          (p as Record<string, string>).activeOnly = String(p.activeOnly)
        return { url: '/consultations', params: p }
      },
      providesTags: (res) =>
        res
          ? [
              ...res.items.map((c) => ({
                type: 'Consultation' as const,
                id: c._id,
              })),
              { type: 'Consultation', id: 'LIST' },
            ]
          : [{ type: 'Consultation', id: 'LIST' }],
    }),
    getConsultation: builder.query<{ item: Consultation }, string>({
      query: (id) => `/consultations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Consultation', id }],
    }),
    getMeetingsSummary: builder.query<MeetingsSummary, void>({
      query: () => '/meetings/summary',
      providesTags: ['Meeting'],
    }),
    listMeetings: builder.query<
      ListResponse<DoctorMeeting>,
      {
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: string
        timing?: 'upcoming' | 'past' | 'all'
        state?: string
        severity?: string
        appointmentFrom?: string
        appointmentTo?: string
        bookingCode?: string
        search?: string
        q?: string
        patientName?: string
      } | void
    >({
      query: (params) => ({ url: '/meetings', params: params ?? {} }),
      providesTags: (res) =>
        res
          ? [
              ...res.items.map((m) => ({
                type: 'Meeting' as const,
                id: m._id,
              })),
              { type: 'Meeting', id: 'LIST' },
            ]
          : [{ type: 'Meeting', id: 'LIST' }],
    }),
    getTransactionStats: builder.query<
      TransactionStats,
      { createdFrom?: string; createdTo?: string } | void
    >({
      query: (params) => ({ url: '/transactions/stats', params: params ?? {} }),
      providesTags: ['Transaction'],
    }),
    listTransactions: builder.query<
      ListResponse<Transaction> & { price?: TransactionStats['price'] },
      {
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: string
        state?: string
        severity?: string
        paymentStatus?: string
        patientId?: string
        hasPaymentId?: boolean
        booked?: boolean
        createdFrom?: string
        createdTo?: string
        bookingCode?: string
        search?: string
        q?: string
      } | void
    >({
      query: (params) => {
        const p = { ...(params ?? {}) }
        if (typeof p.hasPaymentId === 'boolean')
          (p as Record<string, string>).hasPaymentId = String(p.hasPaymentId)
        if (typeof p.booked === 'boolean')
          (p as Record<string, string>).booked = String(p.booked)
        return { url: '/transactions', params: p }
      },
      providesTags: (res) =>
        res
          ? [
              ...res.items.map((t) => ({
                type: 'Transaction' as const,
                id: t._id,
              })),
              { type: 'Transaction', id: 'LIST' },
            ]
          : [{ type: 'Transaction', id: 'LIST' }],
    }),
    getTransaction: builder.query<
      { item: Transaction; raw: Consultation },
      string
    >({
      query: (id) => `/transactions/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Transaction', id }],
    }),
    syncTransactionPayment: builder.mutation<
      { sync: Record<string, unknown>; item: Transaction },
      string
    >({
      query: (id) => ({
        url: `/transactions/${id}/sync-payment`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Transaction', id },
        { type: 'Transaction', id: 'LIST' },
        { type: 'Consultation', id },
      ],
    }),
    mockCompleteTransactionPayment: builder.mutation<
      { mock: Record<string, unknown>; item: Transaction },
      string
    >({
      query: (id) => ({
        url: `/transactions/${id}/mock-complete-payment`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Transaction', id },
        { type: 'Transaction', id: 'LIST' },
        { type: 'Consultation', id },
        'Overview',
      ],
    }),
    listStaff: builder.query<
      ListResponse<StaffMember>,
      {
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: string
        role?: string
        status?: string
        search?: string
        q?: string
        createdFrom?: string
        createdTo?: string
      } | void
    >({
      query: (params) => ({ url: '/staff', params: params ?? {} }),
      providesTags: (res) =>
        res
          ? [
              ...res.items.map((s) => ({
                type: 'Staff' as const,
                id: s._id!,
              })),
              { type: 'Staff', id: 'LIST' },
            ]
          : [{ type: 'Staff', id: 'LIST' }],
    }),
    getStaff: builder.query<{ item: StaffMember }, string>({
      query: (id) => `/staff/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Staff', id }],
    }),
    listSeverities: builder.query<
      ListResponse<SeverityLevel>,
      {
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: string
        activeOnly?: boolean
        isActive?: boolean
        aiSeverityKey?: string
        search?: string
        q?: string
        createdFrom?: string
        createdTo?: string
      } | void
    >({
      query: (params) => {
        const p = { ...(params ?? {}) }
        if (typeof p.activeOnly === 'boolean')
          (p as Record<string, string>).activeOnly = String(p.activeOnly)
        if (typeof p.isActive === 'boolean')
          (p as Record<string, string>).isActive = String(p.isActive)
        return { url: '/severities', params: p }
      },
      providesTags: (res) =>
        res
          ? [
              ...res.items.map((s) => ({
                type: 'Severity' as const,
                id: s._id,
              })),
              { type: 'Severity', id: 'LIST' },
            ]
          : [{ type: 'Severity', id: 'LIST' }],
    }),
    getSeverity: builder.query<{ item: SeverityLevel }, string>({
      query: (id) => `/severities/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Severity', id }],
    }),
    createSeverity: builder.mutation<
      { item: SeverityLevel },
      {
        name: string
        aiSeverityKey: 'Low' | 'Medium' | 'High'
        consultancySuggestion: string
        description?: string
        isActive?: boolean
      }
    >({
      query: (body) => ({ url: '/severities', method: 'POST', body }),
      invalidatesTags: [{ type: 'Severity', id: 'LIST' }, 'Overview'],
    }),
    updateSeverity: builder.mutation<
      { item: SeverityLevel },
      {
        id: string
        body: Partial<{
          name: string
          aiSeverityKey: 'Low' | 'Medium' | 'High'
          consultancySuggestion: string
          description: string
          isActive: boolean
        }>
      }
    >({
      query: ({ id, body }) => ({
        url: `/severities/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Severity', id },
        { type: 'Severity', id: 'LIST' },
      ],
    }),
    deleteSeverity: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/severities/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Severity', id },
        { type: 'Severity', id: 'LIST' },
        'Overview',
      ],
    }),
    seedDefaultSeverities: builder.mutation<
      { createdCount: number; items: SeverityLevel[] },
      void
    >({
      query: () => ({ url: '/severities/seed-defaults', method: 'POST' }),
      invalidatesTags: [{ type: 'Severity', id: 'LIST' }, 'Overview'],
    }),

    listDoctors: builder.query<
      ListResponse<Doctor>,
      ListQueryParams & { status?: 'active' | 'inactive' }
    >({
      query: (params) => ({ url: '/doctors', params: params ?? {} }),
      providesTags: (res) =>
        res
          ? [
              ...res.items.map((d) => ({ type: 'Doctor' as const, id: d._id })),
              { type: 'Doctor', id: 'LIST' },
            ]
          : [{ type: 'Doctor', id: 'LIST' }],
    }),
    getDoctor: builder.query<{ item: Doctor }, string>({
      query: (id) => `/doctors/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Doctor', id }],
    }),
    createDoctor: builder.mutation<
      { item: Doctor },
      {
        name: string
        phone: string
        email?: string
        qualification?: string
        status?: 'active' | 'inactive'
      }
    >({
      query: (body) => ({ url: '/doctors', method: 'POST', body }),
      invalidatesTags: [{ type: 'Doctor', id: 'LIST' }],
    }),
    updateDoctor: builder.mutation<
      { item: Doctor },
      {
        id: string
        body: Partial<{
          name: string
          phone: string
          email: string
          qualification: string
          status: 'active' | 'inactive'
          profilePic: string
        }>
      }
    >({
      query: ({ id, body }) => ({ url: `/doctors/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Doctor', id },
        { type: 'Doctor', id: 'LIST' },
      ],
    }),
    deleteDoctor: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/doctors/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Doctor', id },
        { type: 'Doctor', id: 'LIST' },
      ],
    }),
    uploadDoctorAvatar: builder.mutation<{ item: Doctor }, { id: string; file: File }>({
      query: ({ id, file }) => {
        const body = new FormData()
        body.append('avatar', file)
        return { url: `/doctors/${id}/avatar`, method: 'POST', body }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Doctor', id },
        { type: 'Doctor', id: 'LIST' },
      ],
    }),

    getSettings: builder.query<{ settings: AppSettings }, void>({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<
      { settings: AppSettings },
      Partial<
        Pick<
          AppSettings,
          | 'doctorWhatsappPhone'
          | 'consultationPriceAmount'
          | 'sessionExpiryHours'
          | 'sessionExpiryWarnHours'
        >
      >
    >({
      query: (body) => ({ url: '/settings', method: 'PATCH', body }),
      invalidatesTags: ['Settings', 'Overview', 'Transaction'],
    }),

    getZapiConnection: builder.query<ZapiConnection, void>({
      query: () => '/zapi/connection',
      providesTags: ['Zapi', 'Settings'],
    }),
    disconnectZapi: builder.mutation<{ value: boolean }, void>({
      query: () => ({ url: '/zapi/disconnect', method: 'POST' }),
      invalidatesTags: ['Zapi'],
    }),
    getZapiQrCode: builder.query<ZapiQrResponse, void>({
      query: () => '/zapi/qrcode',
    }),
  }),
})

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUploadProfileAvatarMutation,
  useUpdateProfileMutation,
  useRequestPasswordResetOtpMutation,
  useVerifyPasswordResetOtpMutation,
  useGetResetPasswordStatusQuery,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetOverviewQuery,
  useListPatientsQuery,
  useGetPatientQuery,
  useListConsultationsQuery,
  useGetConsultationQuery,
  useGetMeetingsSummaryQuery,
  useListMeetingsQuery,
  useGetTransactionStatsQuery,
  useListTransactionsQuery,
  useGetTransactionQuery,
  useSyncTransactionPaymentMutation,
  useMockCompleteTransactionPaymentMutation,
  useListStaffQuery,
  useGetStaffQuery,
  useListSeveritiesQuery,
  useGetSeverityQuery,
  useCreateSeverityMutation,
  useUpdateSeverityMutation,
  useDeleteSeverityMutation,
  useSeedDefaultSeveritiesMutation,
  useListDoctorsQuery,
  useGetDoctorQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useUploadDoctorAvatarMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetZapiConnectionQuery,
  useDisconnectZapiMutation,
  useLazyGetZapiQrCodeQuery,
} = medcoinAdminApi

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useIsMobile } from '../../hooks/useBreakpoint'
import { useAppToast } from '../../hooks/useAppToast'
import {
  SettingsFormSkeleton,
  ZapiSectionSkeleton,
} from '../../components/layout/AppSkeletons'
import {
  useDisconnectZapiMutation,
  useGetSettingsQuery,
  useGetZapiConnectionQuery,
  useLazyGetZapiQrCodeQuery,
  useUpdateSettingsMutation,
} from '../../store/api/medcoinAdminApi'
import { getErrorMessage } from '../../utils/errorMessage'

function formatPhoneDisplay(digits: string) {
  const d = digits.replace(/\D/g, '')
  return d ? `+${d}` : '—'
}

function normalizeDoctorPhonesInput(raw: string) {
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.replace(/\D/g, ''))
    .filter(Boolean)
    .join(',')
}

export default function SettingsPage() {
  const isMobile = useIsMobile()
  const { showSuccess, showError, Host: ToastHost } = useAppToast()
  const [qrPolling, setQrPolling] = useState(false)
  const [isZapiConnected, setIsZapiConnected] = useState<boolean | null>(null)
  const [doctorPhone, setDoctorPhone] = useState('')
  const [priceAmount, setPriceAmount] = useState('')
  const [sessionExpiryHours, setSessionExpiryHours] = useState('6')
  const [sessionExpiryWarnHours, setSessionExpiryWarnHours] = useState('1')
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)
  const { data: settingsData, isLoading: settingsLoading } = useGetSettingsQuery()
  const [updateSettings, updateState] = useUpdateSettingsMutation()

  const {
    data: zapi,
    isLoading: zapiLoading,
    refetch: refetchZapi,
  } = useGetZapiConnectionQuery(undefined, {
    pollingInterval: qrPolling && isZapiConnected === false ? 15000 : 0,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  })

  const zapiPairingActive = qrPolling && isZapiConnected === false

  const [disconnectZapi, disconnectState] = useDisconnectZapiMutation()
  const [fetchQr, qrState] = useLazyGetZapiQrCodeQuery()

  const settings = settingsData?.settings

  useEffect(() => {
    if (!settings) return
    setDoctorPhone(settings.doctorWhatsappPhone || '')
    setPriceAmount(String(settings.consultationPriceAmount ?? ''))
    setSessionExpiryHours(String(settings.sessionExpiryHours ?? 6))
    setSessionExpiryWarnHours(String(settings.sessionExpiryWarnHours ?? 1))
  }, [settings])

  useEffect(() => {
    if (!zapiPairingActive) return
    const id = window.setInterval(() => {
      void loadQr()
    }, 15000)
    return () => window.clearInterval(id)
  }, [zapiPairingActive])

  useEffect(() => {
    if (zapi?.connected === true) {
      setIsZapiConnected(true)
      setQrPolling(false)
      setQrImage(null)
      return
    }
    if (zapi?.connected === false) {
      setIsZapiConnected(false)
    }
  }, [zapi?.connected])

  async function loadQr() {
    try {
      const result = await fetchQr().unwrap()
      if (result.connected) {
        setQrImage(null)
        setQrPolling(false)
        void refetchZapi()
        return
      }
      if (result.qrImage) setQrImage(result.qrImage)
    } catch {
      /* shown via qrState */
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(priceAmount)
    const expiryH = Number(sessionExpiryHours)
    const warnH = Number(sessionExpiryWarnHours)
    if (!Number.isFinite(amount) || amount <= 0) {
      showError('Consultation price must be a positive number.')
      return
    }
    if (!Number.isFinite(expiryH) || expiryH < 1) {
      showError('Session expiry must be at least 1 hour.')
      return
    }
    if (!Number.isFinite(warnH) || warnH < 0.25) {
      showError('Warning lead time must be at least 0.25 hours.')
      return
    }
    if (warnH >= expiryH) {
      showError('Warning lead time must be less than session expiry hours.')
      return
    }
    try {
      await updateSettings({
        doctorWhatsappPhone: normalizeDoctorPhonesInput(doctorPhone),
        consultationPriceAmount: amount,
        sessionExpiryHours: expiryH,
        sessionExpiryWarnHours: warnH,
      }).unwrap()
      showSuccess('Settings saved.')
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  async function confirmDisconnect() {
    try {
      await disconnectZapi().unwrap()
      setQrImage(null)
      setDisconnectDialogOpen(false)
      showSuccess('WhatsApp disconnected.')
      await refetchZapi()
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  async function handleStartPairing() {
    if (isZapiConnected) return
    setQrPolling(true)
    await loadQr()
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsOutlinedIcon color="primary" />
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Consultation pricing, session timeouts, doctor alerts, and WhatsApp (Z-API).
        </Typography>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Consultation & session
          </Typography>
          {settingsLoading ? (
            <SettingsFormSkeleton />
          ) : (
            <Box component="form" onSubmit={(e) => void handleSaveSettings(e)}>
              <Stack spacing={3} sx={{ maxWidth: { xs: '100%', sm: 720 } }}>
                <Stack spacing={2} sx={{ maxWidth: { xs: '100%', sm: 480 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Doctor & pricing
                  </Typography>
                  <TextField
                    label="Platform numbers"
                    value={doctorPhone}
                    onChange={(e) => setDoctorPhone(e.target.value.replace(/[^\d,;\s]/g, ''))}
                    helperText="Comma-separated numbers with country code (e.g. 5511999999999,917417435057). Booking alerts go to these numbers and all active doctors in Doctors. Duplicates receive one message only."
                    fullWidth
                    size="small"
                    placeholder="5511999999999,917417435057"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              +
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    label="Consultation price"
                    type="number"
                    slotProps={{ htmlInput: { min: 1, step: 0.01 } }}
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(e.target.value)}
                    helperText={`Currency: ${settings?.consultationPriceCurrency ?? 'BRL'} (set in server .env as CONSULTATION_PRICE_CURRENCY)`}
                    fullWidth
                    size="small"
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Session expiry (WhatsApp)
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Session expiry (hours)"
                      type="number"
                      slotProps={{ htmlInput: { min: 1, max: 168, step: 1 } }}
                      value={sessionExpiryHours}
                      onChange={(e) => setSessionExpiryHours(e.target.value)}
                      helperText="Inactive sessions expire after this many hours"
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Warning before expiry (hours)"
                      type="number"
                      slotProps={{ htmlInput: { min: 0.25, max: 48, step: 0.25 } }}
                      value={sessionExpiryWarnHours}
                      onChange={(e) => setSessionExpiryWarnHours(e.target.value)}
                      helperText="WhatsApp reminder sent this long before expiry"
                      fullWidth
                      size="small"
                    />
                  </Stack>
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateState.isLoading}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {updateState.isLoading ? 'Saving…' : 'Save settings'}
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <WhatsAppIcon sx={{ color: '#25D366' }} />
            WhatsApp (Z-API)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View the number connected to your Z-API instance, disconnect it, or scan a new QR code
            (refreshes every ~20 seconds per Z-API docs).
          </Typography>

          {zapiLoading ? (
            <ZapiSectionSkeleton />
          ) : !zapi?.configured ? (
            <Alert severity="warning">
              {zapi?.message ||
                'ZAPI_INSTANCE and ZAPI_TOKEN must be configured in the server .env file.'}
            </Alert>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 280px) 1fr' },
                gap: { xs: 2.5, md: 3 },
                alignItems: 'start',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: { xs: 280, md: '100%' },
                  mx: { xs: 'auto', md: 0 },
                  justifySelf: { md: 'start' },
                }}
              >
                {zapi.connected ? (
                  <Box
                    sx={{
                      aspectRatio: '1',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'success.light',
                      bgcolor: 'success.50',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      p: 2,
                      textAlign: 'center',
                    }}
                  >
                    <WhatsAppIcon sx={{ fontSize: 48, color: '#25D366' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      WhatsApp connected
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Scan a new QR only after disconnecting.
                    </Typography>
                  </Box>
                ) : qrImage ? (
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      textAlign: 'center',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      WhatsApp → Linked devices → Link a device
                    </Typography>
                    <Box
                      component="img"
                      src={qrImage}
                      alt="WhatsApp QR code"
                      sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      QR expires in ~20s. Refreshing while pairing…
                    </Typography>
                    <Button size="small" sx={{ mt: 1 }} onClick={() => void loadQr()}>
                      Refresh QR now
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      bgcolor: 'grey.50',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gridTemplateRows: 'repeat(5, 1fr)',
                        gap: 0.75,
                        p: 2,
                        filter: 'blur(6px)',
                        opacity: 0.45,
                      }}
                      aria-hidden
                    >
                      {Array.from({ length: 25 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          variant="rounded"
                          sx={{ width: '100%', height: '100%', bgcolor: 'grey.300' }}
                        />
                      ))}
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.55)',
                      }}
                    >
                      <Button
                        variant="contained"
                        startIcon={
                          qrState.isFetching ? undefined : <QrCodeScannerIcon />
                        }
                        onClick={() => void handleStartPairing()}
                        disabled={qrState.isFetching}
                      >
                        {qrState.isFetching ? 'Loading QR…' : 'Show QR code'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    size="small"
                    label={zapi.connected ? 'Connected' : 'Not connected'}
                    color={zapi.connected ? 'success' : 'default'}
                  />
                  {zapi.smartphoneConnected != null ? (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={zapi.smartphoneConnected ? 'Phone online' : 'Phone offline'}
                    />
                  ) : null}
                  {zapi.clientTokenConfigured ? (
                    <Chip size="small" variant="outlined" label="Client token OK" />
                  ) : (
                    <Chip size="small" color="warning" variant="outlined" label="No client token" />
                  )}
                </Stack>

                <Box sx={{ typography: 'body2' }}>
                  <div>
                    <strong>Enrolled number:</strong>{' '}
                    {zapi.enrolledPhone ? formatPhoneDisplay(zapi.enrolledPhone) : '—'}
                    {zapi.enrolledPhone && zapi.enrolledPhoneSource ? (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (via Z-API {zapi.enrolledPhoneSource})
                      </Typography>
                    ) : null}
                  </div>
                  {zapi.deviceName ? (
                    <div>
                      <strong>WhatsApp profile:</strong> {zapi.deviceName}
                    </div>
                  ) : null}
                  {zapi.instanceName ? (
                    <div>
                      <strong>Instance:</strong> {zapi.instanceName}
                    </div>
                  ) : null}
                  {zapi.instanceId ? (
                    <div>
                      <strong>Instance ID:</strong> {zapi.instanceId}
                    </div>
                  ) : null}
                  {zapi.receivedCallbackUrl ? (
                    <div>
                      <strong>Webhook (received):</strong> {zapi.receivedCallbackUrl}
                    </div>
                  ) : zapi.suggestedWebhookUrl ? (
                    <div>
                      <strong>Suggested webhook:</strong> {zapi.suggestedWebhookUrl}
                    </div>
                  ) : null}
                  {zapi.statusMessage ? (
                    <div>
                      <strong>Status:</strong> {zapi.statusMessage}
                    </div>
                  ) : null}
                </Box>

                {zapi.networkError && zapi.zapiReachable === false ? (
                  <Alert severity="warning">
                    Cannot reach Z-API (
                    {zapi.networkError.code || zapi.networkError.message || 'network error'}). Check
                    internet/VPN/firewall and <code>ZAPI_BASE_URL</code> in server .env, then refresh.
                  </Alert>
                ) : null}

                {(zapi.meError || zapi.statusError || zapi.deviceError) && !zapi.connected ? (
                  <Alert severity="info">
                    Z-API detail: check instance/token and Client-Token in server .env.
                  </Alert>
                ) : null}

                {disconnectState.isError ? (
                  <Alert severity="error">{getErrorMessage(disconnectState.error)}</Alert>
                ) : null}
                {qrState.isError ? (
                  <Alert severity="error">{getErrorMessage(qrState.error)}</Alert>
                ) : null}

                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={!zapi.connected || disconnectState.isLoading}
                    onClick={() => setDisconnectDialogOpen(true)}
                  >
                    {disconnectState.isLoading ? 'Disconnecting…' : 'Disconnect WhatsApp'}
                  </Button>
                  <Button variant="outlined" onClick={() => void refetchZapi()}>
                    Refresh status
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={disconnectDialogOpen}
        onClose={() => !disconnectState.isLoading && setDisconnectDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        aria-labelledby="disconnect-whatsapp-title"
      >
        <DialogTitle id="disconnect-whatsapp-title">Disconnect WhatsApp?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              This will unlink the enrolled number from your Z-API instance. Incoming patient
              messages and automated replies will stop until you scan a new QR code.
            </Typography>
            {zapi?.enrolledPhone ? (
              <Typography variant="body2">
                <strong>Current number:</strong> {formatPhoneDisplay(zapi.enrolledPhone)}
              </Typography>
            ) : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDisconnectDialogOpen(false)}
            disabled={disconnectState.isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void confirmDisconnect()}
            disabled={disconnectState.isLoading}
          >
            {disconnectState.isLoading ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastHost />
    </Stack>
  )
}

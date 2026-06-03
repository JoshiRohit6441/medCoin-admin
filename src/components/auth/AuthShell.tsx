import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { Box, Link, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../constants/brand'
import { AUTH_NAVY } from './authTheme'

const FEATURES = [
  {
    icon: ChatOutlinedIcon,
    title: 'Triagem via WhatsApp',
    description:
      'Acompanhe conversas de triagem, prioridade clínica e resumo gerado por IA em tempo real.',
  },
  {
    icon: PaymentsOutlinedIcon,
    title: 'Pagamentos e agendamento',
    description:
      'Monitore transações Mercado Pago, sincronize status e consultas vinculadas ao Calendly.',
  },
  {
    icon: EventAvailableOutlinedIcon,
    title: 'Operação da clínica',
    description:
      'Pacientes, equipe, níveis de urgência e configurações — tudo em um painel centralizado.',
  },
] as const

function BrandPanel({ compact = false }: { compact?: boolean }) {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: AUTH_NAVY,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: compact ? 3 : { xs: 3, md: 5 },
        minHeight: compact ? 'auto' : { xs: 280, md: '100vh' },
      }}
    >
      <Box>
        <Box sx={{ mb: compact ? 2 : 4 }}>
          <Box
            component="img"
            src={BRAND_LOGO_SRC}
            alt={BRAND_NAME}
            sx={{
              width: '100%',
              maxWidth: compact ? 220 : 280,
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          {!compact ? (
            <Typography variant="caption" sx={{ opacity: 0.75, mt: 1, display: 'block' }}>
              Painel administrativo
            </Typography>
          ) : null}
        </Box>

        {!compact ? (
          <>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                lineHeight: 1.25,
                mb: 2,
                maxWidth: 420,
                fontSize: { xs: '1.75rem', md: '2.125rem' },
              }}
            >
              Gerencie consultas online com segurança e clareza.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 440, mb: 4, lineHeight: 1.6 }}>
              Plataforma para acompanhar triagem por WhatsApp, pagamentos, agendamentos Calendly e
              notificações ao médico — em um único painel.
            </Typography>

            <Stack spacing={2.5}>
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <Stack key={title} direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 20, opacity: 0.9 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
                      {title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.75, lineHeight: 1.5 }}>
                      {description}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </>
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 360 }}>
            Triagem WhatsApp, pagamentos Mercado Pago e agendamentos Calendly em um só lugar.
          </Typography>
        )}
      </Box>

      <Box sx={{ mt: compact ? 2 : 4 }}>
        <Typography variant="caption" sx={{ opacity: 0.5, display: 'block' }}>
          © {new Date().getFullYear()} MEDCOIN.AI. All rights reserved.
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', mt: 0.75 }}>
          Developed by{' '}
          <Link
            href="https://bytelogicindia.com/"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: 'inherit', fontWeight: 600 }}
          >
            Bytelogic Technologies
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}

type AuthShellProps = {
  children: ReactNode
}

export default function AuthShell({ children }: AuthShellProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      <BrandPanel compact={isMobile} />
      <Box
        component="main"
        sx={{
          flex: 1,
          bgcolor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6 },
          py: { xs: 4, md: 6 },
          minHeight: { md: '100vh' },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>{children}</Box>
      </Box>
    </Box>
  )
}

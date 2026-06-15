import CloseIcon from '@mui/icons-material/Close'
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { useIsMobile } from '../../hooks/useBreakpoint'

type DetailDrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function DetailDrawer({ open, onClose, title, children }: DetailDrawerProps) {
  const isMobile = useIsMobile()

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : { sm: 400, md: 440 },
            maxWidth: '100vw',
            maxHeight: isMobile ? 'min(92dvh, 100%)' : '100%',
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            pb: 'env(safe-area-inset-bottom, 0px)',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pt: isMobile ? 1.5 : 2,
          pb: 1,
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} aria-label="Close detail" edge="end" size="small">
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box
        sx={{
          px: 2,
          pb: 2,
          overflow: 'auto',
          flex: 1,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </Box>
    </Drawer>
  )
}

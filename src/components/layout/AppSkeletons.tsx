import { Box, Skeleton, Stack } from '@mui/material'

export function DetailDrawerSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: rows }).map((_, i) => (
        <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Skeleton variant="text" width={`${28 + (i % 3) * 8}%`} height={22} />
          <Skeleton variant="text" width={`${52 + (i % 2) * 12}%`} height={22} sx={{ flex: 1 }} />
        </Stack>
      ))}
    </Stack>
  )
}

export function FormFieldsSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: fields }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={40} />
      ))}
    </Stack>
  )
}

export function SettingsFormSkeleton() {
  return (
    <Stack spacing={3} sx={{ maxWidth: { xs: '100%', sm: 720 } }}>
      <Stack spacing={2} sx={{ maxWidth: { xs: '100%', sm: 480 } }}>
        <Skeleton variant="text" width={120} height={28} />
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={56} />
      </Stack>
      <Stack spacing={2}>
        <Skeleton variant="text" width={180} height={28} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
        </Stack>
      </Stack>
      <Skeleton variant="rounded" width={140} height={36} />
    </Stack>
  )
}

export function ZapiSectionSkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 280px) 1fr' },
        gap: { xs: 2.5, md: 3 },
        alignItems: 'start',
      }}
    >
      <Skeleton
        variant="rounded"
        sx={{
          aspectRatio: '1',
          width: '100%',
          maxWidth: { xs: 280, md: '100%' },
          mx: { xs: 'auto', md: 0 },
        }}
      />
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Skeleton variant="rounded" width={108} height={24} />
          <Skeleton variant="rounded" width={96} height={24} />
          <Skeleton variant="rounded" width={112} height={24} />
        </Stack>
        <Stack spacing={1.25}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Skeleton variant="text" width={`${22 + (i % 3) * 6}%`} height={22} />
              <Skeleton variant="text" width={`${48 + (i % 2) * 14}%`} height={22} sx={{ flex: 1 }} />
            </Stack>
          ))}
        </Stack>
        <Skeleton variant="rounded" height={48} />
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Skeleton variant="rounded" width={168} height={36} />
          <Skeleton variant="rounded" width={120} height={36} />
        </Stack>
      </Stack>
    </Box>
  )
}

export function ZapiQrSkeleton() {
  return (
    <Box
      sx={{
        aspectRatio: '1',
        width: '100%',
        maxWidth: { xs: 280, md: '100%' },
        mx: { xs: 'auto', md: 0 },
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
      }}
    >
      <Skeleton variant="rounded" sx={{ width: '72%', height: '72%' }} />
      <Skeleton variant="text" width="60%" height={18} />
      <Skeleton variant="rounded" width={120} height={32} />
    </Box>
  )
}

export function DashboardPageSkeleton() {
  return (
    <Stack spacing={3}>
      <Box>
        <Skeleton variant="text" width={180} height={36} />
        <Skeleton variant="text" width={340} height={24} sx={{ mt: 0.5 }} />
      </Box>
      <Skeleton variant="rounded" height={56} sx={{ maxWidth: { lg: 720 } }} />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={124} />
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={124} />
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        <Skeleton variant="rounded" height={320} />
        <Skeleton variant="rounded" height={320} />
      </Box>
      <Skeleton variant="rounded" height={280} />
    </Stack>
  )
}

export function ProfilePageSkeleton() {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Skeleton variant="text" width={160} height={40} />
      <Skeleton variant="text" width={280} height={24} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={520} />
    </Box>
  )
}

export function AuthFormSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="text" width="75%" height={36} />
      <Skeleton variant="text" width="90%" height={22} />
      <Skeleton variant="rounded" height={48} />
      <Skeleton variant="rounded" height={48} />
      <Skeleton variant="rounded" height={44} />
    </Stack>
  )
}

export function PageLoaderSkeleton() {
  return (
    <Stack spacing={2} sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Skeleton variant="text" width={220} height={32} />
      <Skeleton variant="text" width={320} height={22} />
      <Skeleton variant="rounded" height={240} />
    </Stack>
  )
}

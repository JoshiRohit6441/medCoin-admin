import { Box, type SxProps, type Theme } from '@mui/material'
import DateFilterField from './DateFilterField'

type DateRangeFiltersProps = {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  fromLabel?: string
  toLabel?: string
  sx?: SxProps<Theme>
}

export default function DateRangeFilters({
  from,
  to,
  onFromChange,
  onToChange,
  fromLabel = 'From date',
  toLabel = 'To date',
  sx,
}: DateRangeFiltersProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
        ...sx,
      }}
    >
      <DateFilterField
        size="small"
        label={fromLabel}
        value={from}
        onValueChange={onFromChange}
        fullWidth
      />
      <DateFilterField
        size="small"
        label={toLabel}
        value={to}
        onValueChange={onToChange}
        fullWidth
      />
    </Box>
  )
}

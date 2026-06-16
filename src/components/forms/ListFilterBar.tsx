import { Box, Button, TextField, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'
import DateFilterField from './DateFilterField'
import { pageButtonProps } from '../../utils/pageButtons'

type ListFilterBarProps = {
  search?: string
  onSearchChange?: (value: string) => void
  searchLabel?: string
  searchPlaceholder?: string
  showSearch?: boolean
  showDates?: boolean
  from?: string
  to?: string
  onFromChange?: (value: string) => void
  onToChange?: (value: string) => void
  fromLabel?: string
  toLabel?: string
  onReset: () => void
  resetDisabled?: boolean
  children?: ReactNode
  sx?: SxProps<Theme>
}

export default function ListFilterBar({
  search = '',
  onSearchChange,
  searchLabel = 'Search',
  searchPlaceholder = 'Search…',
  showSearch = Boolean(onSearchChange),
  showDates = true,
  from = '',
  to = '',
  onFromChange,
  onToChange,
  fromLabel = 'From date',
  toLabel = 'To date',
  onReset,
  resetDisabled = false,
  children,
  sx,
}: ListFilterBarProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, ...sx }}>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          alignItems: 'end',
          gridTemplateColumns: {
            xs: '1fr',
            sm: showSearch && showDates ? 'repeat(2, 1fr)' : '1fr',
            lg:
              showSearch && showDates
                ? 'minmax(220px, 1.4fr) minmax(160px, 1fr) minmax(160px, 1fr) auto'
                : showDates
                  ? 'minmax(160px, 1fr) minmax(160px, 1fr) auto'
                  : '1fr auto',
          },
        }}
      >
        {showSearch ? (
          <TextField
            size="small"
            label={searchLabel}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            fullWidth
          />
        ) : null}
        {showDates ? (
          <>
            <DateFilterField
              size="small"
              label={fromLabel}
              value={from}
              onValueChange={(value) => onFromChange?.(value)}
              fullWidth
            />
            <DateFilterField
              size="small"
              label={toLabel}
              value={to}
              onValueChange={(value) => onToChange?.(value)}
              fullWidth
            />
          </>
        ) : null}
        <Button
          {...pageButtonProps}
          onClick={onReset}
          disabled={resetDisabled}
          sx={{ height: 40, whiteSpace: 'nowrap', justifySelf: { xs: 'stretch', lg: 'start' } }}
        >
          Reset filters
        </Button>
      </Box>
      {children ? (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          }}
        >
          {children}
        </Box>
      ) : null}
    </Box>
  )
}

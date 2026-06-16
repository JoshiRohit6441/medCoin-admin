import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import { Box, IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { useRef } from 'react'
import {
  DATE_FILTER_PLACEHOLDER,
  DATE_INPUT_MAX,
  DATE_INPUT_MIN,
  formatIsoDateForFilter,
  isValidDateInputValue,
  sanitizeDateInputValue,
} from '../../utils/dateFormat'

type DateFilterFieldProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
}

function openDatePicker(input: HTMLInputElement | null) {
  if (!input || typeof input.showPicker !== 'function') return
  try {
    input.showPicker()
  } catch {
    /* Some browsers throw if picker is already open. */
  }
}

export default function DateFilterField({
  value,
  onValueChange,
  slotProps,
  helperText,
  ...props
}: DateFilterFieldProps) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const displayValue = value ? formatIsoDateForFilter(value) : ''
  const inputSlotProps = slotProps?.input as Record<string, unknown> | undefined

  function openPicker() {
    openDatePicker(pickerRef.current)
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        {...props}
        value={displayValue}
        placeholder={DATE_FILTER_PLACEHOLDER}
        helperText={helperText}
        onClick={openPicker}
        slotProps={{
          ...slotProps,
          inputLabel: { shrink: true, ...slotProps?.inputLabel },
          input: {
            ...inputSlotProps,
            readOnly: true,
            sx: { cursor: 'pointer', ...(inputSlotProps?.sx as object) },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  aria-label="Open calendar"
                  onClick={(e) => {
                    e.stopPropagation()
                    openPicker()
                  }}
                >
                  <CalendarTodayOutlinedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <input
        ref={pickerRef}
        type="date"
        value={value}
        min={DATE_INPUT_MIN}
        max={DATE_INPUT_MAX}
        tabIndex={-1}
        aria-hidden
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
        onChange={(e) => {
          const next = sanitizeDateInputValue(e.target.value)
          if (!next || isValidDateInputValue(next)) {
            onValueChange(next)
          }
        }}
      />
    </Box>
  )
}

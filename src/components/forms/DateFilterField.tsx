import { TextField, type TextFieldProps } from '@mui/material'
import type { ClipboardEvent, FormEvent, KeyboardEvent, MouseEvent } from 'react'
import {
  DATE_INPUT_MAX,
  DATE_INPUT_MIN,
  isValidDateInputValue,
  sanitizeDateInputValue,
} from '../../utils/dateFormat'

type DateFilterFieldProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
}

const ALLOWED_KEYS = new Set([
  'Tab',
  'Escape',
  'Enter',
  'Backspace',
  'Delete',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
])

function openDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker !== 'function') return
  try {
    input.showPicker()
  } catch {
    /* Some browsers throw if picker is already open. */
  }
}

function blockManualDateEntry(
  e: KeyboardEvent<HTMLInputElement>,
  onValueChange: (value: string) => void
) {
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault()
    onValueChange('')
    return
  }

  if (ALLOWED_KEYS.has(e.key)) return
  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'x', 'v'].includes(e.key.toLowerCase())) {
    if (e.key.toLowerCase() === 'v') e.preventDefault()
    return
  }

  e.preventDefault()
}

function blockManualBeforeInput(e: FormEvent<HTMLInputElement>) {
  const inputType = (e.nativeEvent as InputEvent).inputType
  if (
    inputType === 'insertText' ||
    inputType === 'insertFromPaste' ||
    inputType === 'insertFromDrop' ||
    inputType === 'insertCompositionText'
  ) {
    e.preventDefault()
  }
}

export default function DateFilterField({
  value,
  onValueChange,
  slotProps,
  onBlur,
  helperText,
  ...props
}: DateFilterFieldProps) {
  const htmlInputProps = slotProps?.htmlInput as Record<string, unknown> | undefined

  return (
    <TextField
      {...props}
      type="date"
      value={value}
      helperText={helperText}
      onChange={(e) => {
        const next = e.target.value
        if (!next || isValidDateInputValue(next)) {
          onValueChange(next)
        }
      }}
      onBlur={(e) => {
        onValueChange(sanitizeDateInputValue(e.target.value))
        onBlur?.(e)
      }}
      slotProps={{
        ...slotProps,
        inputLabel: { shrink: true, ...slotProps?.inputLabel },
        htmlInput: {
          ...htmlInputProps,
          min: DATE_INPUT_MIN,
          max: DATE_INPUT_MAX,
          onClick: (e: MouseEvent<HTMLInputElement>) => {
            openDatePicker(e.currentTarget)
            ;(htmlInputProps?.onClick as ((event: MouseEvent<HTMLInputElement>) => void) | undefined)?.(e)
          },
          onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
            blockManualDateEntry(e, onValueChange)
            ;(htmlInputProps?.onKeyDown as ((event: KeyboardEvent<HTMLInputElement>) => void) | undefined)?.(e)
          },
          onBeforeInput: (e: FormEvent<HTMLInputElement>) => {
            blockManualBeforeInput(e)
            ;(htmlInputProps?.onBeforeInput as ((event: FormEvent<HTMLInputElement>) => void) | undefined)?.(e)
          },
          onPaste: (e: ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault()
            ;(htmlInputProps?.onPaste as ((event: ClipboardEvent<HTMLInputElement>) => void) | undefined)?.(e)
          },
        },
      }}
      sx={{
        '& input[type="date"]': { cursor: 'pointer' },
        '& input[type="date"]::-webkit-calendar-picker-indicator': {
          cursor: 'pointer',
          opacity: 1,
        },
        ...props.sx,
      }}
    />
  )
}

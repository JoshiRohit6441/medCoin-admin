import { Box, TextField } from '@mui/material'
import { useEffect, useRef } from 'react'

const OTP_LEN = 6

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export default function OtpInput({ value, onChange, disabled, autoFocus }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const code = value.replace(/\D/g, '').slice(0, OTP_LEN)

  function setCode(next: string) {
    onChange(next.replace(/\D/g, '').slice(0, OTP_LEN))
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      setCode(code.slice(0, index) + code.slice(index + 1))
      return
    }
    if (cleaned.length > 1) {
      setCode(cleaned)
      refs.current[Math.min(cleaned.length, OTP_LEN - 1)]?.focus()
      return
    }
    const arr = code.split('')
    while (arr.length < OTP_LEN) arr.push('')
    arr[index] = cleaned
    setCode(arr.join(''))
    if (index < OTP_LEN - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LEN - 1) refs.current[index + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    if (pasted) {
      setCode(pasted)
      refs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus()
    }
  }

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 1, sm: 1.25 },
        justifyContent: 'center',
        my: 2,
      }}
      onPaste={handlePaste}
    >
      {Array.from({ length: OTP_LEN }).map((_, i) => (
        <TextField
          key={i}
          inputRef={(el) => {
            refs.current[i] = el
          }}
          value={code[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Dígito ${i + 1} do código`}
          slotProps={{
            htmlInput: {
              maxLength: 6,
              style: {
                textAlign: 'center',
                fontSize: '1.25rem',
                fontWeight: 700,
                padding: '12px 0',
              },
            },
          }}
          sx={{
            width: { xs: 44, sm: 52 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              bgcolor: '#fff',
            },
          }}
        />
      ))}
    </Box>
  )
}

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

const OTP_LENGTH = 6

export function AuthOtpInput({
  id,
  value,
  onChange,
  invalid = false,
  'aria-describedby': ariaDescribedBy,
}: {
  id: string
  value: string
  onChange: (next: string) => void
  invalid?: boolean
  'aria-describedby'?: string
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('')

  function commit(next: string) {
    const cleaned = next.replace(/\D/g, '').slice(0, OTP_LENGTH)
    onChange(cleaned)
  }

  function focusIndex(index: number) {
    const el = inputsRef.current[index]
    el?.focus()
    el?.select()
  }

  function onDigitChange(index: number, digit: string) {
    const only = digit.replace(/\D/g, '')
    if (!only) {
      const chars = [...digits.map((d) => (d === ' ' ? '' : d))]
      chars[index] = ''
      commit(chars.join(''))
      return
    }
    const chars = [...digits.map((d) => (d === ' ' ? '' : d))]
    chars[index] = only.slice(-1)
    const joined = chars.join('')
    commit(joined)
    if (index < OTP_LENGTH - 1 && only) {
      focusIndex(index + 1)
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      const chars = digits.map((d) => (d === ' ' ? '' : d))
      if (!chars[index] && index > 0) {
        event.preventDefault()
        chars[index - 1] = ''
        commit(chars.join(''))
        focusIndex(index - 1)
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusIndex(index - 1)
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault()
      focusIndex(index + 1)
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const text = event.clipboardData.getData('text')
    commit(text)
    const len = text.replace(/\D/g, '').length
    focusIndex(Math.min(len, OTP_LENGTH - 1))
  }

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Authentication code</legend>
      <div className="marketing-auth-otp">
        {digits.map((digit, index) => {
          const filled = digit.trim().length > 0
          const inputId = `${id}-${index}`
          return (
            <input
              key={inputId}
              ref={(el) => {
                inputsRef.current[index] = el
              }}
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={filled ? digit : ''}
              aria-invalid={invalid || undefined}
              aria-describedby={ariaDescribedBy}
              className={cn(
                filled && 'filled',
                invalid && '!border-destructive',
              )}
              onChange={(event) => onDigitChange(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              onPaste={onPaste}
              onFocus={(event) => event.target.select()}
            />
          )
        })}
      </div>
    </fieldset>
  )
}

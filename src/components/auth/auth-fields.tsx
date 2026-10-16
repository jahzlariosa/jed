import { useState, type ReactNode } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'

import { phosphorIcon } from '#/lib/icon'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrengthMeter } from '#/components/auth/password-strength'
import { cn } from '@/lib/utils'

/** Id of the form-level error. Fields point at it with `aria-describedby` while invalid. */
export const AUTH_ERROR_ID = 'auth-form-error'

const fieldClass =
  'auth-field-input border-border bg-card px-3.5 shadow-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function AuthTextField({
  id,
  name,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  maxLength = 255,
  invalid = false,
  hint,
  fieldError,
  required = true,
}: {
  id: string
  name: string
  label: string
  type?: 'text' | 'email'
  autoComplete?: string
  placeholder?: string
  maxLength?: number
  invalid?: boolean
  hint?: string
  fieldError?: string
  required?: boolean
}) {
  const describedBy = [
    invalid || fieldError ? AUTH_ERROR_ID : null,
    fieldError ? `${id}-field-error` : null,
    hint ? `${id}-hint` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="grid gap-[7px]">
      <Label htmlFor={id} className="auth-field-label">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={invalid || fieldError ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          fieldClass,
          (invalid || fieldError) && 'border-destructive',
        )}
      />
      {fieldError ? (
        <p id={`${id}-field-error`} className="auth-field-error">
          {fieldError}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="auth-field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function AuthPasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder,
  invalid = false,
  hint,
  fieldError,
  showStrength,
  password,
  onPasswordChange,
}: {
  id: string
  name: string
  label: string
  autoComplete?: string
  placeholder?: string
  invalid?: boolean
  hint?: string
  fieldError?: string
  showStrength?: boolean
  password?: string
  onPasswordChange?: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [internal, setInternal] = useState('')
  const value = password ?? internal

  const describedBy = [
    invalid || fieldError ? AUTH_ERROR_ID : null,
    fieldError ? `${id}-field-error` : null,
    hint ? `${id}-hint` : null,
    showStrength && value ? 'password-strength-label' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="grid gap-[7px]">
      <Label htmlFor={id} className="auth-field-label">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={8}
          maxLength={72}
          placeholder={placeholder}
          value={onPasswordChange ? value : undefined}
          onChange={
            onPasswordChange
              ? (event) => {
                  const next = event.target.value
                  setInternal(next)
                  onPasswordChange(next)
                }
              : undefined
          }
          aria-invalid={invalid || fieldError ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            fieldClass,
            'pr-11',
            (invalid || fieldError) && 'border-destructive',
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1.5 size-9 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-transparent"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeSlash {...phosphorIcon} className="size-[18px] text-current" />
          ) : (
            <Eye {...phosphorIcon} className="size-[18px] text-current" />
          )}
        </Button>
      </div>
      {showStrength ? (
        <div className="pt-0.5">
          <PasswordStrengthMeter password={value} />
        </div>
      ) : null}
      {fieldError ? (
        <p id={`${id}-field-error`} className="auth-field-error">
          {fieldError}
        </p>
      ) : null}
      {hint && !showStrength ? (
        <p id={`${id}-hint`} className="auth-field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Always rendered (empty = no box) so the live region exists before the message arrives and
 * screen readers announce it. Plain text only.
 */
export function AuthFormError({ message }: { message: string }) {
  return (
    <p
      id={AUTH_ERROR_ID}
      role="alert"
      className="auth-field-error empty:hidden"
    >
      {message || null}
    </p>
  )
}

export function AuthSubmitButton({
  pending,
  pendingLabel,
  disabled = false,
  children,
  variant = 'default',
  type = 'submit',
  onClick,
}: {
  pending: boolean
  pendingLabel?: string
  disabled?: boolean
  children: ReactNode
  variant?: 'default' | 'secondary'
  type?: 'submit' | 'button'
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      onClick={onClick}
      className={cn(
        'marketing-auth-submit',
        variant === 'secondary' && 'secondary',
      )}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}

export function AuthFooterLink({ children }: { children: ReactNode }) {
  return <p className="marketing-auth-foot">{children}</p>
}

import {
  CheckCircle,
  CircleNotch,
  PaperPlaneRight,
} from '@phosphor-icons/react'
import { useServerFn } from '@tanstack/react-start'
import {
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from 'react'

import { submitContactMessageFn } from '#/lib/cms/contact-fns'
import { phosphorIcon } from '#/lib/icon'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FieldName = 'name' | 'email' | 'message'
type FieldErrors = Partial<Record<FieldName, string>>
type Status = 'idle' | 'sending' | 'sent'

const EMAIL_PATTERN = /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

function validateField(name: FieldName, value: string): string | undefined {
  const trimmed = value.trim()
  if (name === 'name' && !trimmed) {
    return 'Please enter your name.'
  }
  if (name === 'email') {
    if (!trimmed) {
      return 'Please enter your email.'
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      return 'Please enter a valid email address.'
    }
  }
  if (name === 'message' && !trimmed) {
    return 'Please write a message.'
  }
  return undefined
}

const inputBase =
  'h-11 w-full rounded-md border border-input bg-background px-3.5 text-base outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 read-only:opacity-80'
const inputInvalid =
  'border-destructive focus-visible:border-destructive ring-2 ring-destructive/20 focus-visible:ring-destructive/20'

export function ContactForm() {
  const submit = useServerFn(submitContactMessageFn)
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const sending = status === 'sending'

  function onBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const name = event.currentTarget.name as FieldName
    const error = validateField(name, event.currentTarget.value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) {
      return
    }
    const form = new FormData(event.currentTarget)
    const values = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      message: String(form.get('message') ?? ''),
    }
    const next: FieldErrors = {}
    for (const key of ['name', 'email', 'message'] as const) {
      next[key] = validateField(key, values[key])
    }
    setErrors(next)
    const firstInvalid = (['name', 'email', 'message'] as const).find(
      (key) => next[key],
    )
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
        ?.focus()
      return
    }
    setServerError(null)
    setStatus('sending')
    try {
      const result = await submit({
        data: { ...values, company: form.get('company') },
      })
      if ('error' in result && result.error) {
        setServerError(
          /too many|rate|wait/i.test(result.error)
            ? 'Too many messages. Please wait a few minutes and try again.'
            : 'Something went wrong. Please try again.',
        )
        setStatus('idle')
        return
      }
      setStatus('sent')
    } catch {
      setServerError('Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  function reset() {
    setErrors({})
    setServerError(null)
    setStatus('idle')
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm md:p-10">
      {status === 'sent' ? (
        <div
          className="flex flex-col items-center py-10 text-center"
          role="status"
        >
          <CheckCircle
            {...phosphorIcon}
            className="size-12 text-[var(--brand)]"
          />
          <h2 className="mt-4 text-xl font-semibold">Message sent</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks, we will get back to you soon.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 h-11 px-6"
            onClick={reset}
          >
            Send another message
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Send a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us a little about what you need.
          </p>
          <form
            ref={formRef}
            noValidate
            onSubmit={(event) => void onSubmit(event)}
            className="mt-8 space-y-6"
          >
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Name" name="name" error={errors.name}>
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  readOnly={sending}
                  onBlur={onBlur}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? 'contact-name-error' : undefined
                  }
                  className={cn(inputBase, errors.name && inputInvalid)}
                />
              </Field>
              <Field label="Email" name="email" error={errors.email}>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  readOnly={sending}
                  onBlur={onBlur}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? 'contact-email-error' : undefined
                  }
                  className={cn(inputBase, errors.email && inputInvalid)}
                />
              </Field>
            </div>
            <Field label="Message" name="message" error={errors.message}>
              <textarea
                id="contact-message"
                name="message"
                readOnly={sending}
                onBlur={onBlur}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={
                  errors.message ? 'contact-message-error' : undefined
                }
                className={cn(
                  inputBase,
                  'h-auto min-h-40 resize-y py-3',
                  errors.message && inputInvalid,
                )}
              />
            </Field>
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="mt-8 flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
              <span />
              <Button
                type="submit"
                disabled={sending}
                className="h-11 w-full px-6 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {sending ? (
                  <>
                    <CircleNotch
                      {...phosphorIcon}
                      className="size-4 animate-spin"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    Send message
                    <PaperPlaneRight {...phosphorIcon} className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string
  name: FieldName
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={`contact-${name}`}
        className="mb-2 block text-sm font-medium"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`contact-${name}-error`}
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

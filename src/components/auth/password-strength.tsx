import { cn } from '@/lib/utils'

export type PasswordStrength = 0 | 1 | 2 | 3 | 4

export function scorePassword(value: string): PasswordStrength {
  if (!value) {
    return 0
  }
  let score = 0
  if (value.length >= 8) {
    score += 1
  }
  if (value.length >= 12) {
    score += 1
  }
  if (/[0-9]/.test(value) || /[^A-Za-z0-9]/.test(value)) {
    score += 1
  }
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    score += 1
  }
  return Math.min(4, score) as PasswordStrength
}

const labelForScore: Record<PasswordStrength, string> = {
  0: 'Enter a password',
  1: 'Weak · Use 8+ characters with a mix of types.',
  2: 'Fair · Add uppercase or a symbol.',
  3: 'Good · Add a symbol to make it stronger.',
  4: 'Strong · Use 8+ characters with a mix of types.',
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = scorePassword(password)
  const label = labelForScore[score]

  const onClass =
    score === 1
      ? 'bg-[#dc2626]'
      : score === 2
        ? 'bg-[#ea580c]'
        : score === 3
          ? 'bg-[#ca8a04]'
          : score === 4
            ? 'bg-[#16a34a]'
            : ''

  return (
    <div className="grid gap-1.5">
      <div
        className="marketing-auth-strength"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Password strength"
      >
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(index < score ? onClass : undefined)}
          />
        ))}
      </div>
      {password ? (
        <p
          className="text-xs text-muted-foreground"
          id="password-strength-label"
        >
          {label}
        </p>
      ) : null}
    </div>
  )
}

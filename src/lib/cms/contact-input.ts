export const CONTACT_EMAIL_PATTERN =
  /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

/** Removes CR, LF and other control characters so text is safe in email headers. */
export function stripControlChars(value: string): string {
  return (
    value
      // biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point
      .replace(/[\u0000-\u001F\u007F]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  )
}

const MAX_NAME = 120
const MAX_EMAIL = 255
const MAX_MESSAGE = 4000

export function parseContactInput(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Unable to send message')
  }
  const raw = input as Record<string, unknown>
  const email = String(raw.email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, MAX_EMAIL)
  return {
    name: stripControlChars(String(raw.name ?? '')).slice(0, MAX_NAME),
    email: CONTACT_EMAIL_PATTERN.test(email) ? email : '',
    message: String(raw.message ?? '')
      .trim()
      .slice(0, MAX_MESSAGE),
    company: String(raw.company ?? '')
      .trim()
      .slice(0, 200),
  }
}

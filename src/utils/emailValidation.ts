const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Empty email is allowed (optional field). */
export function isValidOptionalEmail(value: string): boolean {
  const email = value.trim()
  if (!email) return true
  return EMAIL_RE.test(email)
}

export function optionalEmailError(value: string): string {
  if (isValidOptionalEmail(value)) return ''
  return 'Enter a valid email address (e.g. doctor@example.com).'
}

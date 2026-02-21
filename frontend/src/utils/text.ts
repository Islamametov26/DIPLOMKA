export function cleanText(value: string | null | undefined, fallback = '—'): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    return fallback
  }

  const questionMarks = (text.match(/\?/g) || []).length
  const hasBrokenReplacement = text.includes('�')
  const hasMojibake = /[ÐÑÃÂ]/.test(text)

  if (questionMarks >= 2 || hasBrokenReplacement || hasMojibake) {
    return fallback
  }

  return text
}

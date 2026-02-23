export function cleanText(value: string | null | undefined, fallback = '—'): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    return fallback
  }

  const questionMarks = (text.match(/\?/g) || []).length
  const hasBrokenReplacement = text.includes('�')
  const hasMojibake = /[ÐÑÃÂ]/.test(text)
  const hasLetters = /\p{L}/u.test(text)
  const hasQuestionNoise = /\?{2,}/.test(text) || (questionMarks > 0 && !hasLetters)

  if (hasQuestionNoise || hasBrokenReplacement || hasMojibake) {
    return fallback
  }

  return text
}

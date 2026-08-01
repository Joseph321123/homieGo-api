const sanitizeString = (value, { max = 500, allowEmpty = false } = {}) => {
  if (value == null) return allowEmpty ? '' : null
  const cleaned = String(value).trim().replace(/[<>]/g, '')
  if (!cleaned && !allowEmpty) return null
  return cleaned.slice(0, max)
}

const toPositiveNumber = (value, fallback = null) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

const toNonNegativeNumber = (value, fallback = null) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return fallback
  return n
}

const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))

module.exports = {
  sanitizeString,
  toPositiveNumber,
  toNonNegativeNumber,
  isValidEmail,
  isValidDateString,
}

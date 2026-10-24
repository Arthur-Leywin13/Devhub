// Validation d'URL : protège contre les schémas dangereux (javascript:,
// data:, file:...) dans tout lien saisi par un utilisateur.

// Accepte "exemple.com" ou "https://exemple.com/page" et renvoie une URL
// http(s) normalisée, ou null si le lien est invalide/dangereux.
export function normalizeUrl(input) {
  const raw = (input || '').trim()
  if (!raw) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null
    return url.toString()
  } catch {
    return null
  }
}

export function isSafeUrl(value) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function getDomain(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

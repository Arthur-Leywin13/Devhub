import { createPublicKey, verify as verifySignature } from 'node:crypto'
import { env } from '../config/env.js'

const CERTIFICATES_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const CLOCK_TOLERANCE_SECONDS = 60

let cachedCertificates = null
let certificatesExpireAt = 0
let pendingCertificateRequest = null

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url')
}

async function getSigningCertificates(forceRefresh = false) {
  if (!forceRefresh && cachedCertificates && Date.now() < certificatesExpireAt) {
    return cachedCertificates
  }

  if (pendingCertificateRequest) return pendingCertificateRequest

  pendingCertificateRequest = (async () => {
    let response
    try {
      response = await fetch(CERTIFICATES_URL, {
        signal: AbortSignal.timeout(8000),
      })
    } catch {
      const error = new Error('Impossible de joindre le service de vérification Google.')
      error.status = 503
      throw error
    }

    if (!response.ok) {
      const error = new Error('Les clés publiques Google sont temporairement indisponibles.')
      error.status = 503
      throw error
    }

    let certificates
    try {
      certificates = await response.json()
    } catch {
      const error = new Error('Réponse invalide du service de vérification Google.')
      error.status = 503
      throw error
    }

    if (!certificates || typeof certificates !== 'object' || Array.isArray(certificates)) {
      const error = new Error('Clés publiques Google invalides.')
      error.status = 503
      throw error
    }

    const cacheControl = response.headers.get('cache-control') || ''
    const maxAge = Number(cacheControl.match(/max-age=(\\d+)/i)?.[1] || 300)
    cachedCertificates = certificates
    certificatesExpireAt = Date.now() + Math.max(0, Math.min(maxAge, 86400)) * 1000
    return cachedCertificates
  })()

  try {
    return await pendingCertificateRequest
  } finally {
    pendingCertificateRequest = null
  }
}

function invalidToken() {
  const error = new Error('La session Google a expiré ou n’est pas valide. Reconnectez-vous.')
  error.status = 401
  return error
}

export async function verifyFirebaseIdToken(idToken) {
  if (!env.FIREBASE_PROJECT_ID) {
    const error = new Error('FIREBASE_PROJECT_ID n’est pas configuré sur le serveur.')
    error.status = 503
    throw error
  }

  const parts = idToken.split('.')
  if (parts.length !== 3) throw invalidToken()

  let header
  let payload
  try {
    header = JSON.parse(decodeBase64Url(parts[0]).toString('utf8'))
    payload = JSON.parse(decodeBase64Url(parts[1]).toString('utf8'))
  } catch {
    throw invalidToken()
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw invalidToken()
  }

  let certificates = await getSigningCertificates()
  let certificate = certificates[header.kid]
  if (!certificate) {
    certificates = await getSigningCertificates(true)
    certificate = certificates[header.kid]
  }
  if (typeof certificate !== 'string') throw invalidToken()

  let signatureIsValid = false
  try {
    const publicKey = createPublicKey(certificate)
    signatureIsValid = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      publicKey,
      decodeBase64Url(parts[2]),
    )
  } catch {
    throw invalidToken()
  }
  if (!signatureIsValid) throw invalidToken()

  const now = Math.floor(Date.now() / 1000)
  const projectId = env.FIREBASE_PROJECT_ID
  if (
    payload.aud !== projectId ||
    payload.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof payload.sub !== 'string' ||
    payload.sub.length < 1 ||
    payload.sub.length > 128 ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= now ||
    !Number.isFinite(payload.iat) ||
    payload.iat > now + CLOCK_TOLERANCE_SECONDS ||
    !Number.isFinite(payload.auth_time) ||
    payload.auth_time > now + CLOCK_TOLERANCE_SECONDS
  ) {
    throw invalidToken()
  }

  return {
    ...payload,
    uid: payload.sub,
  }
}

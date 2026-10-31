import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { env } from '../config/env.js'

let firebaseAuth

export function getFirebaseAdminAuth() {
  if (firebaseAuth) return firebaseAuth

  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const error = new Error('Firebase Admin n’est pas configuré sur le serveur.')
    error.status = 503
    throw error
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)
  } catch {
    const error = new Error('La clé de service Firebase est invalide.')
    error.status = 503
    throw error
  }

  const projectId = env.FIREBASE_PROJECT_ID || serviceAccount.project_id
  if (!projectId || serviceAccount.project_id !== projectId) {
    const error = new Error('Le projet de la clé Firebase ne correspond pas à FIREBASE_PROJECT_ID.')
    error.status = 503
    throw error
  }

  const appName = 'devhub-firebase-admin'
  const app = getApps().find((item) => item.name === appName)
    || initializeApp({ credential: cert(serviceAccount), projectId }, appName)

  firebaseAuth = getAuth(app)
  return firebaseAuth
}

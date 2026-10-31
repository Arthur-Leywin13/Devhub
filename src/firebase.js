import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let authInstance

export function getFirebaseAuth() {
  if (authInstance) return authInstance

  const required = ['apiKey', 'authDomain', 'projectId', 'appId']
  const missing = required.filter((key) => !firebaseConfig[key])
  if (missing.length) {
    throw new Error(`Configuration Firebase manquante : ${missing.map((key) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`).join(', ')}.`)
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  authInstance = getAuth(app)
  return authInstance
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(auth, provider)
  return credential.user.getIdToken()
}

export async function getFirebaseCurrentUser() {
  const auth = getFirebaseAuth()
  await auth.authStateReady()
  return auth.currentUser
}

export async function signOutFirebase() {
  if (!authInstance && !firebaseConfig.apiKey) return
  await signOut(getFirebaseAuth())
}

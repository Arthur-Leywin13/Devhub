import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession } from './mockSession'
import { usersMock } from '../mocks/users.mock'
import { getFirebaseCurrentUser, signInWithGoogle, signOutFirebase } from '../firebase'

function bannedError(user) {
  const error = new Error(`Ce compte a été banni. Motif : ${user.statusReason || 'non précisé'}.`)
  error.status = 403
  return error
}

async function exchangeFirebaseSession(idToken) {
  return client.post('/auth/firebase', { idToken })
}

export const authApi = {
  async login({ emailOrUsername, password }) {
    if (isMockMode) {
      await delay()
      const wanted = (emailOrUsername || '').trim().toLowerCase()
      const accounts = usersMock.list()
      const user =
        accounts.find((u) => u.username.toLowerCase() === wanted || `${u.username}@example.com` === wanted) ||
        accounts[0]
      if (!user) throw new Error('Aucun compte de test disponible.')
      if (user.status === 'banned') throw bannedError(user)
      mockSession.setUserId(user.id)
      return { user }
    }
    return client.post('/auth/login', { emailOrUsername, password })
  },

  async register({ username, email, password }) {
    if (isMockMode) {
      await delay()
      const user = usersMock.add({
        id: `u${Date.now()}`,
        username,
        name: username,
        avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(username)}`,
        bio: '',
        role: 'user',
        status: 'active',
        statusReason: null,
        suspendedUntil: null,
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString(),
      })
      mockSession.setUserId(user.id)
      return { user }
    }
    return client.post('/auth/register', { username, email, password })
  },

  async loginWithProvider(provider) {
    if (isMockMode) {
      await delay()
      const user = usersMock.list()[0]
      if (!user) throw new Error('Aucun compte de test disponible.')
      if (user.status === 'banned') throw bannedError(user)
      mockSession.setUserId(user.id)
      return { user }
    }

    if (provider !== 'google') {
      throw new Error('Pour le moment, seul Google via Firebase est activé.')
    }

    const idToken = await signInWithGoogle()
    try {
      return await exchangeFirebaseSession(idToken)
    } catch (error) {
      await signOutFirebase()
      throw error
    }
  },

  async logout() {
    if (isMockMode) {
      await delay(150)
      mockSession.clear()
      return null
    }
    try {
      return await client.post('/auth/logout')
    } finally {
      await signOutFirebase()
    }
  },

  async getCurrentUser() {
    if (isMockMode) {
      await delay(200)
      const id = mockSession.getUserId()
      if (!id) return null
      return usersMock.getById(id)
    }

    try {
      return await client.get('/auth/me')
    } catch (error) {
      if (error.status !== 401) throw error
    }

    // Restore the HttpOnly backend session after its cookie expires, using
    // the Firebase user's persisted Google session.
    const firebaseUser = await getFirebaseCurrentUser()
    if (!firebaseUser) return null
    const idToken = await firebaseUser.getIdToken()
    const { user } = await exchangeFirebaseSession(idToken)
    return user
  },
}

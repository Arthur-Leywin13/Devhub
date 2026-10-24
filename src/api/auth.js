import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession } from './mockSession'
import { usersMock } from '../mocks/users.mock'

// Contrat attendu du backend réel :
// POST /auth/login       { emailOrUsername, password } -> { user, token? }
//                         403 { message } si le compte est banni
// POST /auth/register    { username, email, password }  -> { user, token? }
// POST /auth/logout      -> 204
// GET  /auth/me          -> user | 401
//                         (un compte banni reçoit son User avec status 'banned', pour que le
//                          frontend affiche l'écran de bannissement ; tout le reste de l'API
//                          répond 403 pour lui, hors /auth/logout)
// GET  /auth/:provider?redirect=/chemin   (github | google) -> redirection complète gérée par
//   le backend (échange OAuth, création/liaison du compte, pose du cookie
//   de session), qui redirige ensuite vers le frontend une fois connecté.
//   Le frontend ne fait qu'une redirection de page, il n'appelle jamais
//   cette route en fetch().

function bannedError(user) {
  const error = new Error(`Ce compte a été banni. Motif : ${user.statusReason || 'non précisé'}.`)
  error.status = 403
  return error
}

export const authApi = {
  async login({ emailOrUsername, password }) {
    if (isMockMode) {
      await delay()
      // Mock : on retrouve le compte de test par son pseudo (utilisateur1…4, ou
      // utilisateurN@example.com) ; sinon le premier. Aucun mot de passe vérifié.
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

  async loginWithProvider(provider, redirectTo = '/') {
    if (isMockMode) {
      await delay()
      // Pas de vrai OAuth en mode mock : on connecte le premier compte de test.
      const user = usersMock.list()[0]
      if (!user) throw new Error('Aucun compte de test disponible.')
      if (user.status === 'banned') throw bannedError(user)
      mockSession.setUserId(user.id)
      return { user }
    }
    // Redirection plein-écran vers le backend, qui gère tout le flux OAuth
    // puis redirige vers le frontend une fois la session créée.
    const apiUrl = import.meta.env.VITE_API_URL || ''
    window.location.href = `${apiUrl}/auth/${provider}?redirect=${encodeURIComponent(redirectTo)}`
    return null
  },

  async logout() {
    if (isMockMode) {
      await delay(150)
      mockSession.clear()
      return null
    }
    return client.post('/auth/logout')
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
    } catch (err) {
      if (err.status === 401) return null
      throw err
    }
  },
}

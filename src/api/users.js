import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { usersMock } from '../mocks/users.mock'
import { isStaff } from '../lib/permissions'

// Contrat attendu :
// GET   /users/:username
// PATCH /users/me
// POST  /users/:id/follow
// DELETE /users/:id/follow

export const usersApi = {
  async getSuggested(limit = 4, excludeId = null) {
    if (isMockMode) {
      await delay()
      return usersMock
        .list()
        .filter((u) => u.id !== excludeId && u.status !== 'banned')
        .slice(0, limit)
    }
    return client.get('/users/suggested', { limit, exclude: excludeId })
  },

  async getById(id) {
    if (isMockMode) {
      await delay(100)
      return usersMock.getById(id)
    }
    return client.get(`/users/id/${id}`)
  },

  async getByUsername(username) {
    if (isMockMode) {
      await delay()
      const user = usersMock.getByUsername(username)
      const viewerId = mockSession.getUserId()
      const viewer = viewerId ? usersMock.getById(viewerId) : null
      if (!user || (user.status === 'banned' && !isStaff(viewer))) {
        const error = new Error('Profil introuvable.')
        error.status = 404
        throw error
      }
      return user
    }
    return client.get(`/users/${username}`)
  },

  async update(patch) {
    if (isMockMode) {
      assertCanWrite()
      await delay()
      const id = mockSession.getUserId()
      if (!id) throw new Error('Non authentifié.')
      return usersMock.update(id, patch)
    }
    return client.patch('/users/me', patch)
  },

  async follow(userId) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      const currentId = mockSession.getUserId()
      if (!currentId) throw new Error('Non authentifié.')
      usersMock.follow(currentId, userId)
      return { following: true }
    }
    return client.post(`/users/${userId}/follow`)
  },

  async unfollow(userId) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      const currentId = mockSession.getUserId()
      if (!currentId) throw new Error('Non authentifié.')
      usersMock.unfollow(currentId, userId)
      return { following: false }
    }
    return client.delete(`/users/${userId}/follow`)
  },

  async isFollowing(userId) {
    if (isMockMode) {
      await delay(100)
      const currentId = mockSession.getUserId()
      if (!currentId) return false
      return usersMock.isFollowing(currentId, userId)
    }
    const res = await client.get(`/users/${userId}/follow-status`)
    return res?.following ?? false
  },
}

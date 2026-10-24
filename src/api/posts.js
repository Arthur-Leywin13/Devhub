import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { postsMock } from '../mocks/posts.mock'
import { savedMock } from '../mocks/saved.mock'

// Contrat attendu :
// GET    /posts/:id            -> Post ou 404
// GET    /feed
// POST   /posts                { content, image?, video?, link?: { url }, linkedProjectId?, linkedArticleId? }
//        (image OU video, pas les deux ; l'aperçu du lien est généré côté serveur)
// POST   /posts/:id/like
// DELETE /posts/:id/like
// POST   /posts/:id/save
// DELETE /posts/:id/save
// GET    /saved
// DELETE /saved/:id

export const postsApi = {
  async getById(id) {
    if (isMockMode) {
      await delay(150)
      const post = postsMock.getById(id)
      if (!post) {
        const error = new Error('Publication introuvable.')
        error.status = 404
        throw error
      }
      return post
    }
    return client.get(`/posts/${id}`)
  },

  async getFeed(params = {}) {
    if (isMockMode) {
      await delay()
      return postsMock.list(params)
    }
    return client.get('/feed', params)
  },

  async create(data) {
    if (isMockMode) {
      assertCanWrite()
      await delay(400)
      const userId = mockSession.getUserId()
      if (!userId) throw new Error('Non authentifié.')
      return postsMock.create({ ...data, authorId: userId })
    }
    return client.post('/posts', data)
  },

  async like(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      return postsMock.like(id)
    }
    return client.post(`/posts/${id}/like`)
  },

  async unlike(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      return postsMock.unlike(id)
    }
    return client.delete(`/posts/${id}/like`)
  },

  async save(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      postsMock.save(id)
      const userId = mockSession.getUserId()
      if (userId) savedMock.add(userId, 'post', id)
      return { saved: true }
    }
    return client.post(`/posts/${id}/save`)
  },

  async unsave(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      postsMock.unsave(id)
      const userId = mockSession.getUserId()
      if (userId) savedMock.removeByTarget(userId, 'post', id)
      return { saved: false }
    }
    return client.delete(`/posts/${id}/save`)
  },

  async getSaved() {
    if (isMockMode) {
      await delay()
      const userId = mockSession.getUserId()
      if (!userId) return []
      return savedMock.listFor(userId)
    }
    return client.get('/saved')
  },

  async unsaveEntry(savedId) {
    if (isMockMode) {
      await delay(150)
      const userId = mockSession.getUserId()
      const entry = userId ? savedMock.listFor(userId).find((s) => s.id === savedId) : null
      if (entry?.targetType === 'post') postsMock.unsave(entry.targetId)
      savedMock.remove(savedId)
      return null
    }
    return client.delete(`/saved/${savedId}`)
  },
}

import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { articlesMock } from '../mocks/articles.mock'
import { savedMock } from '../mocks/saved.mock'

// Contrat attendu :
// GET  /articles?authorId=&category=&q=
// GET  /articles/:id
// POST /articles
// POST /articles/:id/save
// DELETE /articles/:id/save
// POST /articles/:id/like
// DELETE /articles/:id/like

export const articlesApi = {
  async getAll(params = {}) {
    if (isMockMode) {
      await delay()
      return articlesMock.list(params)
    }
    return client.get('/articles', params)
  },

  async getById(id) {
    if (isMockMode) {
      await delay()
      const article = articlesMock.getById(id)
      if (!article) {
        const error = new Error('Article introuvable.')
        error.status = 404
        throw error
      }
      const userId = mockSession.getUserId()
      return { ...article, savedByCurrentUser: userId ? savedMock.has(userId, 'article', article.id) : false }
    }
    return client.get(`/articles/${id}`)
  },

  async create(data) {
    if (isMockMode) {
      assertCanWrite()
      await delay(500)
      return articlesMock.create(data)
    }
    return client.post('/articles', data)
  },

  async like(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      return articlesMock.like(id)
    }
    return client.post(`/articles/${id}/like`)
  },

  async unlike(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      return articlesMock.unlike(id)
    }
    return client.delete(`/articles/${id}/like`)
  },

  async save(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      const userId = mockSession.getUserId()
      if (!userId) throw new Error('Non authentifié.')
      savedMock.add(userId, 'article', id)
      return { saved: true }
    }
    return client.post(`/articles/${id}/save`)
  },

  async unsave(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      const userId = mockSession.getUserId()
      if (userId) savedMock.removeByTarget(userId, 'article', id)
      return { saved: false }
    }
    return client.delete(`/articles/${id}/save`)
  },
}

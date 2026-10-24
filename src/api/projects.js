import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { projectsMock } from '../mocks/projects.mock'
import { savedMock } from '../mocks/saved.mock'

// Contrat attendu :
// GET    /projects?authorId=&category=&q=&sort=
// GET    /projects/:id
// POST   /projects
// PATCH  /projects/:id
// DELETE /projects/:id
// POST   /projects/:id/save
// DELETE /projects/:id/save
// POST   /projects/:id/like
// DELETE /projects/:id/like
// GET    /projects/:id/comments
// POST   /projects/:id/comments

export const projectsApi = {
  async getAll(params = {}) {
    if (isMockMode) {
      await delay()
      return projectsMock.list(params)
    }
    return client.get('/projects', params)
  },

  async getById(id) {
    if (isMockMode) {
      await delay()
      const project = projectsMock.getById(id)
      if (!project) {
        const error = new Error('Projet introuvable.')
        error.status = 404
        throw error
      }
      const userId = mockSession.getUserId()
      return { ...project, savedByCurrentUser: userId ? savedMock.has(userId, 'project', project.id) : false }
    }
    return client.get(`/projects/${id}`)
  },

  async create(data) {
    if (isMockMode) {
      assertCanWrite()
      await delay(500)
      return projectsMock.create(data)
    }
    return client.post('/projects', data)
  },

  async update(id, patch) {
    if (isMockMode) {
      assertCanWrite()
      await delay()
      return projectsMock.update(id, patch)
    }
    return client.patch(`/projects/${id}`, patch)
  },

  async remove(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay()
      return projectsMock.remove(id)
    }
    return client.delete(`/projects/${id}`)
  },

  async like(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      return projectsMock.like(id)
    }
    return client.post(`/projects/${id}/like`)
  },

  async unlike(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      return projectsMock.unlike(id)
    }
    return client.delete(`/projects/${id}/like`)
  },

  async save(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      const userId = mockSession.getUserId()
      if (!userId) throw new Error('Non authentifié.')
      savedMock.add(userId, 'project', id)
      return { saved: true }
    }
    return client.post(`/projects/${id}/save`)
  },

  async unsave(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      const userId = mockSession.getUserId()
      if (userId) savedMock.removeByTarget(userId, 'project', id)
      return { saved: false }
    }
    return client.delete(`/projects/${id}/save`)
  },
}

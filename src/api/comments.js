import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { commentsMock } from '../mocks/comments.mock'
import { projectsMock } from '../mocks/projects.mock'
import { articlesMock } from '../mocks/articles.mock'
import { postsMock } from '../mocks/posts.mock'

// Contrat attendu :
// GET    /:targetType/:targetId/comments
// POST   /:targetType/:targetId/comments
// DELETE /comments/:id

// En mode mock, le compteur affiché sur les cartes (commentsCount) doit
// rester cohérent avec le nombre réel de commentaires du projet/article.
// Le backend réel fera ce calcul côté serveur (trigger, requête agrégée...).
function bumpCount(targetType, targetId, delta) {
  if (targetType === 'project') {
    const p = projectsMock.getById(targetId)
    if (p) projectsMock.update(targetId, { commentsCount: Math.max(0, p.commentsCount + delta) })
  }
  if (targetType === 'article') {
    const a = articlesMock.getById(targetId)
    if (a) articlesMock.update(targetId, { commentsCount: Math.max(0, a.commentsCount + delta) })
  }
  if (targetType === 'post') {
    const post = postsMock.getById(targetId)
    if (post) postsMock.update(targetId, { commentsCount: Math.max(0, post.commentsCount + delta) })
  }
}

export const commentsApi = {
  async listFor(targetType, targetId) {
    if (isMockMode) {
      await delay()
      return commentsMock.listFor(targetType, targetId)
    }
    return client.get(`/${targetType}s/${targetId}/comments`)
  },

  async add(targetType, targetId, text) {
    if (isMockMode) {
      assertCanWrite()
      await delay(300)
      const userId = mockSession.getUserId()
      if (!userId) throw new Error('Non authentifié.')
      const comment = commentsMock.add(targetType, targetId, userId, text)
      bumpCount(targetType, targetId, 1)
      return comment
    }
    return client.post(`/${targetType}s/${targetId}/comments`, { text })
  },

  async remove(targetType, targetId, id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(200)
      commentsMock.remove(id)
      bumpCount(targetType, targetId, -1)
      return null
    }
    return client.delete(`/comments/${id}`)
  },
}

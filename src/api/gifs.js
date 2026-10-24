import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { gifsMock } from '../mocks/gifs.mock'

// Contrat attendu :
// GET    /gifs            -> Gif[] (bibliothèque de la plateforme + ceux créés par l'utilisateur connecté)
// POST   /gifs             { url, name } -> Gif créé (url = fichier .gif déjà uploadé, voir BACKEND.md)
// DELETE /gifs/:id         -> 204 (uniquement le créateur)
//
// Gif: { id, authorId: string | null, url, name, createdAt }

export const gifsApi = {
  async getAll() {
    if (isMockMode) {
      await delay(150)
      const userId = mockSession.getUserId()
      return gifsMock.listAvailableFor(userId)
    }
    return client.get('/gifs')
  },

  async create({ url, name }) {
    if (isMockMode) {
      assertCanWrite()
      await delay(300)
      const userId = mockSession.getUserId()
      if (!userId) throw new Error('Non authentifié.')
      return gifsMock.create(userId, { url, name })
    }
    return client.post('/gifs', { url, name })
  },

  async remove(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      const userId = mockSession.getUserId()
      gifsMock.remove(id, userId)
      return null
    }
    return client.delete(`/gifs/${id}`)
  },
}

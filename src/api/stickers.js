import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { stickersMock } from '../mocks/stickers.mock'

// Contrat attendu :
// GET    /stickers              -> Sticker[] (ceux de la plateforme + ceux créés par l'utilisateur connecté)
// POST   /stickers               { type: 'emoji' | 'image', content?, imageUrl?, name } -> Sticker créé
// DELETE /stickers/:id           -> 204 (uniquement le créateur)
//
// Sticker: { id, authorId: string | null, type: 'emoji' | 'image', content, name, createdAt }
// - type 'emoji': `content` est le caractère emoji affiché en grand
// - type 'image': `content` est l'URL de l'image (déjà uploadée, voir BACKEND.md)

export const stickersApi = {
  async getAll() {
    if (isMockMode) {
      await delay(150)
      const userId = mockSession.getUserId()
      return stickersMock.listAvailableFor(userId)
    }
    return client.get('/stickers')
  },

  async create({ type, content, name }) {
    if (isMockMode) {
      assertCanWrite()
      await delay(300)
      const userId = mockSession.getUserId()
      if (!userId) throw new Error('Non authentifié.')
      return stickersMock.create(userId, { type, content, name })
    }
    return client.post('/stickers', { type, content, name })
  },

  async remove(id) {
    if (isMockMode) {
      assertCanWrite()
      await delay(150)
      const userId = mockSession.getUserId()
      stickersMock.remove(id, userId)
      return null
    }
    return client.delete(`/stickers/${id}`)
  },
}

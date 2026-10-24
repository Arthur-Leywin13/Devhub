import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { messagesMock } from '../mocks/messages.mock'

// Contrat attendu :
// GET  /conversations                          -> Conversation[] (utilisateur connecté)
// GET  /conversations/:id                       -> Conversation
// POST /conversations                           { otherUserId } -> Conversation (créée ou existante)
// DELETE /conversations/:id                     -> 204 (supprime pour MOI uniquement : l'autre
//                                                  participant garde la conversation)
// PATCH /conversations/:id                      { wallpaperUrl } -> Conversation
// GET  /conversations/:id/messages              -> Message[] (messages supprimés : contenu vidé)
// POST /conversations/:id/messages              { text, attachments } -> Message
// PATCH /conversations/:id/messages/:messageId  { text } -> Message (auteur uniquement, editedAt renseigné)
// DELETE /conversations/:id/messages/:messageId -> 204 (auteur uniquement ; contenu effacé pour tous,
//                                                  le message devient « Message supprimé »)
// POST /conversations/:id/read                  -> 204
//
// Attachment: { type: 'image' | 'audio' | 'video', url, name }
// En production, `url` doit pointer vers un fichier déjà uploadé (voir
// section Uploads de BACKEND.md) — le frontend n'envoie jamais le binaire
// directement dans ce endpoint.

function requireUserId() {
  const id = mockSession.getUserId()
  if (!id) throw new Error('Non authentifié.')
  return id
}

export const messagesApi = {
  async getConversation(id) {
    if (isMockMode) {
      await delay(100)
      const conv = messagesMock.getConversation(id)
      if (!conv) {
        const error = new Error('Conversation introuvable.')
        error.status = 404
        throw error
      }
      return conv
    }
    return client.get(`/conversations/${id}`)
  },

  async getConversations() {
    if (isMockMode) {
      await delay()
      const userId = requireUserId()
      return messagesMock.listConversationsFor(userId).map((c) => ({
        ...c,
        lastMessage: messagesMock.lastMessageFor(c.id, userId),
        unreadCount: messagesMock.unreadCountFor(c.id, userId),
      }))
    }
    return client.get('/conversations')
  },

  async getOrCreateConversation(otherUserId) {
    if (isMockMode) {
      assertCanWrite()
      await delay(200)
      const userId = requireUserId()
      return messagesMock.getOrCreateConversation(userId, otherUserId)
    }
    return client.post('/conversations', { otherUserId })
  },

  async deleteConversation(conversationId) {
    if (isMockMode) {
      await delay(200)
      messagesMock.clearConversationFor(conversationId, requireUserId())
      return null
    }
    return client.delete(`/conversations/${conversationId}`)
  },

  async getMessages(conversationId) {
    if (isMockMode) {
      await delay()
      return messagesMock.listMessages(conversationId, requireUserId())
    }
    return client.get(`/conversations/${conversationId}/messages`)
  },

  async sendMessage(conversationId, { text, attachments }) {
    if (isMockMode) {
      assertCanWrite()
      await delay(300)
      const userId = requireUserId()
      return messagesMock.sendMessage(conversationId, userId, { text, attachments })
    }
    return client.post(`/conversations/${conversationId}/messages`, { text, attachments })
  },

  async editMessage(conversationId, messageId, text) {
    if (isMockMode) {
      assertCanWrite()
      await delay(250)
      return messagesMock.editMessage(messageId, requireUserId(), text)
    }
    return client.patch(`/conversations/${conversationId}/messages/${messageId}`, { text })
  },

  async deleteMessage(conversationId, messageId) {
    if (isMockMode) {
      assertCanWrite()
      await delay(250)
      messagesMock.deleteMessage(messageId, requireUserId())
      return null
    }
    return client.delete(`/conversations/${conversationId}/messages/${messageId}`)
  },

  async setWallpaper(conversationId, wallpaperUrl) {
    if (isMockMode) {
      assertCanWrite()
      await delay(200)
      return messagesMock.setWallpaper(conversationId, wallpaperUrl)
    }
    return client.patch(`/conversations/${conversationId}`, { wallpaperUrl })
  },

  async markRead(conversationId) {
    if (isMockMode) {
      await delay(100)
      const userId = requireUserId()
      messagesMock.markRead(conversationId, userId)
      return null
    }
    return client.post(`/conversations/${conversationId}/read`)
  },
}

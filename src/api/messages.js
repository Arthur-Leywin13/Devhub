import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { messagesMock } from '../mocks/messages.mock'

function mapMessage(message) {
  return {
    ...message,
    text: message.deletedAt ? 'Message supprimé' : (message.body ?? message.text ?? ''),
    attachments: message.attachments || [],
  }
}

function mapConversation(conversation) {
  const participantIds = conversation.participantIds
    || (conversation.participants || []).map((participant) => participant.userId)
  const lastMessage = conversation.lastMessage ? mapMessage(conversation.lastMessage) : null
  return {
    ...conversation,
    participantIds,
    wallpaperUrl: conversation.wallpaperUrl ?? null,
    lastMessage,
    unreadCount: conversation.unreadCount ?? 0,
  }
}

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
    return mapConversation(await client.get(`/conversations/${id}`))
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
    const conversations = await client.get('/conversations')
    return conversations.map(mapConversation)
  },

  async getOrCreateConversation(otherUserId) {
    if (isMockMode) {
      assertCanWrite()
      await delay(200)
      const userId = requireUserId()
      return messagesMock.getOrCreateConversation(userId, otherUserId)
    }
    return mapConversation(await client.post('/conversations', { otherUserId }))
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
    const messages = await client.get(`/conversations/${conversationId}/messages`)
    return messages.map(mapMessage)
  },

  async sendMessage(conversationId, { text, attachments = [] }) {
    if (isMockMode) {
      assertCanWrite()
      await delay(300)
      const userId = requireUserId()
      return messagesMock.sendMessage(conversationId, userId, { text, attachments })
    }
    if (attachments.length) {
      throw new Error('La messagerie en direct accepte actuellement les messages texte uniquement. Les pièces jointes seront ajoutées ensuite.')
    }
    return mapMessage(await client.post(`/conversations/${conversationId}/messages`, { text }))
  },

  async editMessage(conversationId, messageId, text) {
    if (isMockMode) {
      assertCanWrite()
      await delay(250)
      return messagesMock.editMessage(messageId, requireUserId(), text)
    }
    return mapMessage(await client.patch(`/conversations/${conversationId}/messages/${messageId}`, { text }))
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

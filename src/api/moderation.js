import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession } from './mockSession'
import { usersMock } from '../mocks/users.mock'
import { messagesMock } from '../mocks/messages.mock'
import { moderationMock } from '../mocks/moderation.mock'
import { REPORT_REASONS } from '../lib/moderation'

// Côté utilisateur (tout compte connecté, même suspendu) :
// POST /reports  { targetType, targetId, reason, details?, context? } -> 201 { id }
//   targetType : 'user' | 'project' | 'article' | 'post' | 'comment' | 'message' | 'course'
//   context    : { conversationId } pour un message privé. Le serveur doit capturer une
//                COPIE du message au moment du signalement (il peut être modifié/supprimé ensuite).
//   Le signalant ne reçoit jamais d'information sur le traitement détaillé.
// GET  /me/warnings?unacknowledged=true -> Warning[]
// POST /me/warnings/:id/acknowledge     -> 204

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export const moderationApi = {
  async report({ targetType, targetId, reason, details, context }) {
    if (isMockMode) {
      await delay(300)
      const reporterId = mockSession.getUserId()
      if (!reporterId) throw fail(401, 'Non authentifié.')
      if (!REPORT_REASONS.some((r) => r.id === reason)) throw fail(400, 'Motif de signalement invalide.')
      if (targetType === 'user' && targetId === reporterId) throw fail(400, 'Vous ne pouvez pas vous signaler vous-même.')
      let snapshot = null
      if (targetType === 'message') {
        const message = messagesMock.getMessage(targetId)
        if (!message || message.deletedAt) throw fail(404, 'Ce message n\'existe plus.')
        snapshot = { text: message.text, attachmentTypes: message.attachments.map((a) => a.type), authorId: message.senderId, createdAt: message.createdAt }
      }
      const report = moderationMock.createReport({
        reporterId, targetType, targetId, reason, details: (details || '').trim().slice(0, 500), context, snapshot,
      })
      return { id: report.id }
    }
    return client.post('/reports', { targetType, targetId, reason, details, context })
  },

  async getMyWarnings() {
    if (isMockMode) {
      await delay(150)
      const userId = mockSession.getUserId()
      if (!userId || !usersMock.getById(userId)) return []
      return moderationMock.listUnacknowledged(userId)
    }
    return client.get('/me/warnings', { unacknowledged: true })
  },

  async acknowledgeWarning(id) {
    if (isMockMode) {
      await delay(150)
      const userId = mockSession.getUserId()
      if (userId) moderationMock.acknowledge(userId, id)
      return null
    }
    return client.post(`/me/warnings/${id}/acknowledge`)
  },
}

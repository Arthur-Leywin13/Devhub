// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /conversations, GET /conversations/:id/messages,
// POST /conversations/:id/messages, PATCH|DELETE /conversations/:id/messages/:messageId,
// DELETE /conversations/:id (suppression pour soi uniquement)

let conversations = [
  { id: 'conv1', participantIds: ['u1', 'u2'], updatedAt: '2026-09-18T10:00:00Z', wallpaperUrl: null, clearedAt: {} },
  { id: 'conv2', participantIds: ['u1', 'u3'], updatedAt: '2026-09-15T08:00:00Z', wallpaperUrl: null, clearedAt: {} },
]

let messages = [
  { id: 'm1', conversationId: 'conv1', senderId: 'u2', text: "Salut, j'ai vu ton projet, bravo !", attachments: [], createdAt: '2026-09-18T09:55:00Z', editedAt: null, deletedAt: null, read: true },
  { id: 'm2', conversationId: 'conv1', senderId: 'u1', text: 'Merci beaucoup !', attachments: [], createdAt: '2026-09-18T10:00:00Z', editedAt: null, deletedAt: null, read: true },
  { id: 'm3', conversationId: 'conv2', senderId: 'u3', text: 'On peut en discuter cette semaine ?', attachments: [], createdAt: '2026-09-15T08:00:00Z', editedAt: null, deletedAt: null, read: false },
]

let nextConvId = 3
let nextMsgId = 4

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

// Messages visibles par un utilisateur : ceux postérieurs à sa dernière
// « suppression de la conversation pour moi ».
function visibleMessages(conversationId, userId) {
  const conv = conversations.find((c) => c.id === conversationId)
  const clearedAt = conv?.clearedAt?.[userId] ? new Date(conv.clearedAt[userId]).getTime() : 0
  return messages.filter((m) => m.conversationId === conversationId && new Date(m.createdAt).getTime() > clearedAt)
}

// Un message supprimé ne renvoie jamais son contenu.
const mask = (m) => (m.deletedAt ? { ...m, text: '', attachments: [] } : m)

export const messagesMock = {
  listConversationsFor: (userId) =>
    conversations
      .filter((c) => c.participantIds.includes(userId))
      .filter((c) => !c.clearedAt?.[userId] || visibleMessages(c.id, userId).length > 0)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),

  getConversation: (id) => conversations.find((c) => c.id === id) || null,

  getOrCreateConversation: (userId, otherUserId) => {
    let conv = conversations.find((c) => c.participantIds.includes(userId) && c.participantIds.includes(otherUserId))
    if (!conv) {
      conv = {
        id: `conv${nextConvId++}`,
        participantIds: [userId, otherUserId],
        updatedAt: new Date().toISOString(),
        wallpaperUrl: null,
        clearedAt: {},
      }
      conversations.push(conv)
    }
    return conv
  },

  setWallpaper: (conversationId, wallpaperUrl) => {
    conversations = conversations.map((c) => (c.id === conversationId ? { ...c, wallpaperUrl } : c))
    return conversations.find((c) => c.id === conversationId)
  },

  clearConversationFor: (conversationId, userId) => {
    conversations = conversations.map((c) =>
      c.id === conversationId ? { ...c, clearedAt: { ...c.clearedAt, [userId]: new Date().toISOString() } } : c
    )
  },

  listMessages: (conversationId, userId) => visibleMessages(conversationId, userId).map(mask),

  getMessage: (id) => {
    const m = messages.find((x) => x.id === id)
    return m ? mask(m) : null
  },

  lastMessageFor: (conversationId, userId) => {
    const list = visibleMessages(conversationId, userId)
    return list.length ? mask(list[list.length - 1]) : null
  },

  unreadCountFor: (conversationId, userId) =>
    visibleMessages(conversationId, userId).filter((m) => m.senderId !== userId && !m.read && !m.deletedAt).length,

  sendMessage: (conversationId, senderId, { text, attachments }) => {
    const message = {
      id: `m${nextMsgId++}`,
      conversationId,
      senderId,
      text: text || '',
      attachments: attachments || [],
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      read: false,
    }
    messages.push(message)
    conversations = conversations.map((c) => (c.id === conversationId ? { ...c, updatedAt: message.createdAt } : c))
    return message
  },

  // Modification : auteur uniquement, texte uniquement, jamais sur un message supprimé.
  editMessage: (id, userId, text) => {
    const m = messages.find((x) => x.id === id)
    if (!m) throw fail(404, 'Message introuvable.')
    if (m.senderId !== userId) throw fail(403, 'Vous ne pouvez modifier que vos propres messages.')
    if (m.deletedAt) throw fail(409, 'Ce message a été supprimé.')
    const clean = (text || '').trim()
    if (!clean && m.attachments.length === 0) throw fail(400, 'Le message ne peut pas être vide.')
    if (clean.length > 4000) throw fail(400, 'Message trop long (4000 caractères maximum).')
    messages = messages.map((x) => (x.id === id ? { ...x, text: clean, editedAt: new Date().toISOString() } : x))
    return mask(messages.find((x) => x.id === id))
  },

  // Suppression : auteur uniquement. Le contenu est effacé pour tout le monde.
  deleteMessage: (id, userId) => {
    const m = messages.find((x) => x.id === id)
    if (!m) throw fail(404, 'Message introuvable.')
    if (m.senderId !== userId) throw fail(403, 'Vous ne pouvez supprimer que vos propres messages.')
    messages = messages.map((x) =>
      x.id === id ? { ...x, text: '', attachments: [], deletedAt: new Date().toISOString() } : x
    )
    return mask(messages.find((x) => x.id === id))
  },

  // Utilisé par la modération (retrait de contenu après signalement).
  forceDeleteMessage: (id) => {
    messages = messages.map((x) =>
      x.id === id ? { ...x, text: '', attachments: [], deletedAt: new Date().toISOString() } : x
    )
  },

  markRead: (conversationId, userId) => {
    messages = messages.map((m) =>
      m.conversationId === conversationId && m.senderId !== userId ? { ...m, read: true } : m
    )
  },
}

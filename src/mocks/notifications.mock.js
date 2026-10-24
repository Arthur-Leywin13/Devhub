// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /notifications, POST /notifications/:id/read
// Types de modération ('warning', 'suspension', 'restore') : actorId = null
// (l'identité du modérateur n'est jamais montrée à l'utilisateur sanctionné).

let notifications = [
  { id: 'n1', userId: 'u1', type: 'like', actorId: 'u2', targetLabel: 'votre projet', read: false, createdAt: '2026-09-19T09:00:00Z' },
  { id: 'n2', userId: 'u1', type: 'comment', actorId: 'u3', targetLabel: 'votre article', read: false, createdAt: '2026-09-19T07:00:00Z' },
  { id: 'n3', userId: 'u1', type: 'follow', actorId: 'u4', targetLabel: null, read: false, createdAt: '2026-09-18T18:00:00Z' },
  { id: 'n4', userId: 'u1', type: 'mention', actorId: 'u3', targetLabel: null, read: true, createdAt: '2026-09-17T00:00:00Z' },
  { id: 'n5', userId: 'u1', type: 'like', actorId: 'u4', targetLabel: 'votre article', read: true, createdAt: '2026-09-15T00:00:00Z' },
]
let nextId = 6

export const notificationsMock = {
  listFor: (userId) =>
    notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  add: ({ userId, type, actorId = null, targetLabel = null }) => {
    const notification = {
      id: `n${nextId++}`, userId, type, actorId, targetLabel, read: false, createdAt: new Date().toISOString(),
    }
    notifications = [notification, ...notifications]
    return notification
  },
  markAsRead: (id) => {
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  },
  markAllAsRead: (userId) => {
    notifications = notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n))
  },
}

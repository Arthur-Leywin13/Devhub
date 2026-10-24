// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /saved, DELETE /saved/:id,
// POST|DELETE /projects/:id/save, /articles/:id/save, /posts/:id/save

let saved = [
  { id: 'sv1', userId: 'u1', targetType: 'project', targetId: 'p2', createdAt: '2026-09-10T00:00:00Z' },
  { id: 'sv2', userId: 'u1', targetType: 'article', targetId: 'a2', createdAt: '2026-09-11T00:00:00Z' },
]
let nextId = 3

const same = (s, userId, targetType, targetId) =>
  s.userId === userId && s.targetType === targetType && s.targetId === targetId

export const savedMock = {
  listFor: (userId) => saved.filter((s) => s.userId === userId),
  has: (userId, targetType, targetId) => saved.some((s) => same(s, userId, targetType, targetId)),
  add: (userId, targetType, targetId) => {
    const existing = saved.find((s) => same(s, userId, targetType, targetId))
    if (existing) return existing
    const entry = { id: `sv${nextId++}`, userId, targetType, targetId, createdAt: new Date().toISOString() }
    saved = [...saved, entry]
    return entry
  },
  removeByTarget: (userId, targetType, targetId) => {
    saved = saved.filter((s) => !same(s, userId, targetType, targetId))
  },
  remove: (id) => {
    saved = saved.filter((s) => s.id !== id)
  },
}

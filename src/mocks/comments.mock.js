// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /projects/:id/comments, POST .../comments, DELETE /comments/:id

let comments = [
  { id: 'cm1', targetType: 'project', targetId: 'p2', authorId: 'u2', text: "Commentaire d'exemple : la latence est vraiment impressionnante.", createdAt: '2026-09-10T00:00:00Z' },
  { id: 'cm2', targetType: 'project', targetId: 'p2', authorId: 'u3', text: "Commentaire d'exemple : un mode vocal est-il prévu ?", createdAt: '2026-09-11T00:00:00Z' },
  { id: 'cm3', targetType: 'article', targetId: 'a1', authorId: 'u4', text: "Commentaire d'exemple : article très clair, merci.", createdAt: '2026-08-21T00:00:00Z' },
]

let nextId = 4

export const commentsMock = {
  listFor: (targetType, targetId) => comments.filter((c) => c.targetType === targetType && c.targetId === targetId),
  add: (targetType, targetId, authorId, text) => {
    const comment = { id: `cm${nextId++}`, targetType, targetId, authorId, text, createdAt: new Date().toISOString() }
    comments = [...comments, comment]
    return comment
  },
  remove: (id) => {
    comments = comments.filter((c) => c.id !== id)
  },
  listAll: () => comments,
  getById: (id) => comments.find((c) => c.id === id) || null,
}

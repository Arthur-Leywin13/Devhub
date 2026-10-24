// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /stickers, POST /stickers
// authorId: null = sticker fourni par la plateforme (disponible pour tous).
// authorId: <id> = sticker créé par un utilisateur (visible par tous, comme
// un petit sticker pack personnel).

let stickers = [
  { id: 'st1', authorId: null, type: 'emoji', content: '🔥', name: 'Feu', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'st2', authorId: null, type: 'emoji', content: '🚀', name: 'Fusée', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'st3', authorId: null, type: 'emoji', content: '🎉', name: 'Fête', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'st4', authorId: null, type: 'emoji', content: '💻', name: 'Code', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'st5', authorId: null, type: 'emoji', content: '👏', name: 'Bravo', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'st6', authorId: null, type: 'emoji', content: '😂', name: 'Rire', createdAt: '2026-01-01T00:00:00Z' },
]

let nextId = 7

export const stickersMock = {
  // Stickers de la plateforme + stickers créés par l'utilisateur connecté
  // (un vrai backend pourrait plus tard inclure ceux des gens qu'on suit).
  listAvailableFor: (userId) => stickers.filter((s) => s.authorId === null || s.authorId === userId),

  create: (authorId, { type, content, name }) => {
    const sticker = { id: `st${nextId++}`, authorId, type, content, name, createdAt: new Date().toISOString() }
    stickers.push(sticker)
    return sticker
  },

  remove: (id, authorId) => {
    stickers = stickers.filter((s) => !(s.id === id && s.authorId === authorId))
  },
}

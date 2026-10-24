// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /feed, GET /posts/:id, POST /posts,
// POST|DELETE /posts/:id/like, POST|DELETE /posts/:id/save
//
// Un post peut contenir : texte, UNE image OU UNE vidéo (media), un lien
// (aperçu rempli côté serveur), un projet lié, un article lié.

let posts = [
  {
    id: 'f1',
    authorId: 'u4',
    content:
      "Publication d'exemple : fine-tuning d'un petit modèle de classification terminé, précision correcte sur le jeu de test.",
    image: null,
    video: null,
    link: null,
    linkedProjectId: null,
    linkedArticleId: null,
    likesCount: 0,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 0,
    createdAt: '2026-09-17T10:00:00Z',
  },
  {
    id: 'f2',
    authorId: 'u3',
    content: "Publication d'exemple : migration de la base de données terminée, temps de requête réduits.",
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
    video: null,
    link: null,
    linkedProjectId: null,
    linkedArticleId: null,
    likesCount: 0,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 0,
    createdAt: '2026-09-17T06:00:00Z',
  },
  {
    id: 'f3',
    authorId: 'u2',
    content: "Publication d'exemple : nouvel article publié, lien en commentaire.",
    image: null,
    video: null,
    link: null,
    linkedProjectId: null,
    linkedArticleId: 'a2',
    likesCount: 0,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 0,
    createdAt: '2026-09-16T12:00:00Z',
  },
  {
    id: 'f4',
    authorId: 'u1',
    content: "Publication d'exemple : nouvelle version d'un projet publiée, retours bienvenus.",
    image: null,
    video: null,
    link: null,
    linkedProjectId: 'p1',
    linkedArticleId: null,
    likesCount: 0,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 0,
    createdAt: '2026-09-16T08:00:00Z',
  },
  {
    id: 'f5',
    authorId: 'u4',
    content: "Publication d'exemple avec un lien : la documentation de référence est ici https://example.com/docs",
    image: null,
    video: null,
    link: { url: 'https://example.com/docs', title: 'Documentation d\'exemple', description: 'Aperçu généré côté serveur à partir du lien.', imageUrl: null },
    linkedProjectId: null,
    linkedArticleId: null,
    likesCount: 0,
    likedByCurrentUser: false,
    savedByCurrentUser: false,
    commentsCount: 0,
    createdAt: '2026-09-15T09:00:00Z',
  },
]

let nextId = 6

export const postsMock = {
  list: (params = {}) => {
    let result = [...posts]
    if (params.authorId) result = result.filter((p) => p.authorId === params.authorId)
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return result
  },
  getById: (id) => posts.find((p) => p.id === id) || null,
  create: (data) => {
    const post = {
      id: `f${nextId++}`,
      image: null,
      video: null,
      link: null,
      linkedProjectId: null,
      linkedArticleId: null,
      likesCount: 0,
      likedByCurrentUser: false,
      savedByCurrentUser: false,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      ...data,
    }
    posts = [post, ...posts]
    return post
  },
  update: (id, patch) => {
    posts = posts.map((p) => (p.id === id ? { ...p, ...patch } : p))
    return posts.find((p) => p.id === id)
  },
  like: (id) => {
    posts = posts.map((p) => (p.id === id ? { ...p, likesCount: p.likesCount + 1, likedByCurrentUser: true } : p))
    return posts.find((p) => p.id === id)
  },
  unlike: (id) => {
    posts = posts.map((p) =>
      p.id === id ? { ...p, likesCount: Math.max(0, p.likesCount - 1), likedByCurrentUser: false } : p
    )
    return posts.find((p) => p.id === id)
  },
  save: (id) => {
    posts = posts.map((p) => (p.id === id ? { ...p, savedByCurrentUser: true } : p))
    return posts.find((p) => p.id === id)
  },
  unsave: (id) => {
    posts = posts.map((p) => (p.id === id ? { ...p, savedByCurrentUser: false } : p))
    return posts.find((p) => p.id === id)
  },
  remove: (id) => {
    posts = posts.filter((p) => p.id !== id)
  },
}

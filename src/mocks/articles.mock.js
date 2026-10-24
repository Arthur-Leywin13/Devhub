// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /articles, GET /articles/:id, POST /articles

let articles = [
  {
    id: 'a1',
    slug: 'article-exemple-userbot-telegram',
    title: 'Article exemple — Construire un bot Telegram robuste',
    excerpt: "Architecture, gestion de session et bonnes pratiques pour un bot stable en production.",
    content:
      "Ceci est un contenu d'exemple généré pour tester l'interface d'article : structuration des handlers de commandes, gestion de la reconnexion et des limites de débit.",
    category: 'Programmation',
    authorId: 'u1',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    readTime: 8,
    likesCount: 0,
    likedByCurrentUser: false,
    commentsCount: 1,
    createdAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'a2',
    slug: 'article-exemple-api-langage-latence',
    title: 'Article exemple — Réduire la latence des API de langage',
    excerpt: "Pourquoi la latence d'inférence change la donne pour les apps IA temps réel.",
    content:
      "Contenu d'exemple : comment structurer les appels API, gérer le streaming de tokens côté frontend, et concevoir une interface réactive.",
    category: 'IA',
    authorId: 'u4',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    readTime: 6,
    likesCount: 0,
    likedByCurrentUser: false,
    commentsCount: 0,
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'a3',
    slug: 'article-exemple-vpn-local-dns',
    title: 'Article exemple — VPN local et filtrage DNS',
    excerpt: "Comment fonctionne un blocage publicitaire système entier sans root.",
    content:
      "Contenu d'exemple sur l'interception du trafic via un VpnService local combiné à une liste de domaines et un mode furtif.",
    category: 'Mobile',
    authorId: 'u3',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    readTime: 5,
    likesCount: 0,
    likedByCurrentUser: false,
    commentsCount: 0,
    createdAt: '2026-07-30T00:00:00Z',
  },
]

let nextId = 4

export const articlesMock = {
  list: (params = {}) => {
    let result = [...articles]
    if (params.authorId) result = result.filter((a) => a.authorId === params.authorId)
    if (params.category) result = result.filter((a) => a.category === params.category)
    if (params.q) result = result.filter((a) => a.title.toLowerCase().includes(params.q.toLowerCase()))
    return result
  },
  getById: (id) => articles.find((a) => a.id === id || a.slug === id) || null,
  update: (id, patch) => {
    articles = articles.map((a) => (a.id === id ? { ...a, ...patch } : a))
    return articles.find((a) => a.id === id)
  },
  create: (data) => {
    const article = {
      id: `a${nextId++}`,
      slug: (data.title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      likesCount: 0,
      likedByCurrentUser: false,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      ...data,
    }
    articles = [article, ...articles]
    return article
  },
  like: (id) => {
    articles = articles.map((a) =>
      a.id === id ? { ...a, likesCount: a.likesCount + 1, likedByCurrentUser: true } : a
    )
    return articles.find((a) => a.id === id)
  },
  unlike: (id) => {
    articles = articles.map((a) =>
      a.id === id ? { ...a, likesCount: Math.max(0, a.likesCount - 1), likedByCurrentUser: false } : a
    )
    return articles.find((a) => a.id === id)
  },
  remove: (id) => {
    articles = articles.filter((a) => a.id !== id)
  },
}

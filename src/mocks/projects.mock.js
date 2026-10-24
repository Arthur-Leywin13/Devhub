// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /projects, GET /projects/:id, POST /projects, POST/DELETE /projects/:id/like

let projects = [
  {
    id: 'p1',
    slug: 'projet-exemple-gestion-taches',
    name: 'Projet exemple — Gestionnaire de tâches',
    description: 'Application de gestion de tâches avec tableaux et rappels.',
    longDescription:
      "Ce projet est un exemple généré pour tester l'interface : gestion de tâches en tableaux façon Kanban, avec rappels et synchronisation entre membres d'une équipe.",
    image: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?w=800&q=80',
    authorId: 'u1',
    tech: ['node', 'postgres'],
    likesCount: 0,
    likedByCurrentUser: false,
    commentsCount: 2,
    stars: 12,
    category: 'Productivité',
    github: 'https://github.com/example/task-manager',
    demo: null,
    licence: 'MIT',
    allowDownload: true,
    createdAt: '2026-04-11T00:00:00Z',
  },
  {
    id: 'p2',
    slug: 'projet-exemple-assistant-ia',
    name: 'Projet exemple — Assistant IA',
    description: 'Application conversationnelle propulsée par une API de langage.',
    longDescription:
      "Interface de conversation minimaliste connectée à une API de langage, avec historique persistant et réponses en streaming.",
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    authorId: 'u2',
    tech: ['react', 'node'],
    likesCount: 0,
    likedByCurrentUser: false,
    commentsCount: 1,
    stars: 34,
    category: 'IA',
    github: 'https://github.com/example/ai-assistant',
    demo: 'https://example.dev',
    licence: 'Apache 2.0',
    allowDownload: true,
    createdAt: '2026-07-14T00:00:00Z',
  },
  {
    id: 'p3',
    slug: 'projet-exemple-bloqueur-pub',
    name: 'Projet exemple — Bloqueur de publicités',
    description: 'Blocage publicitaire système via VPN local et filtrage DNS.',
    longDescription:
      "Exemple d'application mobile qui intercepte les requêtes publicitaires à l'échelle du système via un VPN local combiné à un filtrage DNS.",
    image: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&q=80',
    authorId: 'u3',
    tech: ['py'],
    likesCount: 0,
    likedByCurrentUser: false,
    commentsCount: 0,
    stars: 8,
    category: 'Mobile',
    github: 'https://github.com/example/ad-blocker',
    demo: null,
    licence: 'GPL v3',
    allowDownload: false,
    createdAt: '2026-05-20T00:00:00Z',
  },
  {
    id: 'p4',
    slug: 'projet-exemple-app-meteo',
    name: 'Projet exemple — Application météo',
    description: 'Prévisions météo temps réel avec animations par condition.',
    longDescription:
      "Application météo légère affichant les prévisions sur 7 jours avec des animations propres à chaque condition climatique.",
    image: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=800&q=80',
    authorId: 'u4',
    tech: ['react', 'ts'],
    likesCount: 0,
    likedByCurrentUser: false,
    commentsCount: 0,
    stars: 5,
    category: 'Web',
    github: 'https://github.com/example/weather-app',
    demo: 'https://example.dev/weather',
    licence: 'MIT',
    allowDownload: true,
    createdAt: '2026-08-01T00:00:00Z',
  },
]

let nextId = 5

export const projectsMock = {
  list: (params = {}) => {
    let result = [...projects]
    if (params.authorId) result = result.filter((p) => p.authorId === params.authorId)
    if (params.category) result = result.filter((p) => p.category === params.category)
    if (params.q) result = result.filter((p) => p.name.toLowerCase().includes(params.q.toLowerCase()))
    if (params.sort === 'recent') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (params.sort === 'popular') result.sort((a, b) => b.likesCount - a.likesCount)
    return result
  },
  getById: (id) => projects.find((p) => p.id === id || p.slug === id) || null,
  create: (data) => {
    const project = {
      id: `p${nextId++}`,
      slug: (data.name || 'projet').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      likesCount: 0,
      likedByCurrentUser: false,
      commentsCount: 0,
      stars: 0,
      createdAt: new Date().toISOString(),
      ...data,
    }
    projects = [project, ...projects]
    return project
  },
  update: (id, patch) => {
    projects = projects.map((p) => (p.id === id ? { ...p, ...patch } : p))
    return projects.find((p) => p.id === id)
  },
  remove: (id) => {
    projects = projects.filter((p) => p.id !== id)
  },
  like: (id) => {
    projects = projects.map((p) =>
      p.id === id ? { ...p, likesCount: p.likesCount + 1, likedByCurrentUser: true } : p
    )
    return projects.find((p) => p.id === id)
  },
  unlike: (id) => {
    projects = projects.map((p) =>
      p.id === id ? { ...p, likesCount: Math.max(0, p.likesCount - 1), likedByCurrentUser: false } : p
    )
    return projects.find((p) => p.id === id)
  },
}

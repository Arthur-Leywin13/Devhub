// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /users/:username, GET /admin/users...
//
// Comptes de test (la connexion mock accepte n'importe quel mot de passe) :
//   utilisateur1 = administrateur · utilisateur3 = modérateur
//   utilisateur2 / utilisateur4 = créateurs
// status : 'active' | 'suspended' | 'banned'

let users = [
  {
    id: 'u1', username: 'utilisateur1', name: 'Utilisateur Un',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    bio: "Administrateur — exemple de profil généré pour les tests d'interface.",
    role: 'admin', status: 'active', statusReason: null, suspendedUntil: null,
    followersCount: 128, followingCount: 42, createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'u2', username: 'utilisateur2', name: 'Utilisateur Deux',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    bio: 'Créatrice de contenu technique — exemple de profil.',
    role: 'creator', status: 'active', statusReason: null, suspendedUntil: null,
    followersCount: 342, followingCount: 87, createdAt: '2026-02-03T00:00:00Z',
  },
  {
    id: 'u3', username: 'utilisateur3', name: 'Utilisateur Trois',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    bio: "Modérateur — passionné d'infrastructure et de bases de données.",
    role: 'moderator', status: 'active', statusReason: null, suspendedUntil: null,
    followersCount: 76, followingCount: 19, createdAt: '2026-03-21T00:00:00Z',
  },
  {
    id: 'u4', username: 'utilisateur4', name: 'Utilisateur Quatre',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    bio: "Explore l'intelligence artificielle appliquée.",
    role: 'creator', status: 'active', statusReason: null, suspendedUntil: null,
    followersCount: 510, followingCount: 63, createdAt: '2026-04-14T00:00:00Z',
  },
]

let follows = [{ followerId: 'u1', followingId: 'u2' }]

// Une suspension arrivée à échéance est levée automatiquement
// (le backend réel doit faire de même, à la lecture ou par tâche planifiée).
function expireSuspensions() {
  const now = Date.now()
  users = users.map((u) =>
    u.status === 'suspended' && u.suspendedUntil && new Date(u.suspendedUntil).getTime() <= now
      ? { ...u, status: 'active', statusReason: null, suspendedUntil: null }
      : u
  )
}

export const usersMock = {
  list: () => {
    expireSuspensions()
    return users
  },
  add: (user) => {
    users = [...users, user]
    return user
  },
  getById: (id) => {
    expireSuspensions()
    return users.find((u) => u.id === id) || null
  },
  getByUsername: (username) => {
    expireSuspensions()
    return users.find((u) => u.username === username) || null
  },
  update: (id, patch) => {
    users = users.map((u) => (u.id === id ? { ...u, ...patch } : u))
    return users.find((u) => u.id === id)
  },
  isFollowing: (followerId, followingId) =>
    follows.some((f) => f.followerId === followerId && f.followingId === followingId),
  listFollowing: (followerId) => {
    expireSuspensions()
    return follows
      .filter((f) => f.followerId === followerId)
      .map((f) => users.find((u) => u.id === f.followingId))
      .filter((u) => u && u.status === 'active')
  },
  follow: (followerId, followingId) => {
    if (!follows.some((f) => f.followerId === followerId && f.followingId === followingId)) {
      follows.push({ followerId, followingId })
      users = users.map((u) => (u.id === followingId ? { ...u, followersCount: u.followersCount + 1 } : u))
    }
  },
  unfollow: (followerId, followingId) => {
    follows = follows.filter((f) => !(f.followerId === followerId && f.followingId === followingId))
    users = users.map((u) => (u.id === followingId ? { ...u, followersCount: Math.max(0, u.followersCount - 1) } : u))
  },
}

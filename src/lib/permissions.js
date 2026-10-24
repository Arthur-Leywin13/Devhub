// Règles d'autorisation de l'espace d'administration. Ces règles servent
// UNIQUEMENT à afficher/masquer des boutons : le backend DOIT les appliquer
// lui-même sur chaque requête (cacher un bouton n'est pas une protection).

export const ROLE_RANK = { user: 0, creator: 1, moderator: 2, admin: 3 }
export const ROLE_LABELS = { user: 'Utilisateur', creator: 'Créateur', moderator: 'Modérateur', admin: 'Administrateur' }

export const isStaff = (user) => !!user && (user.role === 'moderator' || user.role === 'admin')
export const isAdmin = (user) => !!user && user.role === 'admin'

// On ne sanctionne jamais soi-même, ni un compte de rang égal ou supérieur.
export function canSanction(actor, target) {
  return isStaff(actor) && !!target && actor.id !== target.id && ROLE_RANK[actor.role] > ROLE_RANK[target.role]
}

// Bannir : administrateurs uniquement.
export const canBan = (actor, target) => isAdmin(actor) && canSanction(actor, target)

// Rétablir : un bannissement ne peut être levé que par un administrateur.
export function canRestore(actor, target) {
  if (!canSanction(actor, target)) return false
  return target.status === 'banned' ? isAdmin(actor) : true
}

// Changer un rôle : administrateurs uniquement, jamais le sien (évite de se retirer l'accès).
export const canChangeRole = (actor, target) => isAdmin(actor) && !!target && actor.id !== target.id

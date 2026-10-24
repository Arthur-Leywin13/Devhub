import { usersApi } from '../api/users'

// Cache mémoire par utilisateur, pour éviter un appel réseau par carte
// affichée (ProjectCard, ArticleCard, PostCard...) quand plusieurs cartes
// partagent le même auteur.
const cache = new Map()

export function getUserCached(id) {
  if (!id) return Promise.resolve(null)
  if (!cache.has(id)) cache.set(id, usersApi.getById(id))
  return cache.get(id)
}

// À appeler après toute modification du profil (Paramètres) pour que les
// cartes déjà montées à l'écran (auteur d'un projet, d'un commentaire...)
// affichent le nom/avatar à jour au prochain rendu.
export function invalidateUserCache(id) {
  cache.delete(id)
}

import { technologiesApi } from '../api/technologies'

// Petit cache mémoire pour éviter de refaire un appel réseau à chaque
// badge affiché. À la première page qui en a besoin, le résultat est
// mis en cache pour le reste de la session.
let cachedPromise = null

export function getTechnologiesCached() {
  if (!cachedPromise) cachedPromise = technologiesApi.getAll()
  return cachedPromise
}

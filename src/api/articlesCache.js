import { articlesApi } from '../api/articles'

const cache = new Map()

export function getArticleCached(id) {
  if (!id) return Promise.resolve(null)
  if (!cache.has(id)) cache.set(id, articlesApi.getById(id).catch(() => null))
  return cache.get(id)
}

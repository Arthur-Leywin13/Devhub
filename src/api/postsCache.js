import { postsApi } from '../api/posts'

const cache = new Map()

export function getPostCached(id) {
  if (!id) return Promise.resolve(null)
  if (!cache.has(id)) cache.set(id, postsApi.getById(id).catch(() => null))
  return cache.get(id)
}

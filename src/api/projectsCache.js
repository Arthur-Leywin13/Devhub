import { projectsApi } from '../api/projects'

const cache = new Map()

export function getProjectCached(id) {
  if (!id) return Promise.resolve(null)
  if (!cache.has(id)) cache.set(id, projectsApi.getById(id).catch(() => null))
  return cache.get(id)
}

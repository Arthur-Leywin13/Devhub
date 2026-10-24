import { useAsync } from './useAsync'
import { projectsApi } from '../api/projects'

export function useProjects(params = {}) {
  return useAsync(() => projectsApi.getAll(params), [JSON.stringify(params)])
}

export function useProject(id) {
  return useAsync(() => projectsApi.getById(id), [id])
}

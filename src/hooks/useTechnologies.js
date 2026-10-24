import { useAsync } from './useAsync'
import { technologiesApi } from '../api/technologies'

export function useTechnologies() {
  return useAsync(() => technologiesApi.getAll(), [])
}

export function useCategories() {
  return useAsync(() => technologiesApi.getCategories(), [])
}

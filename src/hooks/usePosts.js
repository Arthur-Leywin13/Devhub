import { useAsync } from './useAsync'
import { postsApi } from '../api/posts'

export function useFeed(params = {}) {
  return useAsync(() => postsApi.getFeed(params), [JSON.stringify(params)])
}

export function useSaved() {
  return useAsync(() => postsApi.getSaved(), [])
}

export function usePost(id) {
  return useAsync(() => postsApi.getById(id), [id])
}

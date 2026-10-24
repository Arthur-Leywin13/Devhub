import { useAsync } from './useAsync'
import { articlesApi } from '../api/articles'

export function useArticles(params = {}) {
  return useAsync(() => articlesApi.getAll(params), [JSON.stringify(params)])
}

export function useArticle(id) {
  return useAsync(() => articlesApi.getById(id), [id])
}

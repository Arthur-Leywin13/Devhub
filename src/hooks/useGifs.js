import { useAsync } from './useAsync'
import { gifsApi } from '../api/gifs'

export function useGifs() {
  return useAsync(() => gifsApi.getAll(), [])
}

import { useAsync } from './useAsync'
import { stickersApi } from '../api/stickers'

export function useStickers() {
  return useAsync(() => stickersApi.getAll(), [])
}

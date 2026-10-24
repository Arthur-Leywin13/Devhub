import { useAsync } from './useAsync'
import { notificationsApi } from '../api/notifications'

export function useNotifications() {
  return useAsync(() => notificationsApi.getAll(), [])
}

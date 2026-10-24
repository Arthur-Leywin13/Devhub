import { useAsync } from './useAsync'
import { usersApi } from '../api/users'

export function useUserProfile(username) {
  return useAsync(() => (username ? usersApi.getByUsername(username) : Promise.resolve(null)), [username])
}

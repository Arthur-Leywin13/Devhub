import { usersMock } from '../mocks/users.mock'

// Session simulée côté client, utilisée uniquement en mode mock (voir ./mode.js).
// En mode live, la session réelle sera gérée par le backend (cookies / JWT).

const STORAGE_KEY = 'devhub_mock_session_user_id'

export function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const mockSession = {
  getUserId: () => localStorage.getItem(STORAGE_KEY),
  setUserId: (id) => localStorage.setItem(STORAGE_KEY, id),
  clear: () => localStorage.removeItem(STORAGE_KEY),
}

// Un compte suspendu ou banni est en lecture seule. Le backend réel doit
// appliquer cette règle sur TOUTES les écritures (HTTP 403 + message).
export function assertCanWrite() {
  const id = mockSession.getUserId()
  if (!id) return
  const user = usersMock.getById(id)
  if (!user || user.status === 'active') return
  const reason = user.statusReason || 'non précisé'
  const error = new Error(
    user.status === 'banned'
      ? `Votre compte a été banni. Motif : ${reason}.`
      : `Votre compte est suspendu jusqu'au ${new Date(user.suspendedUntil).toLocaleDateString('fr-FR')}. Motif : ${reason}.`
  )
  error.status = 403
  throw error
}

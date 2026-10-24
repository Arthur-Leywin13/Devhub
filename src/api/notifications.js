import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession } from './mockSession'
import { notificationsMock } from '../mocks/notifications.mock'

// Contrat attendu :
// GET  /notifications
// POST /notifications/:id/read
// POST /notifications/read-all

export const notificationsApi = {
  async getAll() {
    if (isMockMode) {
      await delay()
      const userId = mockSession.getUserId()
      if (!userId) return []
      return notificationsMock.listFor(userId)
    }
    return client.get('/notifications')
  },

  async markAsRead(id) {
    if (isMockMode) {
      await delay(100)
      return notificationsMock.markAsRead(id)
    }
    return client.post(`/notifications/${id}/read`)
  },

  async markAllAsRead() {
    if (isMockMode) {
      await delay(150)
      const userId = mockSession.getUserId()
      if (userId) notificationsMock.markAllAsRead(userId)
      return null
    }
    return client.post('/notifications/read-all')
  },
}

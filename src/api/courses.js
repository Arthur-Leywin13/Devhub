import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession, assertCanWrite } from './mockSession'
import { coursesMock } from '../mocks/courses.mock'

// Contrat attendu :
// GET  /courses?category=&q=
// GET  /courses/:id
// GET  /courses/:id/progress
// POST /courses
// POST /courses/:id/sections
// POST /courses/:id/lessons
// POST /courses/:courseId/lessons/:lessonId/complete

export const coursesApi = {
  async getAll(params = {}) {
    if (isMockMode) {
      await delay()
      return coursesMock.list(params)
    }
    return client.get('/courses', params)
  },

  async getById(id) {
    if (isMockMode) {
      await delay()
      const course = coursesMock.getById(id)
      if (!course) {
        const error = new Error('Cours introuvable.')
        error.status = 404
        throw error
      }
      return course
    }
    return client.get(`/courses/${id}`)
  },

  async getLesson(courseId, lessonId) {
    if (isMockMode) {
      await delay()
      const lesson = coursesMock.getLesson(courseId, lessonId)
      if (!lesson) {
        const error = new Error('Leçon introuvable.')
        error.status = 404
        throw error
      }
      return lesson
    }
    return client.get(`/courses/${courseId}/lessons/${lessonId}`)
  },

  async getProgress(courseId) {
    if (isMockMode) {
      await delay(150)
      const userId = mockSession.getUserId()
      if (!userId) return { completedLessonIds: [], totalLessons: 0, percent: 0 }
      return coursesMock.getProgress(userId, courseId)
    }
    return client.get(`/courses/${courseId}/progress`)
  },

  async completeLesson(courseId, lessonId) {
    if (isMockMode) {
      assertCanWrite()
      await delay(200)
      const userId = mockSession.getUserId()
      if (!userId) throw new Error('Non authentifié.')
      return coursesMock.completeLesson(userId, courseId, lessonId)
    }
    return client.post(`/courses/${courseId}/lessons/${lessonId}/complete`)
  },

  async create(data) {
    if (isMockMode) {
      assertCanWrite()
      await delay(500)
      return coursesMock.create(data)
    }
    return client.post('/courses', data)
  },

  async addSection(courseId, title) {
    if (isMockMode) {
      assertCanWrite()
      await delay(300)
      return coursesMock.addSection(courseId, title)
    }
    return client.post(`/courses/${courseId}/sections`, { title })
  },

  async addLesson(courseId, sectionId, lessonData) {
    if (isMockMode) {
      assertCanWrite()
      await delay(300)
      return coursesMock.addLesson(courseId, sectionId, lessonData)
    }
    return client.post(`/courses/${courseId}/lessons`, { sectionId, ...lessonData })
  },
}

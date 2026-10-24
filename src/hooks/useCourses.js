import { useAsync } from './useAsync'
import { coursesApi } from '../api/courses'

export function useCourses(params = {}) {
  return useAsync(() => coursesApi.getAll(params), [JSON.stringify(params)])
}

export function useCourse(id) {
  return useAsync(() => coursesApi.getById(id), [id])
}

export function useLesson(courseId, lessonId) {
  return useAsync(() => coursesApi.getLesson(courseId, lessonId), [courseId, lessonId])
}

export function useCourseProgress(courseId) {
  return useAsync(() => coursesApi.getProgress(courseId), [courseId])
}

import { client } from './client'
import { isMockMode } from './mode'
import { delay } from './mockSession'
import { projectsMock } from '../mocks/projects.mock'
import { articlesMock } from '../mocks/articles.mock'
import { usersMock } from '../mocks/users.mock'
import { technologiesMock } from '../mocks/technologies.mock'
import { coursesMock } from '../mocks/courses.mock'

// Contrat attendu :
// GET /search?q=&type=

export const searchApi = {
  async search(query, filters = {}) {
    if (isMockMode) {
      await delay(250)
      const q = (query || '').toLowerCase()
      return {
        projects: projectsMock.list({ category: filters.category }).filter((p) => p.name.toLowerCase().includes(q)),
        articles: articlesMock.list({}).filter((a) => a.title.toLowerCase().includes(q)),
        users: usersMock.list().filter((u) => u.status !== 'banned' && (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))),
        technologies: technologiesMock.filter((t) => t.name.toLowerCase().includes(q)),
        courses: coursesMock.list({}).filter((c) => c.title.toLowerCase().includes(q)),
      }
    }
    return client.get('/search', { q: query, ...filters })
  },
}

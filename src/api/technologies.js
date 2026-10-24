import { client } from './client'
import { isMockMode } from './mode'
import { delay } from './mockSession'
import { technologiesMock } from '../mocks/technologies.mock'
import { categoriesMock } from '../mocks/categories.mock'

// Contrat attendu :
// GET /technologies
// GET /technologies/:slug

export const technologiesApi = {
  async getAll() {
    if (isMockMode) {
      await delay(150)
      return technologiesMock
    }
    return client.get('/technologies')
  },

  async getCategories() {
    if (isMockMode) {
      await delay(150)
      return categoriesMock
    }
    return client.get('/categories')
  },
}

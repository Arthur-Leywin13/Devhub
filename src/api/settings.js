import { client } from './client'

export const settingsApi = {
  get: () => client.get('/settings/me'),
  update: (patch) => client.patch('/settings/me', patch),
}

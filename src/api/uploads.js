import { client } from './client'
import { isMockMode } from './mode'
import { delay } from './mockSession'

// Contrat attendu :
// POST /uploads  (multipart/form-data : champs "file" et "purpose")
//   -> 201 { id, url, mimeType, sizeBytes, name }
// purpose : 'avatar' | 'project-image' | 'project-video' | 'project-file' |
//           'post-media' | 'chat-attachment' | 'sticker' | 'gif' | 'wallpaper' |
//           'lesson-video' | 'generic'
//
// En mode mock, on renvoie une URL locale (object URL) : elle fonctionne
// pendant la session mais disparaît au rechargement de la page.

export const uploadsApi = {
  async upload(file, purpose = 'generic') {
    if (isMockMode) {
      await delay(250)
      return {
        id: `up${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        url: URL.createObjectURL(file),
        mimeType: file.type,
        sizeBytes: file.size,
        name: file.name,
      }
    }
    const form = new FormData()
    form.append('file', file)
    form.append('purpose', purpose)
    return client.upload('/uploads', form)
  },
}

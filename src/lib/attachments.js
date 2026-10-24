import { uploadsApi } from '../api/uploads'

// Limites côté client (garde-fou UX). Le backend DOIT appliquer les mêmes
// limites (voir BACKEND.md, section Uploads) : ne jamais se fier au frontend.
export const MEDIA_LIMITS = {
  image: 10 * 1024 * 1024,
  gif: 15 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  file: 100 * 1024 * 1024,
}

const LABELS = { image: 'image', gif: 'GIF', audio: 'audio', video: 'vidéo' }

export function detectType(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  return null
}

// Renvoie un message d'erreur lisible, ou null si le fichier est valide.
export function validateFile(file, allowed = ['image', 'audio', 'video']) {
  const type = detectType(file)
  if (!type || !allowed.includes(type)) {
    return `Format non pris en charge : ${file.name}.`
  }
  const key = file.type === 'image/gif' ? 'gif' : type
  if (file.size > MEDIA_LIMITS[key]) {
    const mb = Math.round(MEDIA_LIMITS[key] / 1024 / 1024)
    return `${file.name} est trop volumineux (maximum ${mb} Mo pour ${LABELS[key]}).`
  }
  return null
}

// Envoie le fichier via la couche API (mock : URL locale, live : POST /uploads)
// puis renvoie la pièce jointe { type, url, name } prête à être enregistrée.
export async function uploadAttachment(file, purpose = 'generic') {
  const type = detectType(file)
  if (!type) return null
  const uploaded = await uploadsApi.upload(file, purpose)
  return { type, url: uploaded.url, name: uploaded.name || file.name }
}

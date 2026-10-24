// Client HTTP central. Utilisé uniquement lorsque VITE_API_URL est défini
// (voir mode dans ./mode.js). Aucune page ni composant ne doit importer
// "fetch" directement — tout passe par ce client, via les modules du dossier api/.

const API_URL = import.meta.env.VITE_API_URL || ''

function toQueryString(params) {
  if (!params || Object.keys(params).length === 0) return ''
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function request(path, options = {}) {
  const { headers, ...rest } = options
  // Pour un upload (FormData), le navigateur doit définir lui-même le
  // Content-Type (avec la frontière multipart) : on ne l'impose donc pas.
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
  })

  if (!res.ok) {
    let message = `Erreur API (${res.status})`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // réponse non-JSON, on garde le message par défaut
    }
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  if (res.status === 204) return null
  return res.json()
}

export const client = {
  get: (path, params) => request(`${path}${toQueryString(params)}`),
  post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData }),
}

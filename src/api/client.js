// Client HTTP central. Toutes les requêtes passent par ce module.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://devhub-4u58.onrender.com' : '')

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
      // Réponse non-JSON : conserver le message HTTP.
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

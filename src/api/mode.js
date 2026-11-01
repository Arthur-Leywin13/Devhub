// En production, utiliser le backend réel par défaut. En local, garder les mocks
// tant que VITE_API_URL n'est pas renseignée.
export const API_MODE = import.meta.env.VITE_API_URL || import.meta.env.PROD ? 'live' : 'mock'

export const isMockMode = API_MODE === 'mock'

// Détermine si le frontend parle à un vrai backend (VITE_API_URL défini)
// ou utilise l'adaptateur mock temporaire (src/mocks/) pendant le développement.
//
// Pour brancher le backend réel : définir VITE_API_URL dans .env, rien d'autre
// à changer dans les pages ou composants.

export const API_MODE = import.meta.env.VITE_API_URL ? 'live' : 'mock'

export const isMockMode = API_MODE === 'mock'

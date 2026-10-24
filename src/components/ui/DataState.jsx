import ErrorState from './ErrorState'

// Enveloppe commune pour les pages connectées à l'API : évite de répéter
// la logique loading / error / empty / success dans chaque page.
export default function DataState({ loading, error, isEmpty, onRetry, skeleton, empty, children }) {
  if (loading) return skeleton || null
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (isEmpty) return empty || null
  return children
}

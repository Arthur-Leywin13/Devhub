import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Skeleton } from './ui/Skeleton'

// Enveloppe les routes qui nécessitent une session active (voir section
// "Routes publiques et privées"). Redirige vers /connexion sinon, en
// conservant la page d'origine pour y revenir après connexion.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/connexion" state={{ from: location }} replace />
  return children
}

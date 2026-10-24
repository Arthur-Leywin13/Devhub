import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Skeleton } from './ui/Skeleton'
import EmptyState from './ui/EmptyState'

// Réserve une route à certains rôles (ex. ['moderator', 'admin']). Non connecté →
// connexion ; connecté sans le bon rôle → « Accès refusé ». Ceci n'est qu'un confort
// d'affichage : le backend doit refuser (403) chaque requête d'un rôle non autorisé.
export default function RoleRoute({ roles, children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Skeleton className="h-8 w-1/3" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/connexion" state={{ from: location }} replace />
  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-md p-6">
        <EmptyState icon={ShieldAlert} title="Accès refusé" description="Cet espace est réservé à l'équipe de modération." />
      </div>
    )
  }
  return children
}

import { ShieldOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from './Button'

// Un compte banni ne voit plus que cet écran (le backend lui refuse déjà toute l'API).
export default function AccountGate({ children }) {
  const { user, logout } = useAuth()
  if (user?.status !== 'banned') return children

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md rounded-xl2 border border-line bg-surface p-8 text-center shadow-glow">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-state-danger/10 text-state-danger">
          <ShieldOff size={24} />
        </div>
        <h1 className="font-display text-xl font-semibold text-text-hi">Compte banni</h1>
        <p className="mt-2 text-sm text-text-mid">Ce compte n'a plus accès à DevHub.</p>
        {user.statusReason && (
          <p className="mt-4 rounded-lg bg-surface-raised px-3 py-2 text-sm text-text-hi">Motif : {user.statusReason}</p>
        )}
        <p className="mt-4 text-xs text-text-low">Pour contester cette décision, contactez l'équipe de modération.</p>
        <Button variant="secondary" className="mt-6 w-full" onClick={logout}>Se déconnecter</Button>
      </div>
    </div>
  )
}

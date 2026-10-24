import { AlertTriangle, RotateCw, WifiOff } from 'lucide-react'
import Button from '../Button'

export default function ErrorState({ error, onRetry }) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  const Icon = offline ? WifiOff : AlertTriangle

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-line bg-surface py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-state-danger/10 text-state-danger">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-text-hi">
          {offline ? 'Connexion indisponible' : 'Une erreur est survenue'}
        </p>
        <p className="mt-1 max-w-xs text-xs text-text-mid">
          {offline
            ? 'Vérifiez votre connexion réseau puis réessayez.'
            : error?.message || 'Impossible de charger ces données pour le moment.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}

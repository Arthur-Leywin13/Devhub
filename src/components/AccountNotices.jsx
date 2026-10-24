import { useEffect, useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { moderationApi } from '../api/moderation'
import Modal from './Modal'
import Button from './Button'

const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// Affiche (1) un bandeau quand le compte est suspendu (lecture seule) et
// (2) les avertissements de la modération, à confirmer un par un.
export default function AccountNotices() {
  const { user, isAuthenticated } = useAuth()
  const [warnings, setWarnings] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setWarnings([])
      return undefined
    }
    let cancelled = false
    moderationApi
      .getMyWarnings()
      .then((list) => {
        if (!cancelled) setWarnings(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.id])

  const acknowledge = async () => {
    const [current, ...rest] = warnings
    setBusy(true)
    setError(null)
    try {
      await moderationApi.acknowledgeWarning(current.id)
      setWarnings(rest)
    } catch (err) {
      setError(err.message || 'Impossible de confirmer, réessayez.')
    } finally {
      setBusy(false)
    }
  }

  const current = warnings[0]

  return (
    <>
      {user?.status === 'suspended' && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-state-warning/40 bg-state-warning/10 p-4 text-sm text-text-hi">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-state-warning" />
          <div>
            <p className="font-medium">Votre compte est suspendu jusqu'au {formatDate(user.suspendedUntil)}.</p>
            <p className="mt-1 text-text-mid">
              Vous pouvez consulter DevHub, mais vous ne pouvez ni publier, ni commenter, ni aimer, ni envoyer de messages.
              {user.statusReason ? ` Motif : ${user.statusReason}` : ''}
            </p>
          </div>
        </div>
      )}

      <Modal open={!!current} onClose={() => {}} dismissible={false} title="Avertissement de la modération">
        {current && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-state-warning" />
              <div className="text-sm">
                <p className="text-text-mid">Reçu le {formatDate(current.createdAt)}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-text-hi">{current.reason}</p>
              </div>
            </div>
            <p className="text-xs text-text-low">
              Les avertissements répétés peuvent entraîner une suspension ou un bannissement du compte.
            </p>
            {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}
            <Button onClick={acknowledge} disabled={busy}>
              {busy ? 'Confirmation...' : "J'ai compris"}
            </Button>
          </div>
        )}
      </Modal>
    </>
  )
}

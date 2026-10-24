import { useEffect, useState } from 'react'
import Modal from '../Modal'
import Button from '../Button'
import { MIN_REASON_LENGTH, MAX_REASON_LENGTH, SUSPENSION_DURATIONS } from '../../lib/moderation'

const CONFIG = {
  warn: {
    title: "Avertir l'utilisateur",
    submit: "Envoyer l'avertissement",
    hint: "L'utilisateur verra ce message à sa prochaine visite et devra confirmer l'avoir lu. Il reste dans son historique.",
  },
  suspend: {
    title: 'Suspendre le compte',
    submit: 'Suspendre',
    hint: 'Pendant la suspension, le compte est en lecture seule : il ne peut plus publier, commenter, aimer ni envoyer de messages.',
    needsDuration: true,
  },
  ban: {
    title: 'Bannir le compte',
    submit: 'Bannir définitivement',
    hint: "Le compte perd tout accès à DevHub et disparaît du site. Seul un administrateur peut lever un bannissement.",
    danger: true,
  },
  delete: {
    title: 'Supprimer ce contenu',
    submit: 'Supprimer',
    hint: 'Le contenu est retiré immédiatement du site. Le motif est conservé dans le journal d\'audit.',
    danger: true,
  },
  restore: {
    title: 'Rétablir le compte',
    submit: 'Rétablir',
    hint: 'Le compte retrouve un accès normal.',
  },
}

// Fenêtre unique pour avertir / suspendre / bannir / rétablir : motif obligatoire
// (conservé dans le journal d'audit), durée pour une suspension.
export default function SanctionDialog({ open, kind, user, onClose, onSubmit }) {
  const config = CONFIG[kind] || CONFIG.warn
  const [reason, setReason] = useState('')
  const [durationDays, setDurationDays] = useState(7)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setReason('')
      setDurationDays(7)
      setBusy(false)
      setError(null)
    }
  }, [open, kind])

  const submit = async (e) => {
    e.preventDefault()
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(`Le motif doit contenir au moins ${MIN_REASON_LENGTH} caractères.`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ reason: reason.trim(), durationDays })
      onClose()
    } catch (err) {
      setError(err.message || 'Action impossible, réessayez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={config.title}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {user && <p className="text-sm text-text-hi">@{user.username}</p>}
        <p className="text-sm text-text-mid">{config.hint}</p>

        {config.needsDuration && (
          <label className="flex flex-col gap-1.5 text-sm text-text-mid">
            Durée
            <select className="input" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))}>
              {SUSPENSION_DURATIONS.map((d) => (
                <option key={d} value={d}>{d} jour{d > 1 ? 's' : ''}</option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm text-text-mid">
          Motif (obligatoire)
          <textarea
            required
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={kind === 'restore' ? 'Pourquoi rétablir ce compte ?' : "Expliquez la raison de cette décision (visible par l'utilisateur et dans le journal)."}
            className="input resize-none"
          />
          <span className="self-end text-xs text-text-low">{reason.length}/{MAX_REASON_LENGTH}</span>
        </label>

        {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button type="submit" variant={config.danger ? 'danger' : 'primary'} disabled={busy}>
            {busy ? 'Patientez...' : config.submit}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

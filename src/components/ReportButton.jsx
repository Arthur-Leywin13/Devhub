import { useState } from 'react'
import { Flag } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { moderationApi } from '../api/moderation'
import { useAuth } from '../hooks/useAuth'
import { REPORT_REASONS, TARGET_LABELS } from '../lib/moderation'

// Bouton « Signaler » : alimente la file de signalements de l'espace d'administration.
// authorId (optionnel) masque le bouton sur ses propres contenus.
export default function ReportButton({ targetType, targetId, context, authorId, label, className = '', open: controlledOpen, onClose }) {
  const { user, isAuthenticated } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const controlled = controlledOpen !== undefined
  const open = controlled ? controlledOpen : internalOpen
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  if (!isAuthenticated || (authorId && authorId === user.id)) return null

  const close = () => {
    if (controlled) onClose?.()
    else setInternalOpen(false)
    setReason('')
    setDetails('')
    setError(null)
    setDone(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!reason) {
      setError('Choisissez un motif.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await moderationApi.report({ targetType, targetId, reason, details, context })
      setDone(true)
    } catch (err) {
      setError(err.message || "Le signalement n'a pas pu être envoyé, réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {!controlled && (
        <button
          type="button"
          onClick={() => setInternalOpen(true)}
          aria-label="Signaler"
          title="Signaler"
          className={`flex items-center gap-1.5 text-xs text-text-low transition-colors hover:text-state-danger ${className}`}
        >
          <Flag size={15} />
          {label && <span>{label}</span>}
        </button>
      )}

      <Modal open={open} onClose={close} title={`Signaler — ${TARGET_LABELS[targetType] || 'contenu'}`}>
        {done ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-mid">Merci. Votre signalement a été transmis à l'équipe de modération.</p>
            <Button onClick={close}>Fermer</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm text-text-mid">Pourquoi signalez-vous ce contenu ?</legend>
              {REPORT_REASONS.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm text-text-hi">
                  <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="accent-accent-blue" />
                  {r.label}
                </label>
              ))}
            </fieldset>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Précisions (facultatif)"
              className="input resize-none"
            />
            {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={close}>Annuler</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Envoi...' : 'Envoyer le signalement'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}

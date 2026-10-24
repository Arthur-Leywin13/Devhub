import { useEffect, useState } from 'react'
import Modal from '../Modal'
import Button from '../Button'

// Confirmation d'une action sensible (suppression...). onConfirm peut être asynchrone :
// en cas d'erreur, le message s'affiche dans la fenêtre et rien n'est fermé.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', danger = false, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setBusy(false)
      setError(null)
    }
  }, [open])

  const handleConfirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err.message || 'Une erreur est survenue, réessayez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title}>
      <p className="text-sm text-text-mid">{message}</p>
      {error && <p className="mt-3 rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm} disabled={busy}>
          {busy ? 'Patientez...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

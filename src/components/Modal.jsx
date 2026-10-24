import { useEffect } from 'react'
import { X } from 'lucide-react'

// dismissible=false : ni croix, ni clic sur le fond, ni Échap (ex. avertissement à confirmer).
export default function Modal({ open, onClose, title, children, dismissible = true }) {
  useEffect(() => {
    if (!open || !dismissible) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, dismissible, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismissible ? onClose : undefined} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl2 border border-line bg-surface-raised p-6 shadow-glow animate-[fadeIn_0.15s_ease-out]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-text-hi">{title}</h3>
          {dismissible && (
            <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 text-text-low hover:bg-surface-hover hover:text-text-hi">
              <X size={18} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

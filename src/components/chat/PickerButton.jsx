import { useEffect, useRef } from 'react'

// Bouton + panneau flottant (emoji, stickers, GIFs, fond d'écran).
// L'extérieur du conteneur (bouton compris) ferme le panneau : recliquer sur
// le bouton le referme proprement au lieu de le rouvrir aussitôt.
// anchor="composer" : le panneau se cale sur le formulaire parent (pleine
// largeur sur mobile) ; anchor="button" : sur le bouton lui-même.
export default function PickerButton({ icon: Icon, label, open, onToggle, onClose, anchor = 'composer', children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <div ref={ref} className={anchor === 'button' ? 'relative' : ''}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={open}
        className={`rounded-lg p-2 transition-colors hover:bg-surface-raised hover:text-accent-blue ${
          open ? 'text-accent-blue' : 'text-text-low'
        }`}
      >
        <Icon size={18} />
      </button>
      {open && children}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

// Petit menu « ⋯ » d'actions sur un message (modifier, supprimer, signaler...).
// actions : [{ label, icon: Icon, onClick, danger? }]
export default function MessageMenu({ actions, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!actions.length) return null

  return (
    <div ref={ref} className="relative flex-shrink-0 self-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Actions du message"
        aria-expanded={open}
        className="rounded-full p-1 text-text-low opacity-60 transition-opacity hover:bg-ink/50 hover:opacity-100"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          className={`absolute top-full z-20 mt-1 min-w-40 overflow-hidden rounded-xl border border-line bg-surface-raised py-1 shadow-glow ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {actions.map(({ label, icon: Icon, onClick, danger }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false)
                onClick()
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
                danger ? 'text-state-danger' : 'text-text-mid hover:text-text-hi'
              }`}
            >
              {Icon && <Icon size={14} />} {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

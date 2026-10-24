import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface-raised px-3.5 py-2 text-sm text-text-mid transition-colors hover:border-accent-blue/40 hover:text-text-hi"
      >
        {value || label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[160px] overflow-hidden rounded-xl border border-line bg-surface-raised shadow-glow">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className="block w-full px-3.5 py-2 text-left text-sm text-text-mid transition-colors hover:bg-surface-hover hover:text-text-hi"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

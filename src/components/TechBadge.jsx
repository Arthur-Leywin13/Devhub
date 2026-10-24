import { useEffect, useState } from 'react'
import { getTechnologiesCached } from '../api/technologiesCache'

export default function TechBadge({ id, size = 'sm' }) {
  const [tech, setTech] = useState(null)

  useEffect(() => {
    let cancelled = false
    getTechnologiesCached().then((list) => {
      if (!cancelled) setTech(list.find((t) => t.id === id) || null)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!tech) return null

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised font-mono ${sizeClasses} text-text-mid`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tech.color }} />
      {tech.name}
    </span>
  )
}

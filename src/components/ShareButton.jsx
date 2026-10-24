import { useEffect, useRef, useState } from 'react'
import { Share2 } from 'lucide-react'
import { shareLink } from '../lib/share'

export default function ShareButton({ title, url, className = '' }) {
  const [message, setMessage] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleClick = async () => {
    const result = await shareLink({ title, url })
    if (result === 'copied' || result === 'failed') {
      setMessage(result === 'copied' ? 'Lien copié' : 'Copie impossible')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setMessage(null), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Partager"
      className={`flex items-center gap-1.5 text-xs transition-colors hover:text-text-hi ${className}`}
    >
      <Share2 size={16} />
      {message && <span className="text-state-success">{message}</span>}
    </button>
  )
}

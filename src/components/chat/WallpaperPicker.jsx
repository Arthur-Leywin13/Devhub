import { useRef, useState } from 'react'
import { Check, ImagePlus, Ban, Loader2 } from 'lucide-react'
import { defaultWallpapers } from '../../lib/wallpapers'

// Choix du fond d'écran d'une discussion : fonds par défaut, "Aucun", ou
// import d'une image personnelle.
export default function WallpaperPicker({ current, onSelect, onUpload, busy }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const isCustom = !!current && !defaultWallpapers.some((w) => w.url === current)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
    }
  }

  const tile = (active) =>
    `relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border transition-colors ${
      active ? 'border-accent-blue ring-1 ring-accent-blue' : 'border-line hover:border-accent-blue/50'
    }`

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface-raised p-3 shadow-glow">
      <p className="mb-2 text-xs font-medium text-text-mid">Fond d'écran de la discussion</p>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => onSelect(null)} disabled={busy} className={`${tile(!current)} flex-col bg-surface text-text-low`}>
          <Ban size={16} />
          <span className="mt-0.5 text-[10px]">Aucun</span>
          {!current && <Check size={12} className="absolute right-1 top-1 text-accent-blue" />}
        </button>

        {defaultWallpapers.map((w) => (
          <button key={w.id} type="button" onClick={() => onSelect(w.url)} disabled={busy} className={tile(current === w.url)} title={w.name}>
            <img src={w.url} alt={w.name} className="h-full w-full object-cover" />
            {current === w.url && <Check size={12} className="absolute right-1 top-1 rounded-full bg-accent-blue p-0.5 text-white" />}
          </button>
        ))}

        {isCustom && (
          <button type="button" className={tile(true)} title="Votre image">
            <img src={current} alt="Votre image" className="h-full w-full object-cover" />
            <Check size={12} className="absolute right-1 top-1 rounded-full bg-accent-blue p-0.5 text-white" />
          </button>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || busy}
          className={`${tile(false)} flex-col border-dashed bg-surface text-text-low hover:text-accent-blue disabled:opacity-50`}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          <span className="mt-0.5 text-[10px]">Importer</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

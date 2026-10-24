import { useRef, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'

// Picker réutilisable pour les stickers et les GIFs : grille des éléments
// existants + tuile "Créer" pour en ajouter un nouveau (upload) sans quitter
// la conversation.
export default function MediaPicker({ items, loading, onSelect, onCreateFile, renderItem, emptyLabel, accept }) {
  const fileInputRef = useRef(null)
  const [creating, setCreating] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setCreating(true)
    try {
      await onCreateFile(file)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 flex max-h-72 flex-col gap-2 rounded-xl border border-line bg-surface-raised p-3 shadow-glow sm:right-auto sm:w-72">
      <div className="grid grid-cols-4 gap-2 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface transition-colors hover:bg-surface-hover"
          >
            {renderItem(item)}
          </button>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={creating}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-text-low transition-colors hover:border-accent-blue/50 hover:text-accent-blue disabled:opacity-50"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          <span className="text-[10px]">Créer</span>
        </button>
      </div>

      {!loading && items.length === 0 && <p className="px-1 text-center text-xs text-text-low">{emptyLabel}</p>}

      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  )
}

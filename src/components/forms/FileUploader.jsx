import { useRef, useState } from 'react'
import { Package, X, Loader2, FileText } from 'lucide-react'
import { uploadsApi } from '../../api/uploads'
import { MEDIA_LIMITS } from '../../lib/attachments'

const MAX_FILES = 5

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

// Fichiers téléchargeables d'un projet (archives, binaires, documents...).
export default function FileUploader({ files, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFiles = async (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    if (picked.length === 0) return
    setError(null)
    setUploading(true)
    const next = [...files]
    try {
      for (const file of picked) {
        if (next.length >= MAX_FILES) {
          setError(`Maximum ${MAX_FILES} fichiers.`)
          break
        }
        if (file.size > MEDIA_LIMITS.file) {
          setError(`${file.name} est trop volumineux (maximum ${Math.round(MEDIA_LIMITS.file / 1024 / 1024)} Mo).`)
          continue
        }
        const uploaded = await uploadsApi.upload(file, 'project-file')
        next.push({ name: file.name, size: file.size, url: uploaded.url })
      }
      onChange(next)
    } catch (err) {
      setError(err.message || "L'envoi du fichier a échoué.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-6 text-sm text-text-mid transition-colors hover:border-accent-blue/50 hover:text-text-hi disabled:opacity-50"
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />} Importer un fichier ou une archive
      </button>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFiles} />

      {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-xs text-state-danger">{error}</p>}

      {files.map((f, i) => (
        <div key={f.url} className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm">
          <FileText size={15} className="flex-shrink-0 text-text-low" />
          <span className="min-w-0 flex-1 truncate text-text-hi">{f.name}</span>
          <span className="flex-shrink-0 text-xs text-text-low">{formatSize(f.size)}</span>
          <button
            type="button"
            onClick={() => onChange(files.filter((_, idx) => idx !== i))}
            aria-label="Retirer le fichier"
            className="flex-shrink-0 text-text-low hover:text-state-danger"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

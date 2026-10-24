import { useRef, useState } from 'react'
import { ImagePlus, Video, X, Loader2 } from 'lucide-react'
import { uploadAttachment, validateFile } from '../../lib/attachments'

// Sélecteur d'images (plusieurs) et de vidéo (une) avec aperçus.
// La première image sert de couverture. Contrôlé : { images, video } + onChange.
export default function MediaUploader({ images, video, onChange, maxImages = 6, purposePrefix = 'project' }) {
  const imageInput = useRef(null)
  const videoInput = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const addImages = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    setError(null)
    setUploading(true)
    const next = [...images]
    try {
      for (const file of files) {
        if (next.length >= maxImages) {
          setError(`Maximum ${maxImages} images.`)
          break
        }
        const problem = validateFile(file, ['image'])
        if (problem) {
          setError(problem)
          continue
        }
        const attachment = await uploadAttachment(file, `${purposePrefix}-image`)
        if (attachment) next.push(attachment)
      }
      onChange({ images: next, video })
    } catch (err) {
      setError(err.message || "L'envoi des images a échoué.")
    } finally {
      setUploading(false)
    }
  }

  const setVideo = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    const problem = validateFile(file, ['video'])
    if (problem) {
      setError(problem)
      return
    }
    setUploading(true)
    try {
      const attachment = await uploadAttachment(file, `${purposePrefix}-video`)
      onChange({ images, video: attachment })
    } catch (err) {
      setError(err.message || "L'envoi de la vidéo a échoué.")
    } finally {
      setUploading(false)
    }
  }

  const dashed =
    'flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-6 text-sm text-text-mid transition-colors hover:border-accent-blue/50 hover:text-text-hi disabled:opacity-50'

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => imageInput.current?.click()} disabled={uploading} className={dashed}>
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />} Ajouter des images
        </button>
        <button type="button" onClick={() => videoInput.current?.click()} disabled={uploading} className={dashed}>
          <Video size={18} /> {video ? 'Remplacer la vidéo' : 'Ajouter une vidéo'}
        </button>
      </div>
      <input ref={imageInput} type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
      <input ref={videoInput} type="file" accept="video/*" className="hidden" onChange={setVideo} />

      {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-xs text-state-danger">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.url} className="relative aspect-video overflow-hidden rounded-lg border border-line">
              <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Couverture</span>
              )}
              <button
                type="button"
                onClick={() => onChange({ images: images.filter((_, idx) => idx !== i), video })}
                aria-label="Retirer l'image"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-state-danger"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {video && (
        <div className="relative overflow-hidden rounded-lg border border-line">
          <video src={video.url} controls preload="metadata" className="aspect-video w-full bg-black" />
          <button
            type="button"
            onClick={() => onChange({ images, video: null })}
            aria-label="Retirer la vidéo"
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-state-danger"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

import { useRef, useState } from 'react'
import { Image as ImageIcon, Video, Link2, Send, Newspaper, X, Loader2 } from 'lucide-react'
import { useFeed } from '../hooks/usePosts'
import { useAuth } from '../hooks/useAuth'
import { postsApi } from '../api/posts'
import { uploadAttachment, validateFile } from '../lib/attachments'
import { normalizeUrl, getDomain } from '../lib/url'
import PostCard from '../components/PostCard'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { ListRowSkeleton } from '../components/ui/Skeleton'

const MAX_LENGTH = 2000

export default function Feed() {
  const { user, isAuthenticated } = useAuth()
  const { data: posts, loading, error, refetch, setData } = useFeed()

  const [draft, setDraft] = useState('')
  const [media, setMedia] = useState(null) // { type: 'image' | 'video', url, name }
  const [link, setLink] = useState(null) // URL normalisée
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkDraft, setLinkDraft] = useState('')
  const [composerError, setComposerError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const imageRef = useRef(null)
  const videoRef = useRef(null)

  const canPublish = (draft.trim() || media || link) && !posting && !uploading

  const handleMedia = (kind) => async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = validateFile(file, [kind])
    if (problem) {
      setComposerError(problem)
      return
    }
    setComposerError(null)
    setUploading(true)
    try {
      // Une publication contient soit une image, soit une vidéo (le dernier choix remplace le précédent).
      const attachment = await uploadAttachment(file, 'post-media')
      if (attachment) setMedia(attachment)
    } catch (err) {
      setComposerError(err.message || "L'envoi du fichier a échoué.")
    } finally {
      setUploading(false)
    }
  }

  const addLink = () => {
    const normalized = normalizeUrl(linkDraft)
    if (!normalized) {
      setComposerError('Lien invalide : saisissez une adresse http(s) valide (ex. https://exemple.com).')
      return
    }
    setComposerError(null)
    setLink(normalized)
    setLinkDraft('')
    setLinkOpen(false)
  }

  const handlePublish = async () => {
    if (!canPublish) return
    setPosting(true)
    setComposerError(null)
    try {
      const post = await postsApi.create({
        content: draft.trim(),
        image: media?.type === 'image' ? media.url : null,
        video: media?.type === 'video' ? media.url : null,
        link: link ? { url: link } : null,
      })
      setData([post, ...(posts || [])])
      setDraft('')
      setMedia(null)
      setLink(null)
    } catch (err) {
      setComposerError(err.message || "La publication n'a pas pu être envoyée, réessayez.")
    } finally {
      setPosting(false)
    }
  }

  const toolButton =
    'rounded-lg p-2 text-text-low transition-colors hover:bg-surface-raised hover:text-accent-blue disabled:opacity-40'

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Fil d'actualité</h1>
        <p className="mt-1 text-sm text-text-mid">Ce que la communauté construit et partage en ce moment.</p>
      </div>

      {isAuthenticated && (
        <div className="rounded-xl2 border border-line bg-surface p-4">
          <div className="flex gap-3">
            <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX_LENGTH}
              placeholder="Partagez une mise à jour, une vidéo, un lien, une capture..."
              rows={2}
              className="flex-1 resize-none bg-transparent text-sm text-text-hi placeholder:text-text-low outline-none"
            />
          </div>

          {composerError && (
            <p className="mt-3 rounded-lg bg-state-danger/10 px-3 py-2 text-xs text-state-danger">{composerError}</p>
          )}

          {uploading && (
            <p className="mt-3 flex items-center gap-2 text-xs text-text-mid">
              <Loader2 size={14} className="animate-spin" /> Envoi du fichier...
            </p>
          )}

          {media && (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-line bg-black">
              {media.type === 'image' ? (
                <img src={media.url} alt={media.name} className="max-h-64 w-full object-cover" />
              ) : (
                <video src={media.url} controls preload="metadata" className="max-h-64 w-full" />
              )}
              <button
                type="button"
                onClick={() => setMedia(null)}
                aria-label="Retirer le média"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-state-danger"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {link && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-raised px-3 py-2 text-sm">
              <Link2 size={15} className="flex-shrink-0 text-accent-blue" />
              <span className="min-w-0 flex-1 truncate text-text-hi">{getDomain(link)}</span>
              <button type="button" onClick={() => setLink(null)} aria-label="Retirer le lien" className="text-text-low hover:text-state-danger">
                <X size={14} />
              </button>
            </div>
          )}

          {linkOpen && (
            <div className="mt-3 flex items-center gap-2">
              <input
                autoFocus
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addLink()
                  }
                }}
                placeholder="https://exemple.com/article"
                className="input flex-1"
              />
              <button type="button" onClick={addLink} className="rounded-xl bg-accent-blue px-3 py-2.5 text-sm font-medium text-white hover:bg-accent-bluedark">
                Ajouter
              </button>
            </div>
          )}

          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleMedia('image')} />
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleMedia('video')} />

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <div className="flex gap-1">
              <button type="button" aria-label="Ajouter une image" onClick={() => imageRef.current?.click()} disabled={uploading} className={toolButton}>
                <ImageIcon size={17} />
              </button>
              <button type="button" aria-label="Ajouter une vidéo" onClick={() => videoRef.current?.click()} disabled={uploading} className={toolButton}>
                <Video size={17} />
              </button>
              <button
                type="button"
                aria-label="Ajouter un lien"
                onClick={() => setLinkOpen((v) => !v)}
                className={`${toolButton} ${linkOpen || link ? 'text-accent-blue' : ''}`}
              >
                <Link2 size={17} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {draft.length > MAX_LENGTH - 200 && (
                <span className="text-xs text-text-low">{MAX_LENGTH - draft.length}</span>
              )}
              <button
                onClick={handlePublish}
                disabled={!canPublish}
                className="flex items-center gap-1.5 rounded-xl bg-accent-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                <Send size={14} /> {posting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DataState
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!loading && !error && posts?.length === 0}
        skeleton={
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => <ListRowSkeleton key={i} />)}
          </div>
        }
        empty={<EmptyState icon={Newspaper} title="Aucune publication pour le moment." />}
      >
        <div className="flex flex-col gap-4">
          {posts?.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </DataState>
    </div>
  )
}

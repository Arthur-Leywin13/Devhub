import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Trash2 } from 'lucide-react'
import { commentsApi } from '../api/comments'
import { getUserCached } from '../api/usersCache'
import { useAuth } from '../hooks/useAuth'
import Linkify from './ui/Linkify'
import ReportButton from './ReportButton'
import { Skeleton } from './ui/Skeleton'
import { timeAgo } from '../lib/timeAgo'

// Fil de commentaires réutilisé par les projets, articles et publications.
// targetType : 'project' | 'article' | 'post'
export default function CommentSection({ targetType, targetId, onCountChange }) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState([])
  const [authors, setAuthors] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    commentsApi
      .listFor(targetType, targetId)
      .then(async (list) => {
        const entries = await Promise.all(
          [...new Set(list.map((c) => c.authorId))].map(async (uid) => [uid, await getUserCached(uid)])
        )
        if (cancelled) return
        setComments(list)
        setAuthors(Object.fromEntries(entries))
        setLoading(false)
        onCountChange?.(list.length)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId, reloadKey])

  const submit = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || posting) return
    setPosting(true)
    setError(null)
    try {
      const comment = await commentsApi.add(targetType, targetId, text)
      if (!authors[comment.authorId]) {
        const author = await getUserCached(comment.authorId)
        setAuthors((a) => ({ ...a, [comment.authorId]: author }))
      }
      const next = [...comments, comment]
      setComments(next)
      onCountChange?.(next.length)
      setDraft('')
    } catch (err) {
      setError(err.message || "Le commentaire n'a pas pu être publié, réessayez.")
    } finally {
      setPosting(false)
    }
  }

  const remove = async (comment) => {
    setError(null)
    const previous = comments
    const next = comments.filter((c) => c.id !== comment.id)
    setComments(next)
    onCountChange?.(next.length)
    try {
      await commentsApi.remove(targetType, targetId, comment.id)
    } catch (err) {
      setComments(previous)
      onCountChange?.(previous.length)
      setError(err.message || 'Suppression impossible, réessayez.')
    }
  }

  const canDelete = (c) => isAuthenticated && (user.id === c.authorId || ['moderator', 'admin'].includes(user.role))

  return (
    <section>
      <h3 className="mb-3 font-display text-base font-semibold text-text-hi">Commentaires ({comments.length})</h3>

      {error && <p className="mb-3 rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}

      {isAuthenticated ? (
        <form onSubmit={submit} className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Ajouter un commentaire..."
            className="flex-1 bg-transparent text-sm text-text-hi placeholder:text-text-low outline-none"
          />
          <button type="submit" disabled={!draft.trim() || posting} aria-label="Publier le commentaire" className="text-accent-blue disabled:opacity-40">
            <Send size={16} />
          </button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-text-low">
          <Link to="/connexion" className="text-accent-blue hover:underline">Connectez-vous</Link> pour commenter.
        </p>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-text-mid">
          Impossible de charger les commentaires.{' '}
          <button onClick={() => setReloadKey((k) => k + 1)} className="text-accent-blue hover:underline">Réessayer</button>
        </p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-text-low">Aucun commentaire pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <img src={authors[c.authorId]?.avatarUrl} alt="" className="h-8 w-8 rounded-full bg-surface-raised object-cover" />
              <div className="min-w-0 flex-1 rounded-xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-text-hi">@{authors[c.authorId]?.username || '···'}</span>
                  <span className="flex flex-shrink-0 items-center gap-2 text-xs text-text-low">
                    {timeAgo(c.createdAt)}
                    <ReportButton targetType="comment" targetId={c.id} authorId={c.authorId} />
                    {canDelete(c) && (
                      <button onClick={() => remove(c)} aria-label="Supprimer le commentaire" className="hover:text-state-danger">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-text-mid">
                  <Linkify text={c.text} />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

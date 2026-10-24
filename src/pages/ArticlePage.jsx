import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, Clock } from 'lucide-react'
import { useArticle } from '../hooks/useArticles'
import { useAuthor } from '../hooks/useAuthor'
import { useAuth } from '../hooks/useAuth'
import { articlesApi } from '../api/articles'
import CommentSection from '../components/CommentSection'
import ShareButton from '../components/ShareButton'
import ReportButton from '../components/ReportButton'
import Linkify from '../components/ui/Linkify'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'

export default function ArticlePage() {
  const { id } = useParams()
  const { data: article, loading, error, refetch, setData } = useArticle(id)
  const { isAuthenticated } = useAuth()
  const author = useAuthor(article?.authorId)
  const [commentCount, setCommentCount] = useState(null)
  const [liking, setLiking] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error?.status === 404) return <EmptyState title="Article introuvable." />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!article) return null

  const toggleLike = async () => {
    if (!isAuthenticated || liking) return
    setLiking(true)
    const next = !article.likedByCurrentUser
    setData({ ...article, likedByCurrentUser: next, likesCount: article.likesCount + (next ? 1 : -1) })
    try {
      await (next ? articlesApi.like(article.id) : articlesApi.unlike(article.id))
    } catch {
      refetch()
    } finally {
      setLiking(false)
    }
  }

  const toggleBookmark = async () => {
    if (!isAuthenticated || savingBookmark) return
    setSavingBookmark(true)
    const next = !article.savedByCurrentUser
    setData({ ...article, savedByCurrentUser: next })
    try {
      await (next ? articlesApi.save(article.id) : articlesApi.unsave(article.id))
    } catch {
      setData({ ...article, savedByCurrentUser: !next })
    } finally {
      setSavingBookmark(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-wide text-accent-blue">{article.category}</span>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text-hi sm:text-3xl">{article.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-text-mid">
          {author && (
            <Link to={`/profil/${author.username}`} className="hover:text-accent-blue">@{author.username}</Link>
          )}
          <span className="flex items-center gap-1 text-text-low"><Clock size={13} /> {article.readTime} min de lecture</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-line">
        <img src={article.image} alt={article.title} className="w-full object-cover" />
      </div>

      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-text-hi">
        <Linkify text={article.content} />
      </p>

      <div className="flex items-center gap-5 border-y border-line py-4 text-text-low">
        <button
          onClick={toggleLike}
          disabled={!isAuthenticated}
          className={`flex items-center gap-1.5 text-sm transition-colors hover:text-state-danger disabled:opacity-50 ${article.likedByCurrentUser ? 'text-state-danger' : ''}`}
        >
          <Heart size={17} fill={article.likedByCurrentUser ? 'currentColor' : 'none'} /> {article.likesCount}
        </button>
        <span className="flex items-center gap-1.5 text-sm"><MessageCircle size={17} /> {commentCount ?? article.commentsCount ?? 0}</span>
        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={toggleBookmark}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1.5 text-sm transition-colors hover:text-accent-blue disabled:opacity-50 ${article.savedByCurrentUser ? 'text-accent-blue' : ''}`}
          >
            <Bookmark size={17} fill={article.savedByCurrentUser ? 'currentColor' : 'none'} />
            {article.savedByCurrentUser ? 'Enregistré' : 'Enregistrer'}
          </button>
          <ReportButton targetType="article" targetId={article.id} authorId={article.authorId} />
          <ShareButton title={article.title} url={`/articles/${article.slug || article.id}`} className="text-sm" />
        </div>
      </div>

      <CommentSection targetType="article" targetId={article.id} onCountChange={setCommentCount} />
    </div>
  )
}

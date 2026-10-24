import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, Rocket, FileText } from 'lucide-react'
import { useAuthor } from '../hooks/useAuthor'
import { getProjectCached } from '../api/projectsCache'
import { getArticleCached } from '../api/articlesCache'
import { postsApi } from '../api/posts'
import { useAuth } from '../hooks/useAuth'
import { timeAgo } from '../lib/timeAgo'
import Linkify from './ui/Linkify'
import LinkCard from './LinkCard'
import ShareButton from './ShareButton'
import ReportButton from './ReportButton'

export default function PostCard({ post, commentsCount }) {
  const { isAuthenticated } = useAuth()
  const author = useAuthor(post.authorId)
  const [linkedProject, setLinkedProject] = useState(null)
  const [linkedArticle, setLinkedArticle] = useState(null)

  const [liked, setLiked] = useState(!!post.likedByCurrentUser)
  const [likeCount, setLikeCount] = useState(post.likesCount ?? 0)
  const [saved, setSaved] = useState(!!post.savedByCurrentUser)
  const [pending, setPending] = useState(false)
  const [savePending, setSavePending] = useState(false)

  useEffect(() => {
    if (post.linkedProjectId) getProjectCached(post.linkedProjectId).then(setLinkedProject)
    if (post.linkedArticleId) getArticleCached(post.linkedArticleId).then(setLinkedArticle)
  }, [post.linkedProjectId, post.linkedArticleId])

  const toggleLike = async () => {
    if (!isAuthenticated || pending) return
    setPending(true)
    const next = !liked
    setLiked(next)
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
    try {
      await (next ? postsApi.like(post.id) : postsApi.unlike(post.id))
    } catch {
      setLiked(!next)
      setLikeCount((c) => (next ? Math.max(0, c - 1) : c + 1))
    } finally {
      setPending(false)
    }
  }

  const toggleSave = async () => {
    if (!isAuthenticated || savePending) return
    setSavePending(true)
    const next = !saved
    setSaved(next)
    try {
      await (next ? postsApi.save(post.id) : postsApi.unsave(post.id))
    } catch {
      setSaved(!next)
    } finally {
      setSavePending(false)
    }
  }

  return (
    <article className="rounded-xl2 border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        {author ? (
          <Link to={`/profil/${author.username}`}>
            <img src={author.avatarUrl} alt={author.username} className="h-10 w-10 rounded-full object-cover" />
          </Link>
        ) : (
          <div className="h-10 w-10 rounded-full bg-surface-raised" />
        )}
        <div className="min-w-0">
          {author ? (
            <Link to={`/profil/${author.username}`} className="text-sm font-medium text-text-hi hover:text-accent-blue">
              @{author.username}
            </Link>
          ) : (
            <span className="text-sm text-text-low">···</span>
          )}
          <p className="text-xs text-text-low">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {post.content && (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-hi">
          <Linkify text={post.content} />
        </p>
      )}

      {post.image && (
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          <img src={post.image} alt="" loading="lazy" className="max-h-96 w-full object-cover" />
        </div>
      )}

      {post.video && (
        <div className="mt-3 overflow-hidden rounded-xl border border-line bg-black">
          <video src={post.video} controls preload="metadata" className="max-h-96 w-full" />
        </div>
      )}

      <LinkCard link={post.link} />

      {linkedProject && (
        <Link
          to={`/projets/${linkedProject.slug || linkedProject.id}`}
          className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-raised p-3 transition-colors hover:border-accent-blue/40"
        >
          <Rocket size={18} className="text-accent-blue" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-hi">{linkedProject.name}</p>
            <p className="truncate text-xs text-text-low">{linkedProject.description}</p>
          </div>
        </Link>
      )}

      {linkedArticle && (
        <Link
          to={`/articles/${linkedArticle.slug || linkedArticle.id}`}
          className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-raised p-3 transition-colors hover:border-accent-blue/40"
        >
          <FileText size={18} className="text-accent-blue" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-hi">{linkedArticle.title}</p>
            <p className="truncate text-xs text-text-low">{linkedArticle.excerpt}</p>
          </div>
        </Link>
      )}

      <div className="mt-4 flex items-center gap-5 border-t border-line pt-3 text-text-low">
        <button
          onClick={toggleLike}
          disabled={!isAuthenticated}
          className={`flex items-center gap-1.5 text-xs transition-colors hover:text-state-danger disabled:opacity-50 ${liked ? 'text-state-danger' : ''}`}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
        </button>
        <Link to={`/publications/${post.id}`} className="flex items-center gap-1.5 text-xs transition-colors hover:text-text-hi" aria-label="Voir les commentaires">
          <MessageCircle size={16} /> {commentsCount ?? post.commentsCount ?? 0}
        </Link>
        <button
          onClick={toggleSave}
          disabled={!isAuthenticated}
          className={`flex items-center gap-1.5 text-xs transition-colors hover:text-accent-blue disabled:opacity-50 ${saved ? 'text-accent-blue' : ''}`}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <div className="ml-auto flex items-center gap-4">
          <ReportButton targetType="post" targetId={post.id} authorId={post.authorId} />
          <ShareButton title="Publication sur DevHub" url={`/publications/${post.id}`} />
        </div>
      </div>
    </article>
  )
}

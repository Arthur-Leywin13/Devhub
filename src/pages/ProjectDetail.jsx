import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Github, Globe, Download, Heart, MessageCircle, Bookmark, Star, Play, FileText } from 'lucide-react'
import { useProject } from '../hooks/useProjects'
import { useAuthor } from '../hooks/useAuthor'
import { useAuth } from '../hooks/useAuth'
import { projectsApi } from '../api/projects'
import { isSafeUrl } from '../lib/url'
import TechBadge from '../components/TechBadge'
import Button from '../components/Button'
import CommentSection from '../components/CommentSection'
import ShareButton from '../components/ShareButton'
import ReportButton from '../components/ReportButton'
import Linkify from '../components/ui/Linkify'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { data: project, loading, error, refetch, setData } = useProject(id)
  const { isAuthenticated } = useAuth()
  const author = useAuthor(project?.authorId)

  const [commentCount, setCommentCount] = useState(null)
  const [liking, setLiking] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (error?.status === 404) {
    return <EmptyState title="Projet introuvable." description="Ce projet n'existe pas ou a été supprimé." />
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!project) return null

  // Médias : la vidéo (si présente) passe en premier, puis les images (galerie, ou simple couverture).
  const images = project.images?.length ? project.images : project.image ? [project.image] : []
  const mediaItems = [
    ...(project.video ? [{ type: 'video', url: project.video }] : []),
    ...images.map((url) => ({ type: 'image', url })),
  ]
  const active = mediaItems[Math.min(activeIdx, mediaItems.length - 1)]
  const cover = images[0]

  const files = project.files || []
  const githubZip = /^https:\/\/github\.com\/[^/]+\/[^/]+/.test(project.github || '')
    ? `${project.github.replace(/\/$/, '')}/archive/HEAD.zip`
    : null
  const primaryDownload = project.allowDownload
    ? files[0]
      ? { href: files[0].url, download: files[0].name }
      : githubZip
      ? { href: githubZip }
      : null
    : null

  const toggleLike = async () => {
    if (!isAuthenticated || liking) return
    setLiking(true)
    const next = !project.likedByCurrentUser
    setData({ ...project, likedByCurrentUser: next, likesCount: project.likesCount + (next ? 1 : -1) })
    try {
      await (next ? projectsApi.like(project.id) : projectsApi.unlike(project.id))
    } catch {
      refetch()
    } finally {
      setLiking(false)
    }
  }

  const toggleBookmark = async () => {
    if (!isAuthenticated || savingBookmark) return
    setSavingBookmark(true)
    const next = !project.savedByCurrentUser
    setData({ ...project, savedByCurrentUser: next })
    try {
      await (next ? projectsApi.save(project.id) : projectsApi.unsave(project.id))
    } catch {
      setData({ ...project, savedByCurrentUser: !next })
    } finally {
      setSavingBookmark(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {active && (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-xl2 border border-line bg-black">
            {active.type === 'video' ? (
              <video key={active.url} src={active.url} poster={cover} controls preload="metadata" className="aspect-video w-full" />
            ) : (
              <img src={active.url} alt={project.name} className="aspect-video w-full object-cover" />
            )}
          </div>

          {mediaItems.length > 1 && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-low">Médias du projet</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mediaItems.map((m, i) => (
                  <button
                    key={`${m.type}-${m.url}`}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    aria-label={m.type === 'video' ? 'Voir la vidéo' : `Voir l'image ${i + 1}`}
                    className={`relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg border transition-colors ${
                      active === m ? 'border-accent-blue' : 'border-line hover:border-accent-blue/50'
                    }`}
                  >
                    <img src={m.type === 'video' ? cover : m.url} alt="" className="h-full w-full bg-surface-raised object-cover" />
                    {m.type === 'video' && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                        <Play size={18} fill="currentColor" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-hi">{project.name}</h1>
          {author ? (
            <Link to={`/profil/${author.username}`} className="text-sm text-text-mid hover:text-accent-blue">
              @{author.username}
            </Link>
          ) : (
            <span className="text-sm text-text-low">···</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isSafeUrl(project.github) && (
            <a href={project.github} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" icon={Github}>GitHub</Button>
            </a>
          )}
          {isSafeUrl(project.demo) && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" icon={Globe}>Démo</Button>
            </a>
          )}
          {primaryDownload && (
            <a href={primaryDownload.href} download={primaryDownload.download} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" icon={Download}>Télécharger</Button>
            </a>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-text-hi">
        <Linkify text={project.longDescription || project.description} />
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {(project.tech || []).map((t) => <TechBadge key={t} id={t} size="md" />)}
        {project.licence && project.licence !== 'Aucune' && (
          <span className="rounded-full border border-line bg-surface-raised px-2.5 py-1 text-xs text-text-mid">
            Licence : {project.licence}
          </span>
        )}
      </div>

      {project.allowDownload && files.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl2 border border-line bg-surface p-4">
          <h3 className="font-display text-sm font-semibold text-text-hi">Fichiers du projet</h3>
          {files.map((f) => (
            <a
              key={f.url}
              href={f.url}
              download={f.name}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-mid transition-colors hover:bg-surface-raised hover:text-text-hi"
            >
              <FileText size={15} className="flex-shrink-0" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="flex-shrink-0 text-xs text-text-low">{formatSize(f.size)}</span>
              <Download size={14} className="flex-shrink-0" />
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-5 border-y border-line py-4 text-text-low">
        <button
          onClick={toggleLike}
          disabled={!isAuthenticated}
          className={`flex items-center gap-1.5 text-sm transition-colors hover:text-state-danger disabled:opacity-50 ${project.likedByCurrentUser ? 'text-state-danger' : ''}`}
        >
          <Heart size={17} fill={project.likedByCurrentUser ? 'currentColor' : 'none'} /> {project.likesCount}
        </button>
        <span className="flex items-center gap-1.5 text-sm"><MessageCircle size={17} /> {commentCount ?? project.commentsCount ?? 0}</span>
        <span className="flex items-center gap-1.5 text-sm"><Star size={17} /> {project.stars ?? 0}</span>
        <div className="ml-auto flex items-center gap-4">
          <ReportButton targetType="project" targetId={project.id} authorId={project.authorId} />
          <ShareButton title={project.name} url={`/projets/${project.slug || project.id}`} className="text-sm" />
          <button
            onClick={toggleBookmark}
            disabled={!isAuthenticated}
            aria-label={project.savedByCurrentUser ? 'Retirer des enregistrés' : 'Enregistrer'}
            className={`flex items-center gap-1.5 text-sm transition-colors hover:text-accent-blue disabled:opacity-50 ${project.savedByCurrentUser ? 'text-accent-blue' : ''}`}
          >
            <Bookmark size={17} fill={project.savedByCurrentUser ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <CommentSection targetType="project" targetId={project.id} onCountChange={setCommentCount} />
    </div>
  )
}

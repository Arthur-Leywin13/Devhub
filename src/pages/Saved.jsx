import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { useSaved } from '../hooks/usePosts'
import { getProjectCached } from '../api/projectsCache'
import { getArticleCached } from '../api/articlesCache'
import { getPostCached } from '../api/postsCache'
import { postsApi } from '../api/posts'
import ProjectCard from '../components/ProjectCard'
import ArticleCard from '../components/ArticleCard'
import PostCard from '../components/PostCard'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeleton'

function Removable({ onRemove, children }) {
  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Retirer des enregistrés"
        title="Retirer des enregistrés"
        className="absolute right-3 top-3 z-10 rounded-full bg-ink/80 p-1.5 text-accent-blue transition-colors hover:text-state-danger"
      >
        <Bookmark size={14} fill="currentColor" />
      </button>
    </div>
  )
}

export default function Saved() {
  const { data: savedEntries, loading, error, refetch } = useSaved()
  const [resolved, setResolved] = useState(null)
  const [removeError, setRemoveError] = useState(null)

  useEffect(() => {
    if (!savedEntries) return undefined
    let cancelled = false
    const resolveType = (type, getter) =>
      Promise.all(
        savedEntries
          .filter((s) => s.targetType === type)
          .map(async (s) => ({ savedId: s.id, item: await getter(s.targetId) }))
      ).then((list) => list.filter((entry) => entry.item))

    Promise.all([
      resolveType('project', getProjectCached),
      resolveType('article', getArticleCached),
      resolveType('post', getPostCached),
    ]).then(([projects, articles, posts]) => {
      if (!cancelled) setResolved({ projects, articles, posts })
    })
    return () => {
      cancelled = true
    }
  }, [savedEntries])

  const removeEntry = async (type, savedId) => {
    setRemoveError(null)
    const previous = resolved
    setResolved((r) => ({ ...r, [type]: r[type].filter((e) => e.savedId !== savedId) }))
    try {
      await postsApi.unsaveEntry(savedId)
    } catch (err) {
      setResolved(previous)
      setRemoveError(err.message || 'Impossible de retirer cet élément, réessayez.')
    }
  }

  const resolving = !!savedEntries && savedEntries.length > 0 && resolved === null
  const total = resolved ? resolved.projects.length + resolved.articles.length + resolved.posts.length : 0
  const isEmpty = !loading && !error && !resolving && (savedEntries?.length === 0 || total === 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Enregistrés</h1>
        <p className="mt-1 text-sm text-text-mid">Retrouvez tout ce que vous avez sauvegardé sur DevHub.</p>
      </div>

      {removeError && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{removeError}</p>}

      <DataState
        loading={loading || resolving}
        error={error}
        onRetry={refetch}
        isEmpty={isEmpty}
        skeleton={<CardSkeletonGrid count={4} />}
        empty={<EmptyState icon={Bookmark} title="Vous n'avez encore rien enregistré." />}
      >
        <div className="flex flex-col gap-6">
          {resolved?.projects.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {resolved.projects.map((e) => (
                <Removable key={e.savedId} onRemove={() => removeEntry('projects', e.savedId)}>
                  <ProjectCard project={e.item} />
                </Removable>
              ))}
            </div>
          )}
          {resolved?.articles.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {resolved.articles.map((e) => (
                <Removable key={e.savedId} onRemove={() => removeEntry('articles', e.savedId)}>
                  <ArticleCard article={e.item} />
                </Removable>
              ))}
            </div>
          )}
          {resolved?.posts.length > 0 && (
            <div className="flex flex-col gap-4">
              {resolved.posts.map((e) => (
                <PostCard key={e.savedId} post={e.item} />
              ))}
            </div>
          )}
        </div>
      </DataState>
    </div>
  )
}

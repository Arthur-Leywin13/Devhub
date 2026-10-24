import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Sparkles, Plus, Rocket } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import SearchBar from '../components/SearchBar'
import ProjectCard from '../components/ProjectCard'
import Button from '../components/Button'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeleton'

export default function Projects() {
  const { isAuthenticated } = useAuth()
  const [query, setQuery] = useState('')
  const popular = useProjects({ q: query, sort: 'popular' })
  const recent = useProjects({ q: query, sort: 'recent' })

  const isEmpty = !popular.loading && !popular.error && popular.data?.length === 0

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-hi">Projets</h1>
          <p className="mt-1 text-sm text-text-mid">Des projets réels, construits et partagés par la communauté.</p>
        </div>
        <Link to={isAuthenticated ? '/projets/nouveau' : '/connexion'}>
          <Button icon={Plus}>Publier un projet</Button>
        </Link>
      </div>

      <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un projet..." className="max-w-lg" />

      {isEmpty ? (
        <EmptyState
          icon={Rocket}
          title="Aucun projet disponible pour le moment."
          description="Soyez le premier à publier un projet sur DevHub."
          action={
            <Link to={isAuthenticated ? '/projets/nouveau' : '/connexion'}>
              <Button size="sm">Publier un projet</Button>
            </Link>
          }
        />
      ) : (
        <>
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-hi">
              <Flame size={18} className="text-accent-blue" /> Populaires
            </h2>
            <DataState
              loading={popular.loading}
              error={popular.error}
              onRetry={popular.refetch}
              isEmpty={false}
              skeleton={<CardSkeletonGrid count={4} />}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {popular.data?.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </DataState>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-hi">
              <Sparkles size={18} className="text-accent-blue" /> Récents
            </h2>
            <DataState
              loading={recent.loading}
              error={recent.error}
              onRetry={recent.refetch}
              isEmpty={false}
              skeleton={<CardSkeletonGrid count={4} />}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {recent.data?.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </DataState>
          </section>
        </>
      )}
    </div>
  )
}

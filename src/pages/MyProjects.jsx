import { Link } from 'react-router-dom'
import { Plus, Rocket } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import ProjectCard from '../components/ProjectCard'
import Button from '../components/Button'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeleton'

export default function MyProjects() {
  const { user } = useAuth()
  const projects = useProjects({ authorId: user.id })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-hi">Mes projets</h1>
          <p className="mt-1 text-sm text-text-mid">Les projets que vous avez publiés sur DevHub.</p>
        </div>
        <Link to="/projets/nouveau">
          <Button icon={Plus}>Publier un projet</Button>
        </Link>
      </div>

      <DataState
        loading={projects.loading}
        error={projects.error}
        onRetry={projects.refetch}
        isEmpty={!projects.loading && !projects.error && projects.data?.length === 0}
        skeleton={<CardSkeletonGrid count={4} />}
        empty={
          <EmptyState
            icon={Rocket}
            title="Vous n'avez encore publié aucun projet."
            action={
              <Link to="/projets/nouveau">
                <Button size="sm">Publier mon premier projet</Button>
              </Link>
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.data?.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </DataState>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Plus, GraduationCap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import Button from '../components/Button'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeleton'

export default function MyCourses() {
  const { user } = useAuth()
  const courses = useCourses({ authorId: user.id })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-hi">Mes cours</h1>
          <p className="mt-1 text-sm text-text-mid">Les cours que vous avez créés sur DevHub.</p>
        </div>
        <Link to="/cours/nouveau">
          <Button icon={Plus}>Créer un cours</Button>
        </Link>
      </div>

      <DataState
        loading={courses.loading}
        error={courses.error}
        onRetry={courses.refetch}
        isEmpty={!courses.loading && !courses.error && courses.data?.length === 0}
        skeleton={<CardSkeletonGrid count={2} />}
        empty={
          <EmptyState
            icon={GraduationCap}
            title="Vous n'avez encore créé aucun cours."
            action={
              <Link to="/cours/nouveau">
                <Button size="sm">Créer mon premier cours</Button>
              </Link>
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.data?.map((c) => (
            <Link key={c.id} to={`/cours/${c.slug || c.id}`} className="flex gap-3 rounded-xl2 border border-line bg-surface p-3 hover:border-accent-blue/40">
              <img src={c.image} alt={c.title} className="h-20 w-28 flex-shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-text-hi">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-text-mid">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </DataState>
    </div>
  )
}

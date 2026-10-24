import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Plus } from 'lucide-react'
import { useCourses } from '../hooks/useCourses'
import { useAuth } from '../hooks/useAuth'
import { useAuthor } from '../hooks/useAuthor'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeleton'

function CourseCard({ course }) {
  const author = useAuthor(course.authorId)
  return (
    <Link
      to={`/cours/${course.slug || course.id}`}
      className="group flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface transition-all hover:border-accent-blue/40 hover:shadow-glow"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-surface-raised">
        <img src={course.image} alt={course.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="font-mono text-[11px] uppercase tracking-wide text-accent-blue">{course.level}</span>
        <h3 className="font-display text-base font-semibold text-text-hi">{course.title}</h3>
        <p className="text-sm text-text-mid line-clamp-2">{course.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-text-low">
          <span>{author ? `@${author.username}` : '···'}</span>
          <span>{course.studentsCount ?? 0} étudiants</span>
        </div>
      </div>
    </Link>
  )
}

export default function Courses() {
  const { isAuthenticated } = useAuth()
  const [query, setQuery] = useState('')
  const courses = useCourses({ q: query })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-hi">Cours</h1>
          <p className="mt-1 text-sm text-text-mid">Apprenez avec des cours créés par la communauté DevHub.</p>
        </div>
        <Link to={isAuthenticated ? '/cours/nouveau' : '/connexion'}>
          <Button icon={Plus}>Créer un cours</Button>
        </Link>
      </div>

      <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un cours..." className="max-w-lg" />

      <DataState
        loading={courses.loading}
        error={courses.error}
        onRetry={courses.refetch}
        isEmpty={!courses.loading && !courses.error && courses.data?.length === 0}
        skeleton={<CardSkeletonGrid count={4} />}
        empty={<EmptyState icon={GraduationCap} title="Aucun cours disponible pour le moment." />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.data?.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </DataState>
    </div>
  )
}

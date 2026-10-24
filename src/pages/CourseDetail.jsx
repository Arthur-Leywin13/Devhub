import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Circle, PlayCircle, FileText, Layers } from 'lucide-react'
import { useCourse, useCourseProgress } from '../hooks/useCourses'
import { useAuthor } from '../hooks/useAuthor'
import { useAuth } from '../hooks/useAuth'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'

const typeIcon = { VIDEO: PlayCircle, TEXT: FileText, VIDEO_TEXT: Layers }

export default function CourseDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const { data: course, loading, error, refetch } = useCourse(id)
  const { data: progress } = useCourseProgress(course?.id)
  const author = useAuthor(course?.authorId)

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (error?.status === 404) return <EmptyState title="Cours introuvable." />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!course) return null

  const completedIds = progress?.completedLessonIds || []

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="overflow-hidden rounded-xl2 border border-line">
        <img src={course.image} alt={course.title} className="aspect-video w-full object-cover" />
      </div>

      <div>
        <span className="font-mono text-xs uppercase tracking-wide text-accent-blue">{course.level}</span>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text-hi">{course.title}</h1>
        <p className="mt-2 text-sm text-text-mid">{course.description}</p>
        {author && (
          <Link to={`/profil/${author.username}`} className="mt-2 inline-block text-sm text-text-mid hover:text-accent-blue">
            Par @{author.username}
          </Link>
        )}
      </div>

      {isAuthenticated && progress && (
        <div className="rounded-xl2 border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-text-mid">Votre progression</span>
            <span className="font-mono text-accent-blue">{progress.percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div className="h-full rounded-full bg-accent-blue transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {course.sections.map((section, sIdx) => (
          <div key={section.id} className="rounded-xl2 border border-line bg-surface p-4">
            <h3 className="mb-3 font-display text-sm font-semibold text-text-hi">
              Section {sIdx + 1} — {section.title}
            </h3>
            <div className="flex flex-col gap-1">
              {section.lessons.map((lesson) => {
                const Icon = typeIcon[lesson.type] || FileText
                const done = completedIds.includes(lesson.id)
                return (
                  <Link
                    key={lesson.id}
                    to={`/cours/${course.slug || course.id}/lecon/${lesson.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-surface-raised"
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="flex-shrink-0 text-state-success" />
                    ) : (
                      <Circle size={16} className="flex-shrink-0 text-text-low" />
                    )}
                    <Icon size={15} className="flex-shrink-0 text-text-low" />
                    <span className={done ? 'text-text-mid line-through' : 'text-text-hi'}>{lesson.title}</span>
                    {lesson.durationMin && <span className="ml-auto text-xs text-text-low">{lesson.durationMin} min</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

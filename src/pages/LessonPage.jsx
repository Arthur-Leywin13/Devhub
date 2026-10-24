import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PlayCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useLesson, useCourseProgress } from '../hooks/useCourses'
import { coursesApi } from '../api/courses'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'

export default function LessonPage() {
  const { courseId, lessonId } = useParams()
  const { isAuthenticated } = useAuth()
  const { data: lesson, loading, error, refetch } = useLesson(courseId, lessonId)
  const { data: progress, refetch: refetchProgress } = useCourseProgress(courseId)
  const [completing, setCompleting] = useState(false)

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="aspect-video w-full" />
      </div>
    )
  }
  if (error?.status === 404) return <EmptyState title="Leçon introuvable." />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!lesson) return null

  const isDone = progress?.completedLessonIds?.includes(lesson.id)

  const markComplete = async () => {
    setCompleting(true)
    try {
      await coursesApi.completeLesson(courseId, lesson.id)
      refetchProgress()
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link to={`/cours/${courseId}`} className="flex w-fit items-center gap-1.5 text-sm text-text-mid hover:text-accent-blue">
        <ArrowLeft size={15} /> Retour au cours
      </Link>

      <h1 className="font-display text-2xl font-semibold text-text-hi">{lesson.title}</h1>

      {(lesson.type === 'VIDEO' || lesson.type === 'VIDEO_TEXT') && (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl2 border border-line bg-surface-raised text-text-low">
          {lesson.videoUrl ? (
            <video src={lesson.videoUrl} controls className="h-full w-full rounded-xl2" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <PlayCircle size={40} />
              <span className="text-xs">Vidéo à venir</span>
            </div>
          )}
        </div>
      )}

      {(lesson.type === 'TEXT' || lesson.type === 'VIDEO_TEXT') && lesson.content && (
        <p className="text-[15px] leading-relaxed text-text-hi">{lesson.content}</p>
      )}

      {isAuthenticated ? (
        <Button onClick={markComplete} disabled={isDone || completing} icon={CheckCircle2} className="w-fit">
          {isDone ? 'Leçon terminée' : completing ? 'Enregistrement...' : 'Marquer comme terminée'}
        </Button>
      ) : (
        <p className="text-sm text-text-low">
          <Link to="/connexion" className="text-accent-blue hover:underline">Connectez-vous</Link> pour suivre votre progression.
        </p>
      )}
    </div>
  )
}

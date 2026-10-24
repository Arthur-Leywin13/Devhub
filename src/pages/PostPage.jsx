import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePost } from '../hooks/usePosts'
import PostCard from '../components/PostCard'
import CommentSection from '../components/CommentSection'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'

// Page d'une publication : permet le partage par lien et le fil de commentaires.
export default function PostPage() {
  const { id } = useParams()
  const { data: post, loading, error, refetch } = usePost(id)
  const [commentCount, setCommentCount] = useState(null)

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }
  if (error?.status === 404) return <EmptyState title="Publication introuvable." description="Elle a peut-être été supprimée." />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!post) return null

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Link to="/fil" className="flex w-fit items-center gap-1.5 text-sm text-text-mid hover:text-accent-blue">
        <ArrowLeft size={15} /> Retour au fil
      </Link>
      <PostCard post={post} commentsCount={commentCount ?? post.commentsCount} />
      <CommentSection targetType="post" targetId={post.id} onCountChange={setCommentCount} />
    </div>
  )
}

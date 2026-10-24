import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { useProjects } from '../hooks/useProjects'
import { useArticles } from '../hooks/useArticles'
import { usersApi } from '../api/users'
import { messagesApi } from '../api/messages'
import ProjectCard from '../components/ProjectCard'
import ArticleCard from '../components/ArticleCard'
import Button from '../components/Button'
import Linkify from '../components/ui/Linkify'
import ReportButton from '../components/ReportButton'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { CardSkeletonGrid, Skeleton } from '../components/ui/Skeleton'

const tabs = ['Projets', 'Articles']

// Sert à la fois /profil/:username (public) et /mon-profil (privé, sans
// paramètre — on affiche alors l'utilisateur connecté).
export default function Profile() {
  const { username } = useParams()
  const [searchParams] = useSearchParams()
  const { user: currentUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [startingChat, setStartingChat] = useState(false)
  const initialTab = tabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'Projets'
  const [tab, setTab] = useState(initialTab)

  const viewingOwnProfile = !username
  const remoteProfile = useUserProfile(username)
  const user = viewingOwnProfile ? currentUser : remoteProfile.data
  const loading = viewingOwnProfile ? false : remoteProfile.loading
  const error = viewingOwnProfile ? null : remoteProfile.error

  const isMe = !!currentUser && !!user && currentUser.id === user.id

  const [following, setFollowing] = useState(false)
  const [followPending, setFollowPending] = useState(false)
  const [followersCount, setFollowersCount] = useState(user?.followersCount ?? 0)

  useEffect(() => {
    setFollowersCount(user?.followersCount ?? 0)
  }, [user?.followersCount])

  useEffect(() => {
    if (isAuthenticated && user && !isMe) {
      usersApi.isFollowing(user.id).then(setFollowing)
    }
  }, [isAuthenticated, user, isMe])

  const startConversation = async () => {
    if (!isAuthenticated || !user || startingChat) return
    setStartingChat(true)
    try {
      const conv = await messagesApi.getOrCreateConversation(user.id)
      navigate(`/messages/${conv.id}`)
    } finally {
      setStartingChat(false)
    }
  }

  const toggleFollow = async () => {
    if (!isAuthenticated || followPending || !user) return
    setFollowPending(true)
    const next = !following
    setFollowing(next)
    setFollowersCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
    try {
      await (next ? usersApi.follow(user.id) : usersApi.unfollow(user.id))
    } catch {
      setFollowing(!next)
      setFollowersCount((c) => (next ? Math.max(0, c - 1) : c + 1))
    } finally {
      setFollowPending(false)
    }
  }

  const projects = useProjects(user ? { authorId: user.id } : {})
  const articles = useArticles(user ? { authorId: user.id } : {})

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    )
  }
  if (error?.status === 404) return <EmptyState title="Profil introuvable." />
  if (error) return <ErrorState error={error} onRetry={remoteProfile.refetch} />
  if (!user) return <EmptyState title="Profil introuvable." />

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <img src={user.avatarUrl} alt={user.name} className="h-24 w-24 rounded-2xl object-cover" />
        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold text-text-hi">{user.name}</h1>
          <p className="text-sm text-text-low">@{user.username}</p>
          <p className="mt-2 max-w-md whitespace-pre-wrap break-words text-sm text-text-mid"><Linkify text={user.bio} /></p>
        </div>
        {isMe ? (
          <Button variant="secondary">Modifier le profil</Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant={following ? 'secondary' : 'primary'}
              onClick={toggleFollow}
              disabled={!isAuthenticated || followPending}
            >
              {following ? 'Suivi' : 'Suivre'}
            </Button>
            <Button variant="secondary" icon={MessageSquare} onClick={startConversation} disabled={!isAuthenticated || startingChat}>
              Message
            </Button>
            <ReportButton targetType="user" targetId={user.id} authorId={user.id} label="Signaler" className="px-2" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-xl2 border border-line bg-surface p-4 text-center">
        <Stat label="Projets" value={projects.data?.length ?? '···'} />
        <Stat label="Articles" value={articles.data?.length ?? '···'} />
        <Stat label="Abonnés" value={followersCount} />
        <Stat label="Abonnements" value={user.followingCount} />
      </div>

      <div className="flex gap-2 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'border-b-2 border-accent-blue text-text-hi' : 'text-text-mid hover:text-text-hi'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Projets' && (
        <DataState
          loading={projects.loading}
          error={projects.error}
          onRetry={projects.refetch}
          isEmpty={!projects.loading && !projects.error && projects.data?.length === 0}
          skeleton={<CardSkeletonGrid count={2} />}
          empty={<EmptyState title="Aucun projet publié pour le moment." />}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.data?.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </DataState>
      )}
      {tab === 'Articles' && (
        <DataState
          loading={articles.loading}
          error={articles.error}
          onRetry={articles.refetch}
          isEmpty={!articles.loading && !articles.error && articles.data?.length === 0}
          skeleton={<CardSkeletonGrid count={2} />}
          empty={<EmptyState title="Aucun article publié pour le moment." />}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {articles.data?.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        </DataState>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold text-text-hi">{value}</p>
      <p className="text-xs text-text-low">{label}</p>
    </div>
  )
}

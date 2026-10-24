import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'
import { usersApi } from '../api/users'
import { useAuth } from '../hooks/useAuth'

export default function UserCard({ user, compact = false }) {
  const { isAuthenticated, user: currentUser } = useAuth()
  const [following, setFollowing] = useState(false)
  const [pending, setPending] = useState(false)
  const isSelf = currentUser?.id === user.id

  useEffect(() => {
    if (isAuthenticated && !isSelf) {
      usersApi.isFollowing(user.id).then(setFollowing)
    }
  }, [isAuthenticated, isSelf, user.id])

  const toggleFollow = async () => {
    if (!isAuthenticated || pending) return
    setPending(true)
    const next = !following
    setFollowing(next)
    try {
      await (next ? usersApi.follow(user.id) : usersApi.unfollow(user.id))
    } catch {
      setFollowing(!next)
    } finally {
      setPending(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-raised">
        <Link to={`/profil/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
          <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-hi">{user.name}</p>
            <p className="truncate text-xs text-text-low">@{user.username}</p>
          </div>
        </Link>
        {!isSelf && (
          <Button variant="secondary" size="sm" onClick={toggleFollow} disabled={!isAuthenticated}>
            {following ? 'Suivi' : 'Suivre'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-line bg-surface p-5 text-center">
      <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
      <div>
        <Link to={`/profil/${user.username}`} className="font-display text-sm font-semibold text-text-hi hover:text-accent-blue">
          {user.name}
        </Link>
        <p className="text-xs text-text-low">@{user.username}</p>
      </div>
      <p className="text-xs text-text-mid line-clamp-2">{user.bio}</p>
      {!isSelf && (
        <Button variant="secondary" size="sm" className="w-full" onClick={toggleFollow} disabled={!isAuthenticated}>
          {following ? 'Suivi' : 'Suivre'}
        </Button>
      )}
    </div>
  )
}

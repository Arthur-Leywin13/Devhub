import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageSquare, MessageSquarePlus, Search, Users, Loader2, ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAuthor } from '../hooks/useAuthor'
import { usersApi } from '../api/users'
import { messagesApi } from '../api/messages'
import { useConversations } from '../hooks/useMessages'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { ListRowSkeleton } from '../components/ui/Skeleton'
import { timeAgo } from '../lib/timeAgo'

function ConversationRow({ conversation, currentUserId }) {
  const otherId = conversation.participantIds.find((id) => id !== currentUserId)
  const other = useAuthor(otherId)
  const deleted = !!conversation.lastMessage?.deletedAt

  return (
    <Link
      to={`/messages/${conversation.id}`}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-surface-raised"
    >
      <img src={other?.avatarUrl} alt="" className="h-11 w-11 flex-shrink-0 rounded-full bg-surface-raised object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-text-hi">{other ? `@${other.username}` : 'Utilisateur'}</p>
          {conversation.lastMessage && <span className="flex-shrink-0 text-xs text-text-low">{timeAgo(conversation.lastMessage.createdAt)}</span>}
        </div>
        <p className={`truncate text-sm ${deleted ? 'italic text-text-low' : 'text-text-mid'}`}>
          {deleted ? 'Message supprimé' : conversation.lastMessage?.text || 'Démarrer la conversation'}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-blue px-1.5 text-[10px] font-semibold text-white">
          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
        </span>
      )}
    </Link>
  )
}

function PersonRow({ person, onMessage, busy }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
      <Link to={`/profil/${person.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <img src={person.avatarUrl} alt="" className="h-11 w-11 flex-shrink-0 rounded-full bg-surface-raised object-cover" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-text-hi">{person.name || person.username}</span>
          <span className="block truncate text-xs text-text-low">@{person.username}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onMessage(person)}
        disabled={busy}
        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
        Écrire
      </button>
    </div>
  )
}

export default function Messages() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: conversations, loading, error, refetch } = useConversations()
  const [people, setPeople] = useState([])
  const [peopleLoading, setPeopleLoading] = useState(true)
  const [peopleError, setPeopleError] = useState('')
  const [query, setQuery] = useState('')
  const [startingId, setStartingId] = useState(null)

  useEffect(() => {
    let active = true
    usersApi.getSuggested(50, currentUser?.id)
      .then((items) => { if (active) setPeople(items || []) })
      .catch((err) => { if (active) setPeopleError(err.message || 'Impossible de charger les utilisateurs.') })
      .finally(() => { if (active) setPeopleLoading(false) })
    return () => { active = false }
  }, [currentUser?.id])

  const filteredPeople = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return people
    return people.filter((person) =>
      [person.name, person.username, person.bio].filter(Boolean).some((value) => value.toLowerCase().includes(term))
    )
  }, [people, query])

  const startConversation = async (person) => {
    if (startingId) return
    setStartingId(person.id)
    try {
      const conversation = await messagesApi.getOrCreateConversation(person.id)
      navigate(`/messages/${conversation.id}`)
    } catch (err) {
      setPeopleError(err.message || 'La conversation ne peut pas être ouverte.')
    } finally {
      setStartingId(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <MessageSquare className="text-accent-blue" size={22} />
          <h1 className="font-display text-2xl font-semibold text-text-hi">Messagerie</h1>
        </div>
        <p className="mt-1 text-sm text-text-mid">Retrouvez vos discussions ou commencez à écrire à la communauté.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-hi">
              <MessageSquare size={16} /> Conversations
            </h2>
            <span className="text-xs text-text-low">{conversations?.length || 0}</span>
          </div>
          <DataState
            loading={loading}
            error={error}
            onRetry={refetch}
            isEmpty={!loading && !error && conversations?.length === 0}
            skeleton={<div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <ListRowSkeleton key={i} />)}</div>}
            empty={<EmptyState icon={MessageSquare} title="Pas encore de conversation" description="Choisissez une personne dans la liste pour commencer à discuter." />}
          >
            <div className="flex flex-col gap-1 rounded-xl2 border border-line bg-surface p-2">
              {conversations?.map((conversation) => (
                <ConversationRow key={conversation.id} conversation={conversation} currentUserId={currentUser?.id} />
              ))}
            </div>
          </DataState>
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-hi">
              <Users size={16} /> Découvrir des personnes
            </h2>
            <span className="text-xs text-text-low">{filteredPeople.length} résultat(s)</span>
          </div>
          <label className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
            <Search size={17} className="flex-shrink-0 text-text-low" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un nom ou un pseudo..."
              className="min-w-0 flex-1 bg-transparent text-sm text-text-hi outline-none placeholder:text-text-low"
            />
          </label>

          {peopleLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <ListRowSkeleton key={i} />)}</div>
          ) : peopleError ? (
            <div className="rounded-xl border border-line bg-surface p-4 text-sm text-text-mid">
              <p>{peopleError}</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-2 text-accent-blue">Réessayer</button>
            </div>
          ) : filteredPeople.length ? (
            <div className="flex flex-col gap-2">
              {filteredPeople.map((person) => (
                <PersonRow key={person.id} person={person} onMessage={startConversation} busy={startingId === person.id} />
              ))}
            </div>
          ) : (
            <EmptyState icon={query ? Search : Users} title={query ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur à afficher'} description={query ? 'Essayez un autre nom ou pseudo.' : 'Les nouveaux membres apparaîtront ici.'} />
          )}
          <Link to="/explorer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline">
            Explorer la communauté <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>
    </div>
  )
}

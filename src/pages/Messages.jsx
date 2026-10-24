import { Link } from 'react-router-dom'
import { MessageSquare, Image as ImageIcon, Mic, Video } from 'lucide-react'
import { useConversations } from '../hooks/useMessages'
import { useAuth } from '../hooks/useAuth'
import { useAuthor } from '../hooks/useAuthor'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { ListRowSkeleton } from '../components/ui/Skeleton'
import { timeAgo } from '../lib/timeAgo'

function attachmentPreviewLabel(attachments) {
  if (!attachments || attachments.length === 0) return null
  const { type } = attachments[0]
  if (type === 'image') return { Icon: ImageIcon, label: 'Photo' }
  if (type === 'audio') return { Icon: Mic, label: 'Audio' }
  if (type === 'video') return { Icon: Video, label: 'Vidéo' }
  return null
}

function ConversationRow({ conversation }) {
  const { user: currentUser } = useAuth()
  const otherId = conversation.participantIds.find((id) => id !== currentUser.id)
  const other = useAuthor(otherId)
  const lastDeleted = !!conversation.lastMessage?.deletedAt
  const attachmentInfo = lastDeleted ? null : attachmentPreviewLabel(conversation.lastMessage?.attachments)

  return (
    <Link
      to={`/messages/${conversation.id}`}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-surface-raised"
    >
      <img src={other?.avatarUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-full bg-surface-raised object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-text-hi">{other ? `@${other.username}` : '···'}</p>
          {conversation.lastMessage && (
            <span className="flex-shrink-0 text-xs text-text-low">{timeAgo(conversation.lastMessage.createdAt)}</span>
          )}
        </div>
        <p className={`truncate text-sm text-text-mid ${lastDeleted ? 'italic text-text-low' : ''}`}>
          {attachmentInfo && (
            <span className="mr-1 inline-flex items-center gap-1 align-middle">
              <attachmentInfo.Icon size={12} /> {attachmentInfo.label}
            </span>
          )}
          {lastDeleted ? 'Message supprimé' : conversation.lastMessage?.text || (attachmentInfo ? '' : 'Démarrer la conversation')}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-blue px-1.5 text-[10px] font-semibold text-white">
          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
        </span>
      )}
    </Link>
  )
}

export default function Messages() {
  const { data: conversations, loading, error, refetch } = useConversations()

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Messages</h1>
        <p className="mt-1 text-sm text-text-mid">Vos conversations privées sur DevHub.</p>
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!loading && !error && conversations?.length === 0}
        skeleton={
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => <ListRowSkeleton key={i} />)}
          </div>
        }
        empty={
          <EmptyState
            icon={MessageSquare}
            title="Aucune conversation pour le moment."
            description="Démarrez une discussion depuis le profil d'un autre utilisateur."
          />
        }
      >
        <div className="flex flex-col gap-1 rounded-xl2 border border-line bg-surface p-2">
          {conversations?.map((c) => <ConversationRow key={c.id} conversation={c} />)}
        </div>
      </DataState>
    </div>
  )
}

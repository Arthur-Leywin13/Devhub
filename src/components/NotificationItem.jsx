import { useState } from 'react'
import { Heart, MessageCircle, UserPlus, AtSign, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useAuthor } from '../hooks/useAuthor'
import { notificationsApi } from '../api/notifications'
import { timeAgo } from '../lib/timeAgo'

const icons = {
  like: { Icon: Heart, color: 'text-state-danger' },
  comment: { Icon: MessageCircle, color: 'text-accent-blue' },
  follow: { Icon: UserPlus, color: 'text-state-success' },
  mention: { Icon: AtSign, color: 'text-accent-blue' },
  warning: { Icon: ShieldAlert, color: 'text-state-warning' },
  suspension: { Icon: ShieldAlert, color: 'text-state-danger' },
  restore: { Icon: ShieldCheck, color: 'text-state-success' },
}

const defaultTexts = {
  like: 'a aimé',
  comment: 'a commenté',
  follow: 'vous suit désormais',
  mention: 'vous a mentionné',
  warning: 'vous a envoyé un avertissement',
  suspension: 'a suspendu votre compte',
  restore: 'a rétabli votre compte',
}

// Les notifications de modération n'exposent jamais l'identité du modérateur.
const MODERATION_TYPES = ['warning', 'suspension', 'restore']

export default function NotificationItem({ notification, onRead }) {
  const isModeration = MODERATION_TYPES.includes(notification.type)
  const actor = useAuthor(isModeration ? null : notification.actorId)
  const { Icon, color } = icons[notification.type] || icons.comment
  const text = notification.text || defaultTexts[notification.type] || ''
  const [marking, setMarking] = useState(false)

  const handleClick = async () => {
    if (notification.read || marking) return
    setMarking(true)
    try {
      await notificationsApi.markAsRead(notification.id)
      onRead?.(notification.id)
    } finally {
      setMarking(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface-raised ${!notification.read ? 'bg-surface-raised/60' : ''}`}
    >
      <div className="relative flex-shrink-0">
        {isModeration ? (
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised ${color}`}>
            <Icon size={18} />
          </div>
        ) : (
          <>
            <img src={actor?.avatarUrl} alt="" className="h-10 w-10 rounded-full bg-surface-raised object-cover" />
            <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface ${color}`}>
              <Icon size={11} />
            </span>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-hi">
          <span className="font-medium">{isModeration ? 'La modération DevHub' : `@${actor?.username || '···'}`}</span> {text}
          {notification.targetLabel && (
            <span className="text-text-mid">{isModeration ? ` — ${notification.targetLabel}` : ` « ${notification.targetLabel} »`}</span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-text-low">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent-blue" />}
    </button>
  )
}

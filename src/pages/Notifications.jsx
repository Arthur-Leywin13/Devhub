import { Bell } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { notificationsApi } from '../api/notifications'
import NotificationItem from '../components/NotificationItem'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { ListRowSkeleton } from '../components/ui/Skeleton'

export default function Notifications() {
  const { data: notifications, loading, error, refetch, setData } = useNotifications()

  const markAllRead = async () => {
    await notificationsApi.markAllAsRead()
    setData(notifications.map((n) => ({ ...n, read: true })))
  }

  const markOneRead = (id) => {
    setData(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text-hi">Notifications</h1>
        {notifications?.length > 0 && (
          <button onClick={markAllRead} className="text-sm text-accent-blue hover:underline">
            Tout marquer comme lu
          </button>
        )}
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!loading && !error && notifications?.length === 0}
        skeleton={
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => <ListRowSkeleton key={i} />)}
          </div>
        }
        empty={<EmptyState icon={Bell} title="Aucune notification pour le moment." />}
      >
        <div className="flex flex-col gap-1 rounded-xl2 border border-line bg-surface p-2">
          {notifications?.map((n) => <NotificationItem key={n.id} notification={n} onRead={markOneRead} />)}
        </div>
      </DataState>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useAdminUsers } from '../../hooks/useAdmin'
import { ROLE_LABELS } from '../../lib/permissions'
import { STATUS_LABELS } from '../../lib/moderation'
import { timeAgo } from '../../lib/timeAgo'
import SearchBar from '../../components/SearchBar'
import StatusBadge from '../../components/admin/StatusBadge'
import RoleBadge from '../../components/admin/RoleBadge'
import DataState from '../../components/ui/DataState'
import EmptyState from '../../components/ui/EmptyState'
import { ListRowSkeleton } from '../../components/ui/Skeleton'

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  const users = useAdminUsers({ q: debouncedQ, status, role })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Utilisateurs</h1>
        <p className="mt-1 text-sm text-text-mid">Recherchez un compte pour consulter son historique et agir.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou @pseudo..." className="min-w-0 flex-1 sm:max-w-xs" />
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filtrer par rôle">
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>

      <DataState
        loading={users.loading && !users.data}
        error={users.error}
        onRetry={users.refetch}
        isEmpty={!users.loading && !users.error && users.data?.length === 0}
        skeleton={<div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <ListRowSkeleton key={i} />)}</div>}
        empty={<EmptyState icon={Users} title="Aucun utilisateur ne correspond à ces critères." />}
      >
        <div className="flex flex-col gap-2">
          {users.data?.map((u) => (
            <Link
              key={u.id}
              to={`/admin/utilisateurs/${u.id}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-accent-blue/40"
            >
              <img src={u.avatarUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-full bg-surface-raised object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-hi">{u.name}</p>
                <p className="truncate text-xs text-text-low">@{u.username} · inscrit {timeAgo(u.createdAt)}</p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                {u.warningsCount > 0 && <span className="text-xs text-state-warning">{u.warningsCount} avert.</span>}
                <RoleBadge role={u.role} />
                <StatusBadge status={u.status} />
              </div>
            </Link>
          ))}
        </div>
      </DataState>
    </div>
  )
}

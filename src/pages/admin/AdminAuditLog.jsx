import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { useAuditLog } from '../../hooks/useAdmin'
import { AUDIT_LABELS, TARGET_LABELS } from '../../lib/moderation'
import { formatDateTime } from '../../lib/timeAgo'
import DataState from '../../components/ui/DataState'
import EmptyState from '../../components/ui/EmptyState'
import { ListRowSkeleton } from '../../components/ui/Skeleton'

export default function AdminAuditLog() {
  const [action, setAction] = useState('')
  const log = useAuditLog({ action })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Journal d'audit</h1>
        <p className="mt-1 text-sm text-text-mid">Historique de toutes les actions de modération : qui, quoi, quand et pourquoi.</p>
      </div>

      <select className="input w-auto max-w-full" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filtrer par type d'action">
        <option value="">Toutes les actions</option>
        {Object.entries(AUDIT_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>

      <DataState
        loading={log.loading && !log.data}
        error={log.error}
        onRetry={log.refetch}
        isEmpty={!log.loading && !log.error && log.data?.length === 0}
        skeleton={<div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <ListRowSkeleton key={i} />)}</div>}
        empty={<EmptyState icon={ScrollText} title="Aucune action enregistrée." />}
      >
        <div className="flex flex-col gap-2">
          {log.data?.map((a) => (
            <div key={a.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-text-hi">
                  <span className="font-medium">{AUDIT_LABELS[a.action] || a.action}</span>
                  {a.targetUser && (
                    <> — <Link to={`/admin/utilisateurs/${a.targetUser.id}`} className="text-accent-blue hover:underline">@{a.targetUser.username}</Link></>
                  )}
                  {a.targetType && a.targetType !== 'user' && a.targetType !== 'report' && (
                    <span className="text-text-low"> ({TARGET_LABELS[a.targetType] || a.targetType})</span>
                  )}
                </p>
                <span className="text-xs text-text-low">{formatDateTime(a.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-xs text-text-low">par @{a.actor?.username || '···'}</p>
              {a.reason && <p className="mt-1 whitespace-pre-wrap break-words text-text-mid">{a.reason}</p>}
            </div>
          ))}
        </div>
      </DataState>
    </div>
  )
}

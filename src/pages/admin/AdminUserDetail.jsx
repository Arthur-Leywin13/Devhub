import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Clock, Ban, UserCheck, ExternalLink } from 'lucide-react'
import { useAdminUser } from '../../hooks/useAdmin'
import { adminApi } from '../../api/admin'
import { useAuth } from '../../hooks/useAuth'
import { canSanction, canBan, canRestore, canChangeRole, ROLE_LABELS } from '../../lib/permissions'
import { AUDIT_LABELS } from '../../lib/moderation'
import { formatDateTime } from '../../lib/timeAgo'
import Button from '../../components/Button'
import StatusBadge from '../../components/admin/StatusBadge'
import RoleBadge from '../../components/admin/RoleBadge'
import SanctionDialog from '../../components/admin/SanctionDialog'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AdminUserDetail() {
  const { id } = useParams()
  const { user: actor } = useAuth()
  const { data, loading, error, refetch } = useAdminUser(id)
  const [dialog, setDialog] = useState(null) // 'warn' | 'suspend' | 'ban' | 'restore' | null
  const [pendingRole, setPendingRole] = useState(null)

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (error?.status === 404) return <EmptyState title="Utilisateur introuvable." />
  if (error && !data) return <ErrorState error={error} onRetry={refetch} />
  if (!data) return null

  const { user: u, warnings, sanctions, contentCounts } = data
  const mayWarn = canSanction(actor, u) && u.status !== 'banned'
  const maySuspend = canSanction(actor, u) && u.status !== 'banned'
  const mayBan = canBan(actor, u) && u.status !== 'banned'
  const mayRestore = u.status !== 'active' && canRestore(actor, u)
  const anyAction = mayWarn || maySuspend || mayBan || mayRestore

  const handlers = {
    warn: ({ reason }) => adminApi.warnUser(id, { reason }),
    suspend: ({ reason, durationDays }) => adminApi.suspendUser(id, { reason, durationDays }),
    ban: ({ reason }) => adminApi.banUser(id, { reason }),
    restore: ({ reason }) => adminApi.restoreUser(id, { reason }),
  }
  const submitDialog = async (payload) => {
    await handlers[dialog](payload)
    refetch()
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/utilisateurs" className="flex w-fit items-center gap-1.5 text-sm text-text-mid hover:text-accent-blue">
        <ArrowLeft size={15} /> Retour aux utilisateurs
      </Link>

      <div className="flex flex-col gap-4 rounded-xl2 border border-line bg-surface p-5 sm:flex-row sm:items-center">
        <img src={u.avatarUrl} alt="" className="h-16 w-16 flex-shrink-0 rounded-2xl bg-surface-raised object-cover" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-semibold text-text-hi">{u.name}</h1>
          <p className="text-sm text-text-low">@{u.username}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={u.role} />
            <StatusBadge status={u.status} />
          </div>
        </div>
        <Link to={`/profil/${u.username}`} className="flex items-center gap-1.5 text-sm text-text-mid hover:text-accent-blue">
          <ExternalLink size={14} /> Profil public
        </Link>
      </div>

      {u.status !== 'active' && (
        <div className={`rounded-xl border p-4 text-sm ${u.status === 'banned' ? 'border-state-danger/40 bg-state-danger/10' : 'border-state-warning/40 bg-state-warning/10'}`}>
          <p className="font-medium text-text-hi">
            {u.status === 'banned' ? 'Compte banni' : `Compte suspendu jusqu'au ${formatDateTime(u.suspendedUntil)}`}
          </p>
          {u.statusReason && <p className="mt-1 text-text-mid">Motif : {u.statusReason}</p>}
        </div>
      )}

      <section className="rounded-xl2 border border-line bg-surface p-5">
        <h2 className="mb-3 font-display text-sm font-semibold text-text-hi">Actions de modération</h2>
        <div className="flex flex-wrap gap-2">
          {mayWarn && <Button variant="secondary" icon={AlertTriangle} onClick={() => setDialog('warn')}>Avertir</Button>}
          {maySuspend && <Button variant="secondary" icon={Clock} onClick={() => setDialog('suspend')}>Suspendre</Button>}
          {mayBan && <Button variant="danger" icon={Ban} onClick={() => setDialog('ban')}>Bannir</Button>}
          {mayRestore && <Button icon={UserCheck} onClick={() => setDialog('restore')}>Rétablir</Button>}
        </div>
        {!anyAction && (
          <p className="text-sm text-text-low">
            Aucune action possible : vous ne pouvez pas sanctionner votre propre compte, ni un compte de rang égal ou supérieur au vôtre.
          </p>
        )}
        {u.status !== 'banned' && canSanction(actor, u) && !mayBan && (
          <p className="mt-3 text-xs text-text-low">Seuls les administrateurs peuvent bannir un compte.</p>
        )}

        {canChangeRole(actor, u) && (
          <label className="mt-5 flex flex-col gap-1.5 border-t border-line pt-4 text-sm text-text-mid sm:max-w-xs">
            Rôle du compte
            <select className="input" value={u.role} onChange={(e) => e.target.value !== u.role && setPendingRole(e.target.value)}>
              {Object.entries(ROLE_LABELS).map(([rid, label]) => <option key={rid} value={rid}>{label}</option>)}
            </select>
          </label>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ['Email', u.email],
          ['Inscrit le', formatDateTime(u.createdAt)],
          ['Abonnés', u.followersCount],
          ['Projets', contentCounts.projects],
          ['Articles', contentCounts.articles],
          ['Publications', contentCounts.posts],
          ['Commentaires', contentCounts.comments],
          ['Cours', contentCounts.courses],
          ['Avertissements', u.warningsCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-3">
            <p className="text-xs text-text-low">{label}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-text-hi">{value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-text-hi">Avertissements ({warnings.length})</h2>
        {warnings.length === 0 ? (
          <p className="text-sm text-text-low">Aucun avertissement.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {warnings.map((w) => (
              <div key={w.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
                <p className="whitespace-pre-wrap break-words text-text-hi">{w.reason}</p>
                <p className="mt-1 text-xs text-text-low">
                  {formatDateTime(w.createdAt)} · par @{w.moderator?.username || '···'} ·{' '}
                  {w.acknowledgedAt ? `lu le ${formatDateTime(w.acknowledgedAt)}` : 'pas encore lu'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-text-hi">Historique des actions ({sanctions.length})</h2>
        {sanctions.length === 0 ? (
          <p className="text-sm text-text-low">Aucune action enregistrée sur ce compte.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sanctions.map((a) => (
              <div key={a.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
                <p className="text-text-hi"><span className="font-medium">{AUDIT_LABELS[a.action] || a.action}</span> — par @{a.actor?.username || '···'}</p>
                {a.reason && <p className="mt-0.5 whitespace-pre-wrap break-words text-text-mid">{a.reason}</p>}
                <p className="mt-1 text-xs text-text-low">{formatDateTime(a.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <SanctionDialog open={!!dialog} kind={dialog} user={u} onClose={() => setDialog(null)} onSubmit={submitDialog} />

      <ConfirmDialog
        open={!!pendingRole}
        title="Changer le rôle"
        message={`Passer @${u.username} au rôle « ${ROLE_LABELS[pendingRole] || ''} » ? ${
          pendingRole === 'admin' || pendingRole === 'moderator' ? "Ce compte aura accès à l'espace d'administration." : ''
        }`}
        confirmLabel="Changer le rôle"
        onConfirm={async () => {
          await adminApi.setRole(id, pendingRole)
          refetch()
        }}
        onClose={() => setPendingRole(null)}
      />
    </div>
  )
}

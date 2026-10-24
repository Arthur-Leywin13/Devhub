import { Link } from 'react-router-dom'
import { Users, UserX, Clock, Flag, AlertTriangle, Files } from 'lucide-react'
import { useAdminStats, useAdminReports, useAuditLog } from '../../hooks/useAdmin'
import { reasonLabel, TARGET_LABELS, AUDIT_LABELS } from '../../lib/moderation'
import { timeAgo } from '../../lib/timeAgo'
import DataState from '../../components/ui/DataState'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton, ListRowSkeleton } from '../../components/ui/Skeleton'

function StatCard({ icon: Icon, label, value, hint, to, tone = 'text-accent-blue' }) {
  const body = (
    <div className="flex h-full flex-col gap-2 rounded-xl2 border border-line bg-surface p-4 transition-colors hover:border-accent-blue/40">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-mid">{label}</span>
        <Icon size={16} className={tone} />
      </div>
      <p className="font-display text-2xl font-semibold text-text-hi">{value}</p>
      {hint && <p className="text-xs text-text-low">{hint}</p>}
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export default function AdminDashboard() {
  const stats = useAdminStats()
  const reports = useAdminReports('open')
  const audit = useAuditLog({})
  const s = stats.data

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Tableau de bord</h1>
        <p className="mt-1 text-sm text-text-mid">Vue d'ensemble de la communauté et de la modération.</p>
      </div>

      <DataState
        loading={stats.loading}
        error={stats.error}
        onRetry={stats.refetch}
        isEmpty={false}
        skeleton={
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        }
      >
        {s && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard icon={Users} label="Utilisateurs" value={s.users.total} hint={`+${s.users.newLast7Days} sur 7 jours`} to="/admin/utilisateurs" />
            <StatCard icon={Clock} label="Comptes suspendus" value={s.users.suspended} tone="text-state-warning" to="/admin/utilisateurs" />
            <StatCard icon={UserX} label="Comptes bannis" value={s.users.banned} tone="text-state-danger" to="/admin/utilisateurs" />
            <StatCard icon={Flag} label="Signalements ouverts" value={s.reports.open} tone="text-state-danger" to="/admin/signalements" />
            <StatCard icon={AlertTriangle} label="Avertissements (30 j)" value={s.warningsLast30Days} tone="text-state-warning" />
            <StatCard
              icon={Files}
              label="Contenus publiés"
              value={s.content.projects + s.content.articles + s.content.posts + s.content.courses}
              hint={`${s.content.projects} projets · ${s.content.articles} articles · ${s.content.posts} posts · ${s.content.courses} cours`}
              to="/admin/contenus"
            />
          </div>
        )}
      </DataState>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-hi">Signalements à traiter</h2>
          <Link to="/admin/signalements" className="text-sm text-text-mid hover:text-accent-blue">Tout voir</Link>
        </div>
        <DataState
          loading={reports.loading}
          error={reports.error}
          onRetry={reports.refetch}
          isEmpty={!reports.loading && !reports.error && reports.data?.length === 0}
          skeleton={<ListRowSkeleton />}
          empty={<EmptyState icon={Flag} title="Aucun signalement en attente." />}
        >
          <div className="flex flex-col gap-2">
            {reports.data?.slice(0, 5).map((r) => (
              <Link key={r.id} to="/admin/signalements" className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-accent-blue/40">
                <Flag size={16} className="flex-shrink-0 text-state-danger" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-hi">{reasonLabel(r.reason)} — {TARGET_LABELS[r.targetType]} : {r.target.label}</p>
                  <p className="text-xs text-text-low">Signalé par @{r.reporter?.username || '···'} · {timeAgo(r.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </DataState>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-hi">Dernières actions</h2>
          <Link to="/admin/journal" className="text-sm text-text-mid hover:text-accent-blue">Journal complet</Link>
        </div>
        <DataState
          loading={audit.loading}
          error={audit.error}
          onRetry={audit.refetch}
          isEmpty={!audit.loading && !audit.error && audit.data?.length === 0}
          skeleton={<ListRowSkeleton />}
          empty={<EmptyState title="Aucune action de modération enregistrée." />}
        >
          <div className="flex flex-col gap-2">
            {audit.data?.slice(0, 6).map((a) => (
              <div key={a.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
                <p className="text-text-hi">
                  <span className="font-medium">{AUDIT_LABELS[a.action] || a.action}</span>
                  {a.targetUser && <> — @{a.targetUser.username}</>}
                </p>
                <p className="text-xs text-text-low">par @{a.actor?.username || '···'} · {timeAgo(a.createdAt)}</p>
              </div>
            ))}
          </div>
        </DataState>
      </section>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, ExternalLink } from 'lucide-react'
import { useAdminReports } from '../../hooks/useAdmin'
import { adminApi } from '../../api/admin'
import { useAuth } from '../../hooks/useAuth'
import { canSanction, canBan } from '../../lib/permissions'
import { reasonLabel, TARGET_LABELS, SUSPENSION_DURATIONS, MIN_REASON_LENGTH, MAX_REASON_LENGTH } from '../../lib/moderation'
import { formatDateTime } from '../../lib/timeAgo'
import Button from '../../components/Button'
import StatusBadge from '../../components/admin/StatusBadge'
import RoleBadge from '../../components/admin/RoleBadge'
import DataState from '../../components/ui/DataState'
import EmptyState from '../../components/ui/EmptyState'
import { ListRowSkeleton } from '../../components/ui/Skeleton'

const TABS = [
  { id: 'open', label: 'Ouverts' },
  { id: 'resolved', label: 'Traités' },
  { id: 'dismissed', label: 'Rejetés' },
]
const RESOLUTION_LABELS = {
  none: 'Clos sans action',
  delete_content: 'Contenu supprimé',
  warn: 'Auteur averti',
  suspend: 'Auteur suspendu',
  ban: 'Auteur banni',
}

function ReportCard({ report, actor, onChanged }) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState('none')
  const [durationDays, setDurationDays] = useState(7)
  const [alsoDelete, setAlsoDelete] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const { target, targetAuthor } = report
  const deletable = report.targetType !== 'user' && !target.missing
  const mayWarn = !!targetAuthor && canSanction(actor, targetAuthor) && targetAuthor.status !== 'banned'
  const mayBan = !!targetAuthor && canBan(actor, targetAuthor) && targetAuthor.status !== 'banned'
  const isOpen = report.status === 'open'

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      onChanged()
    } catch (err) {
      setError(err.message || 'Action impossible, réessayez.')
    } finally {
      setBusy(false)
    }
  }

  const apply = (e) => {
    e.preventDefault()
    if (note.trim().length < MIN_REASON_LENGTH) {
      setError(`La note doit contenir au moins ${MIN_REASON_LENGTH} caractères.`)
      return
    }
    run(() =>
      adminApi.resolveReport(report.id, {
        action,
        reason: note.trim(),
        durationDays,
        deleteContent: alsoDelete && ['warn', 'suspend', 'ban'].includes(action),
      })
    )
  }

  return (
    <div className="rounded-xl2 border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-state-danger/10 px-2 py-0.5 font-medium text-state-danger">{reasonLabel(report.reason)}</span>
        <span className="text-text-mid">{TARGET_LABELS[report.targetType]}</span>
        <span className="text-text-low">· {formatDateTime(report.createdAt)}</span>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-text-hi">{target.label}</p>
        {target.excerpt && <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm text-text-mid">{target.excerpt}</p>}
        {target.link && (
          <Link to={target.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-accent-blue hover:underline">
            <ExternalLink size={12} /> Voir le contenu
          </Link>
        )}
      </div>

      {report.details && (
        <p className="mt-3 rounded-lg bg-surface-raised px-3 py-2 text-sm text-text-mid">« {report.details} »</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-low">
        <span>Signalé par @{report.reporter?.username || '···'}</span>
        {targetAuthor && (
          <span className="flex items-center gap-1.5">
            Auteur : <Link to={`/admin/utilisateurs/${targetAuthor.id}`} className="text-text-mid hover:text-accent-blue">@{targetAuthor.username}</Link>
            <RoleBadge role={targetAuthor.role} /> <StatusBadge status={targetAuthor.status} />
          </span>
        )}
      </div>

      {!isOpen && (
        <p className="mt-3 border-t border-line pt-3 text-xs text-text-mid">
          {report.status === 'dismissed' ? 'Rejeté' : RESOLUTION_LABELS[report.resolution] || 'Traité'} par @{report.resolver?.username || '···'} le {formatDateTime(report.resolvedAt)}
          {report.note ? ` — ${report.note}` : ''}
        </p>
      )}

      {isOpen && !open && (
        <div className="mt-4">
          <Button size="sm" onClick={() => setOpen(true)}>Traiter</Button>
        </div>
      )}

      {isOpen && open && (
        <form onSubmit={apply} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <label className="flex flex-col gap-1.5 text-sm text-text-mid">
            Décision
            <select className="input" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="none">Aucune action (clore le signalement)</option>
              {deletable && <option value="delete_content">Supprimer le contenu</option>}
              {mayWarn && <option value="warn">Avertir l'auteur</option>}
              {mayWarn && <option value="suspend">Suspendre l'auteur</option>}
              {mayBan && <option value="ban">Bannir l'auteur</option>}
            </select>
          </label>

          {action === 'suspend' && (
            <label className="flex flex-col gap-1.5 text-sm text-text-mid">
              Durée de la suspension
              <select className="input" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))}>
                {SUSPENSION_DURATIONS.map((d) => <option key={d} value={d}>{d} jour{d > 1 ? 's' : ''}</option>)}
              </select>
            </label>
          )}

          {['warn', 'suspend', 'ban'].includes(action) && deletable && (
            <label className="flex items-center gap-2 text-sm text-text-mid">
              <input type="checkbox" checked={alsoDelete} onChange={(e) => setAlsoDelete(e.target.checked)} className="h-4 w-4 accent-accent-blue" />
              Supprimer aussi le contenu signalé
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm text-text-mid">
            Motif / note (obligatoire, conservé dans le journal)
            <textarea required rows={3} maxLength={MAX_REASON_LENGTH} value={note} onChange={(e) => setNote(e.target.value)} className="input resize-none" />
          </label>

          {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>Annuler</Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => run(() => adminApi.dismissReport(report.id, { reason: note }))}
            >
              Rejeter le signalement
            </Button>
            <Button type="submit" size="sm" variant={action === 'ban' ? 'danger' : 'primary'} disabled={busy}>
              {busy ? 'Patientez...' : 'Appliquer'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function AdminReports() {
  const { user: actor } = useAuth()
  const [tab, setTab] = useState('open')
  const reports = useAdminReports(tab)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Signalements</h1>
        <p className="mt-1 text-sm text-text-mid">Contenus et comptes signalés par la communauté.</p>
      </div>

      <div className="flex gap-2 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-b-2 border-accent-blue text-text-hi' : 'text-text-mid hover:text-text-hi'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataState
        loading={reports.loading && !reports.data}
        error={reports.error}
        onRetry={reports.refetch}
        isEmpty={!reports.loading && !reports.error && reports.data?.length === 0}
        skeleton={<div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <ListRowSkeleton key={i} />)}</div>}
        empty={<EmptyState icon={Flag} title={tab === 'open' ? 'Aucun signalement en attente.' : 'Aucun signalement dans cette liste.'} />}
      >
        <div className="flex flex-col gap-3">
          {reports.data?.map((r) => <ReportCard key={r.id} report={r} actor={actor} onChanged={reports.refetch} />)}
        </div>
      </DataState>
    </div>
  )
}

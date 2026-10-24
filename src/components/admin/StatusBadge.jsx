import { STATUS_LABELS } from '../../lib/moderation'

const styles = {
  active: 'bg-state-success/10 text-state-success',
  suspended: 'bg-state-warning/10 text-state-warning',
  banned: 'bg-state-danger/10 text-state-danger',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status] || styles.active}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

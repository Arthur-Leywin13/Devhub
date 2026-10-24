import { ROLE_LABELS } from '../../lib/permissions'

const styles = {
  admin: 'bg-accent-blue/15 text-accent-blue',
  moderator: 'bg-accent-blue/10 text-accent-blue',
  creator: 'bg-surface-hover text-text-mid',
  user: 'bg-surface-hover text-text-low',
}

export default function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[role] || styles.user}`}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

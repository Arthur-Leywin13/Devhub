import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Rien à afficher', description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-line py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised text-text-low">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-text-hi">{title}</p>
        {description && <p className="mt-1 max-w-xs text-xs text-text-mid">{description}</p>}
      </div>
      {action}
    </div>
  )
}

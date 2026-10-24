import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Files, ExternalLink, Trash2 } from 'lucide-react'
import { useAdminContent } from '../../hooks/useAdmin'
import { adminApi } from '../../api/admin'
import { formatDateTime } from '../../lib/timeAgo'
import SearchBar from '../../components/SearchBar'
import SanctionDialog from '../../components/admin/SanctionDialog'
import DataState from '../../components/ui/DataState'
import EmptyState from '../../components/ui/EmptyState'
import { ListRowSkeleton } from '../../components/ui/Skeleton'

const TYPES = [
  { id: 'project', label: 'Projets' },
  { id: 'article', label: 'Articles' },
  { id: 'post', label: 'Publications' },
  { id: 'comment', label: 'Commentaires' },
  { id: 'course', label: 'Cours' },
]

export default function AdminContent() {
  const [type, setType] = useState('project')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const content = useAdminContent({ type, q: debouncedQ })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Contenus</h1>
        <p className="mt-1 text-sm text-text-mid">Parcourez les contenus publics et retirez ceux qui enfreignent les règles.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
              type === t.id ? 'border-b-2 border-accent-blue text-text-hi' : 'text-text-mid hover:text-text-hi'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SearchBar value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans ce type de contenu..." className="max-w-md" />

      <DataState
        loading={content.loading && !content.data}
        error={content.error}
        onRetry={content.refetch}
        isEmpty={!content.loading && !content.error && content.data?.length === 0}
        skeleton={<div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <ListRowSkeleton key={i} />)}</div>}
        empty={<EmptyState icon={Files} title="Aucun contenu à afficher." />}
      >
        <div className="flex flex-col gap-2">
          {content.data?.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-hi">{item.title}</p>
                <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm text-text-mid">{item.excerpt}</p>
                <p className="mt-1 text-xs text-text-low">
                  {item.author ? (
                    <Link to={`/admin/utilisateurs/${item.author.id}`} className="hover:text-accent-blue">@{item.author.username}</Link>
                  ) : '···'}{' '}
                  · {formatDateTime(item.createdAt)}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {item.link && (
                  <Link to={item.link} target="_blank" rel="noopener noreferrer" aria-label="Voir le contenu" className="rounded-lg p-2 text-text-low hover:bg-surface-raised hover:text-accent-blue">
                    <ExternalLink size={16} />
                  </Link>
                )}
                <button onClick={() => setToDelete(item)} aria-label="Supprimer le contenu" className="rounded-lg p-2 text-text-low hover:bg-state-danger/10 hover:text-state-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </DataState>

      <SanctionDialog
        open={!!toDelete}
        kind="delete"
        user={toDelete?.author}
        onClose={() => setToDelete(null)}
        onSubmit={async ({ reason }) => {
          await adminApi.deleteContent(toDelete.type, toDelete.id, { reason })
          content.refetch()
        }}
      />
    </div>
  )
}

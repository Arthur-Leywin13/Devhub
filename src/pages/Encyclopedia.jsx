import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { useCategories } from '../hooks/useTechnologies'
import SearchBar from '../components/SearchBar'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeleton'

export default function Encyclopedia() {
  const [query, setQuery] = useState('')
  const { data: categories, loading, error, refetch } = useCategories()

  const filtered = (categories || []).filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Encyclopédie</h1>
        <p className="mt-1 text-sm text-text-mid">Un savoir technique organisé, écrit et enrichi par la communauté.</p>
      </div>

      <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un sujet..." className="max-w-lg" />

      <DataState
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!loading && !error && filtered.length === 0}
        skeleton={<CardSkeletonGrid count={6} />}
        empty={<EmptyState title="Aucune catégorie ne correspond à votre recherche." />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cat) => {
            const Icon = Icons[cat.icon] || Icons.BookOpen
            return (
              <Link
                key={cat.id}
                to={`/encyclopedie/${cat.id}`}
                className="group flex flex-col gap-3 rounded-xl2 border border-line bg-surface p-5 transition-all hover:border-accent-blue/40 hover:shadow-glow"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-text-hi">{cat.name}</h3>
                  <p className="mt-1 text-sm text-text-mid">{cat.description}</p>
                </div>
                <p className="font-mono text-xs text-text-low">{cat.articleCount} articles</p>
              </Link>
            )
          })}
        </div>
      </DataState>
    </div>
  )
}

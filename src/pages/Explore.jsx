import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Rocket, BookOpen, Users, Cpu, GraduationCap, Search as SearchIcon } from 'lucide-react'
import { searchApi } from '../api/search'
import { useTechnologies } from '../hooks/useTechnologies'
import SearchBar from '../components/SearchBar'
import Dropdown from '../components/Dropdown'
import ProjectCard from '../components/ProjectCard'
import ArticleCard from '../components/ArticleCard'
import UserCard from '../components/UserCard'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeleton'

const tabs = [
  { id: 'projects', label: 'Projets', icon: Rocket },
  { id: 'articles', label: 'Articles', icon: BookOpen },
  { id: 'courses', label: 'Cours', icon: GraduationCap },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'technologies', label: 'Technologies', icon: Cpu },
]

const categories = ['Toutes', 'Bots', 'IA', 'Mobile', 'Web', 'Productivité', 'DevOps', 'Jeux']
const sortOptions = ['Plus récent', 'Plus ancien', 'Plus aimé']

export default function Explore() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState('projects')
  const [query, setQuery] = useState(params.get('q') || '')
  const [techFilter, setTechFilter] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [sortFilter, setSortFilter] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const { data: technologies } = useTechnologies()

  useEffect(() => {
    setLoading(true)
    const handle = setTimeout(() => {
      searchApi
        .search(query, { category: categoryFilter && categoryFilter !== 'Toutes' ? categoryFilter : undefined })
        .then((res) => {
          setResults(res)
          setLoading(false)
        })
    }, 250)
    return () => clearTimeout(handle)
  }, [query, categoryFilter])

  let current = results?.[tab] || []

  if (tab === 'projects') {
    if (techFilter) current = current.filter((p) => p.tech?.includes(technologies?.find((t) => t.name === techFilter)?.id))
    if (sortFilter === 'Plus récent') current = [...current].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (sortFilter === 'Plus ancien') current = [...current].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    if (sortFilter === 'Plus aimé') current = [...current].sort((a, b) => b.likesCount - a.likesCount)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Explorer</h1>
        <p className="mt-1 text-sm text-text-mid">Trouvez des projets, des articles, des cours, des créateurs et des technologies.</p>
      </div>

      <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher sur DevHub..." className="max-w-lg" />

      <div className="flex flex-wrap gap-2 border-b border-line pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-accent-blue text-white' : 'bg-surface-raised text-text-mid hover:text-text-hi'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <div className="flex flex-wrap gap-2">
          <Dropdown label="Technologie" options={(technologies || []).map((t) => t.name)} value={techFilter} onChange={(v) => setTechFilter(v === techFilter ? null : v)} />
          <Dropdown label="Catégorie" options={categories} value={categoryFilter} onChange={(v) => setCategoryFilter(v === 'Toutes' ? null : v)} />
          <Dropdown label="Récent" options={sortOptions} value={sortFilter} onChange={(v) => setSortFilter(v === sortFilter ? null : v)} />
        </div>
      )}

      {loading ? (
        <CardSkeletonGrid count={4} />
      ) : current.length === 0 ? (
        <EmptyState icon={SearchIcon} title="Aucun résultat pour cette recherche." />
      ) : (
        <>
          {tab === 'projects' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {current.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
          {tab === 'articles' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {current.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}
          {tab === 'courses' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {current.map((c) => (
                <Link key={c.id} to={`/cours/${c.slug || c.id}`} className="flex gap-3 rounded-xl2 border border-line bg-surface p-3 hover:border-accent-blue/40">
                  <img src={c.image} alt={c.title} className="h-20 w-28 flex-shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-text-hi">{c.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-text-mid">{c.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {tab === 'users' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {current.map((u) => <UserCard key={u.id} user={u} />)}
            </div>
          )}
          {tab === 'technologies' && (
            <div className="flex flex-wrap gap-3">
              {current.map((t) => (
                <span key={t.id} className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-mid">
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

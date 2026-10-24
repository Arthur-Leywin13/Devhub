import { useParams, Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { useCategories } from '../hooks/useTechnologies'
import { useArticles } from '../hooks/useArticles'
import ArticleCard from '../components/ArticleCard'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid, Skeleton } from '../components/ui/Skeleton'

export default function CategoryDetail() {
  const { id } = useParams()
  const { data: categories, loading: categoriesLoading } = useCategories()
  const category = categories?.find((c) => c.id === id)
  const articles = useArticles(category ? { category: category.name } : {})

  if (categoriesLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <CardSkeletonGrid count={4} />
      </div>
    )
  }

  if (!category) {
    return <EmptyState title="Catégorie introuvable." />
  }

  const Icon = Icons[category.icon] || Icons.BookOpen

  return (
    <div className="flex flex-col gap-6">
      <Link to="/encyclopedie" className="flex w-fit items-center gap-1.5 text-sm text-text-mid hover:text-accent-blue">
        <ArrowLeft size={15} /> Retour à l'encyclopédie
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
          <Icon size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-hi">{category.name}</h1>
          <p className="text-sm text-text-mid">{category.description}</p>
        </div>
      </div>

      <DataState
        loading={articles.loading}
        error={articles.error}
        onRetry={articles.refetch}
        isEmpty={!articles.loading && !articles.error && articles.data?.length === 0}
        skeleton={<CardSkeletonGrid count={4} />}
        empty={<EmptyState title="Aucun article dans cette catégorie pour le moment." />}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {articles.data?.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      </DataState>
    </div>
  )
}

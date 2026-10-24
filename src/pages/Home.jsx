import { Link } from 'react-router-dom'
import { ArrowRight, Rocket, Flame, BookOpenText, GraduationCap } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useArticles } from '../hooks/useArticles'
import { useCourses } from '../hooks/useCourses'
import { useFeed } from '../hooks/usePosts'
import { useAuth } from '../hooks/useAuth'
import ProjectCard from '../components/ProjectCard'
import ArticleCard from '../components/ArticleCard'
import PostCard from '../components/PostCard'
import Button from '../components/Button'
import DataState from '../components/ui/DataState'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid, ListRowSkeleton } from '../components/ui/Skeleton'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const projects = useProjects({ sort: 'popular' })
  const articles = useArticles()
  const courses = useCourses()
  const feed = useFeed()

  return (
    <div className="flex flex-col gap-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl2 border border-line">
        <img
          src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
        <div className="relative px-6 py-20 text-left sm:px-12">
          <h1 className="max-w-xl font-display text-3xl font-semibold text-white sm:text-4xl">
            Bienvenue sur DevHub
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/80 sm:text-base">
            Découvrez • Apprenez • Créez • Partagez
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/explorer">
              <Button size="lg" icon={ArrowRight}>Explorer</Button>
            </Link>
            <Link
              to={isAuthenticated ? '/projets/nouveau' : '/connexion'}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-base font-medium text-white backdrop-blur transition-colors hover:bg-white/15"
            >
              Créer un projet
            </Link>
          </div>
        </div>
      </section>

      {/* Projets populaires */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text-hi">
            <Flame size={18} className="text-accent-blue" /> Projets populaires
          </h2>
          <Link to="/projets" className="text-sm text-text-mid hover:text-accent-blue">Voir tout</Link>
        </div>
        <DataState
          loading={projects.loading}
          error={projects.error}
          onRetry={projects.refetch}
          isEmpty={!projects.loading && !projects.error && projects.data?.length === 0}
          skeleton={<CardSkeletonGrid count={4} />}
          empty={<EmptyState icon={Rocket} title="Aucun projet disponible pour le moment." />}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.data?.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </DataState>
      </section>

      {/* Articles à découvrir */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text-hi">
            <BookOpenText size={18} className="text-accent-blue" /> Articles à découvrir
          </h2>
          <Link to="/encyclopedie" className="text-sm text-text-mid hover:text-accent-blue">Voir tout</Link>
        </div>
        <DataState
          loading={articles.loading}
          error={articles.error}
          onRetry={articles.refetch}
          isEmpty={!articles.loading && !articles.error && articles.data?.length === 0}
          skeleton={<CardSkeletonGrid count={2} />}
          empty={<EmptyState icon={BookOpenText} title="Aucun article disponible." />}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {articles.data?.slice(0, 4).map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        </DataState>
      </section>

      {/* Cours populaires */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text-hi">
            <GraduationCap size={18} className="text-accent-blue" /> Cours populaires
          </h2>
          <Link to="/cours" className="text-sm text-text-mid hover:text-accent-blue">Voir tout</Link>
        </div>
        <DataState
          loading={courses.loading}
          error={courses.error}
          onRetry={courses.refetch}
          isEmpty={!courses.loading && !courses.error && courses.data?.length === 0}
          skeleton={<ListRowSkeleton />}
          empty={<EmptyState icon={GraduationCap} title="Aucun cours disponible pour le moment." />}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {courses.data?.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                to={`/cours/${c.slug || c.id}`}
                className="flex gap-3 rounded-xl2 border border-line bg-surface p-3 transition-colors hover:border-accent-blue/40"
              >
                <img src={c.image} alt={c.title} className="h-20 w-28 flex-shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-text-hi">{c.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-text-mid">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </DataState>
      </section>

      {/* Publications récentes */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-text-hi">
            <Rocket size={18} className="text-accent-blue" /> Publications récentes
          </h2>
          <Link to="/fil" className="text-sm text-text-mid hover:text-accent-blue">Voir le fil</Link>
        </div>
        <DataState
          loading={feed.loading}
          error={feed.error}
          onRetry={feed.refetch}
          isEmpty={!feed.loading && !feed.error && feed.data?.length === 0}
          skeleton={<ListRowSkeleton />}
          empty={<EmptyState icon={Rocket} title="Aucune publication pour le moment." />}
        >
          <div className="flex flex-col gap-4">
            {feed.data?.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </DataState>
      </section>
    </div>
  )
}

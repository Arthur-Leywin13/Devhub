import { Link } from 'react-router-dom'
import { Clock, Heart } from 'lucide-react'
import { useAuthor } from '../hooks/useAuthor'

export default function ArticleCard({ article }) {
  const author = useAuthor(article.authorId)

  return (
    <Link
      to={`/articles/${article.slug || article.id}`}
      className="group flex gap-4 rounded-xl2 border border-line bg-surface p-4 transition-all duration-200 hover:border-accent-blue/40"
    >
      <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-surface-raised">
        <img
          src={article.image}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wide text-accent-blue">{article.category}</span>
          <h3 className="mt-1 truncate font-display text-sm font-semibold text-text-hi">{article.title}</h3>
          <p className="mt-1 text-xs text-text-mid line-clamp-2">{article.excerpt}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-low">
          <span>{author ? `@${author.username}` : '···'}</span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {article.readTime} min
          </span>
          <span className="flex items-center gap-1">
            <Heart size={12} /> {article.likesCount ?? 0}
          </span>
        </div>
      </div>
    </Link>
  )
}

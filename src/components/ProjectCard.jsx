import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Star } from 'lucide-react'
import TechBadge from './TechBadge'
import { useAuthor } from '../hooks/useAuthor'

export default function ProjectCard({ project }) {
  const author = useAuthor(project.authorId)

  return (
    <Link
      to={`/projets/${project.slug || project.id}`}
      className="group flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface transition-all duration-200 hover:border-accent-blue/40 hover:shadow-glow"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-surface-raised">
        <img
          src={project.image}
          alt={project.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-semibold text-text-hi">{project.name}</h3>
          <p className="mt-1 text-sm text-text-mid line-clamp-2">{project.description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(project.tech || []).slice(0, 3).map((t) => (
            <TechBadge key={t} id={t} />
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-text-low">
          <span>{author ? `@${author.username}` : '···'}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart size={13} /> {project.likesCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={13} /> {project.commentsCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Star size={13} /> {project.stars ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

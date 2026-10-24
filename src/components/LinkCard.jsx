import { ExternalLink, Link2 } from 'lucide-react'
import { getDomain, isSafeUrl } from '../lib/url'

// Carte d'aperçu d'un lien joint à une publication. Si le backend fournit
// un aperçu (title, description, imageUrl), il est affiché ; sinon on montre
// simplement le nom de domaine.
export default function LinkCard({ link }) {
  if (!link || !isSafeUrl(link.url)) return null
  const domain = getDomain(link.url)

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="mt-3 flex overflow-hidden rounded-xl border border-line bg-surface-raised transition-colors hover:border-accent-blue/40"
    >
      {link.imageUrl && (
        <img src={link.imageUrl} alt="" className="hidden h-24 w-32 flex-shrink-0 object-cover sm:block" />
      )}
      <div className="flex min-w-0 flex-1 items-center gap-3 p-3">
        {!link.imageUrl && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
            <Link2 size={18} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-hi">{link.title || domain}</p>
          {link.description && <p className="line-clamp-2 text-xs text-text-mid">{link.description}</p>}
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-text-low">
            <ExternalLink size={11} /> {domain}
          </p>
        </div>
      </div>
    </a>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Rocket } from 'lucide-react'
import { getTechnologiesCached } from '../api/technologiesCache'
import { usersApi } from '../api/users'
import UserCard from './UserCard'
import Button from './Button'
import { useAuth } from '../hooks/useAuth'
import { Skeleton } from './ui/Skeleton'

export default function RightRail() {
  const { isAuthenticated, user } = useAuth()
  const [technologies, setTechnologies] = useState(null)
  const [suggested, setSuggested] = useState(null)

  useEffect(() => {
    getTechnologiesCached().then(setTechnologies)
    usersApi.getSuggested(4, user?.id).then(setSuggested)
  }, [user?.id])

  return (
    <aside className="hidden w-80 flex-shrink-0 flex-col gap-6 border-l border-line px-5 py-6 xl:flex">
      <div>
        <h4 className="mb-3 font-display text-sm font-semibold text-text-hi">Technologies populaires</h4>
        {technologies ? (
          <div className="flex flex-wrap gap-2">
            {technologies.slice(0, 8).map((t) => (
              <span key={t.id} className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-mid">
                {t.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16" />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-sm font-semibold text-text-hi">Créateurs à découvrir</h4>
          <Link to="/explorer" className="text-xs text-accent-blue hover:underline">Voir tout →</Link>
        </div>
        <div className="flex flex-col gap-1">
          {suggested
            ? suggested.map((u) => <UserCard key={u.id} user={u} compact />)
            : Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>

      {isAuthenticated && (
        <div className="rounded-xl2 border border-line bg-surface p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
            <Rocket size={20} />
          </div>
          <h4 className="font-display text-sm font-semibold text-text-hi">Prêt à créer ?</h4>
          <p className="mt-1 mb-4 text-xs text-text-mid">
            Partagez vos projets et rejoignez une communauté passionnée !
          </p>
          <Link to="/projets/nouveau">
            <Button className="w-full">Créer un projet</Button>
          </Link>
        </div>
      )}
    </aside>
  )
}

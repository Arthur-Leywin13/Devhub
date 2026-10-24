import { Link } from 'react-router-dom'
import { Rocket, BookOpen, PenSquare, Github, GraduationCap } from 'lucide-react'

const options = [
  { to: '/projets/nouveau', icon: Rocket, title: 'Publier un projet', desc: 'Partagez un projet technique avec la communauté.' },
  { to: '/projets/importer-github', icon: Github, title: 'Importer depuis GitHub', desc: 'Pré-remplissez une publication à partir d’un dépôt existant.' },
  { to: '/articles/nouveau', icon: BookOpen, title: 'Écrire un article', desc: 'Rédigez un article pour l’encyclopédie DevHub.' },
  { to: '/cours/nouveau', icon: GraduationCap, title: 'Créer un cours', desc: 'Construisez un cours en sections et leçons.' },
  { to: '/fil', icon: PenSquare, title: 'Créer une publication', desc: 'Partagez une mise à jour rapide sur le fil.' },
]

export default function Create() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Que voulez-vous créer ?</h1>
        <p className="mt-1 text-sm text-text-mid">Choisissez le type de contenu à publier sur DevHub.</p>
      </div>
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <Link
            key={o.to}
            to={o.to}
            className="group flex items-center gap-4 rounded-xl2 border border-line bg-surface p-5 transition-all hover:border-accent-blue/40 hover:shadow-glow"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
              <o.icon size={20} />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-text-hi">{o.title}</h3>
              <p className="mt-0.5 text-xs text-text-mid">{o.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

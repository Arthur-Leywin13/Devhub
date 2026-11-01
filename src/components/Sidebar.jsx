import { NavLink, Link } from 'react-router-dom'
import {
  Home, Search, BookOpen, Rocket, Newspaper, GraduationCap,
  User, Bookmark, FolderGit2, MessageSquare,
  Plus, Bell, Settings, HelpCircle, LogOut, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { isStaff } from '../lib/permissions'

const mainLinks = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/explorer', label: 'Explorer', icon: Search },
  { to: '/encyclopedie', label: 'Encyclopédie', icon: BookOpen },
  { to: '/cours', label: 'Cours', icon: GraduationCap },
  { to: '/projets', label: 'Projets', icon: Rocket },
  { to: '/fil', label: "Fil d'actualité", icon: Newspaper },
]

const personalLinks = [
  { to: '/mon-profil', label: 'Mon profil', icon: User },
  { to: '/messages', label: 'Messagerie', icon: MessageSquare },
  { to: '/enregistres', label: 'Enregistrés', icon: Bookmark },
  { to: '/mes-projets', label: 'Mes projets', icon: FolderGit2 },
  { to: '/mes-cours', label: 'Mes cours', icon: GraduationCap },
]

const utilityLinks = [
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
]

function NavItem({ to, label, icon: Icon, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-accent-blue text-white' : 'text-text-mid hover:bg-surface-raised hover:text-text-hi'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-white' : ''} />
          <span className="flex-1">{label}</span>
          {badge > 0 && !isActive && (
            <span className="rounded-full bg-accent-blue px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { data: notifications } = useNotifications()
  const unreadCount = isAuthenticated ? (notifications || []).filter((n) => !n.read).length : 0

  return (
    <aside className="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-line bg-ink px-3 py-5 lg:flex">
      <Link to="/" className="mb-6 flex items-center gap-2 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue font-display text-sm font-bold text-white">
          D
        </div>
        <span className="font-display text-lg font-semibold text-text-hi">DevHub</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {mainLinks.map((l) => (
            <NavItem key={l.to} {...l} />
          ))}
        </div>

        {isAuthenticated ? (
          <>
            <div className="flex flex-col gap-1 border-t border-line pt-4">
              {personalLinks.map((l) => (
                <NavItem key={l.to} {...l} />
              ))}
            </div>

            <Link
              to="/creer"
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-blue py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-bluedark"
            >
              <Plus size={17} /> Créer
            </Link>

            <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
              {isStaff(user) && <NavItem to="/admin" label="Administration" icon={ShieldCheck} />}
              {utilityLinks.map((l) => (
                <NavItem key={l.to} {...l} badge={l.to === '/notifications' ? unreadCount : undefined} />
              ))}
              <Link
                to="/aide"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-mid transition-colors hover:bg-surface-raised hover:text-text-hi"
              >
                <HelpCircle size={18} /> Aide
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-text-mid transition-colors hover:bg-state-danger/10 hover:text-state-danger"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </>
        ) : (
          <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
            <p className="px-3 text-xs text-text-low">Connectez-vous pour créer, enregistrer et suivre du contenu.</p>
            <Link to="/connexion" className="rounded-xl bg-accent-blue py-2.5 text-center text-sm font-semibold text-white">
              Se connecter
            </Link>
          </div>
        )}
      </nav>
    </aside>
  )
}

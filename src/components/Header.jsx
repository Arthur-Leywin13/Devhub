import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, ChevronDown, Settings, User, LogOut, ShieldCheck } from 'lucide-react'
import SearchBar from './SearchBar'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { useConversations } from '../hooks/useMessages'
import { isStaff } from '../lib/permissions'

export default function Header() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { data: notifications } = useNotifications()
  const unreadCount = isAuthenticated ? (notifications || []).filter((n) => !n.read).length : 0
  const { data: conversations } = useConversations()
  const unreadMessages = isAuthenticated ? (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0) : 0

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/explorer?q=${encodeURIComponent(query)}`)
    }
  }

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur lg:px-6">
      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue font-display text-sm font-bold text-white">
          D
        </div>
      </Link>

      <div className="max-w-md flex-1">
        <SearchBar
          placeholder="Rechercher projets, articles, utilisateurs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <Link to="/notifications" className="relative rounded-xl p-2.5 text-text-mid transition-colors hover:bg-surface-raised hover:text-text-hi">
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-blue px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/messages" className="relative rounded-xl p-2.5 text-text-mid transition-colors hover:bg-surface-raised hover:text-text-hi">
              <MessageSquare size={19} />
              {unreadMessages > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-blue px-1 text-[10px] font-semibold text-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-surface-raised"
              >
                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                <ChevronDown size={14} className="hidden text-text-low sm:block" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 overflow-hidden rounded-xl border border-line bg-surface-raised shadow-glow">
                  <Link
                    to={`/profil/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-mid hover:bg-surface-hover hover:text-text-hi"
                  >
                    <User size={16} /> Mon profil
                  </Link>
                  <Link
                    to="/parametres"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-mid hover:bg-surface-hover hover:text-text-hi"
                  >
                    <Settings size={16} /> Paramètres
                  </Link>
                  {isStaff(user) && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-mid hover:bg-surface-hover hover:text-text-hi"
                    >
                      <ShieldCheck size={16} /> Administration
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-left text-sm text-state-danger hover:bg-state-danger/10"
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/connexion" className="rounded-xl px-4 py-2 text-sm font-medium text-text-mid hover:text-text-hi">
              Se connecter
            </Link>
            <Link to="/inscription" className="rounded-xl bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-bluedark">
              Créer un compte
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

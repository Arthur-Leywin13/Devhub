import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Flag, Files, ScrollText, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAdminReports } from '../hooks/useAdmin'
import RoleBadge from '../components/admin/RoleBadge'
import AccountNotices from '../components/AccountNotices'

const links = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag, badge: true },
  { to: '/admin/contenus', label: 'Contenus', icon: Files },
  { to: '/admin/journal', label: "Journal d'audit", icon: ScrollText },
]

export default function AdminLayout() {
  const { user } = useAuth()
  const { data: openReports } = useAdminReports('open')
  const openCount = openReports?.length || 0

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <ShieldCheck size={20} className="flex-shrink-0 text-accent-blue" />
        <span className="font-display text-base font-semibold text-text-hi">Administration</span>
        <div className="ml-auto flex items-center gap-3">
          <RoleBadge role={user.role} />
          <span className="hidden text-sm text-text-mid sm:inline">@{user.username}</span>
          <Link to="/" className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-text-mid transition-colors hover:bg-surface-raised hover:text-text-hi">
            <ArrowLeft size={15} /> Retour au site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <nav className="flex gap-1 overflow-x-auto md:w-56 md:flex-shrink-0 md:flex-col" aria-label="Navigation de l'administration">
          {links.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent-blue text-white' : 'text-text-mid hover:bg-surface-raised hover:text-text-hi'
                }`
              }
            >
              <Icon size={17} />
              <span className="flex-1 whitespace-nowrap">{label}</span>
              {badge && openCount > 0 && (
                <span className="rounded-full bg-state-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">{openCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <AccountNotices />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

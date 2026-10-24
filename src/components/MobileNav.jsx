import { NavLink } from 'react-router-dom'
import { Home, Search, Rocket, Newspaper, Plus } from 'lucide-react'

const links = [
  { to: '/', icon: Home, end: true },
  { to: '/explorer', icon: Search },
  { to: '/creer', icon: Plus, primary: true },
  { to: '/projets', icon: Rocket },
  { to: '/fil', icon: Newspaper },
]

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-line bg-ink/95 px-2 py-2 backdrop-blur lg:hidden">
      {links.map(({ to, icon: Icon, end, primary }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            primary
              ? 'flex h-11 w-11 items-center justify-center rounded-full bg-accent-gradient text-white shadow-glow'
              : `flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                  isActive ? 'text-accent-blue' : 'text-text-low'
                }`
          }
        >
          <Icon size={20} />
        </NavLink>
      ))}
    </nav>
  )
}

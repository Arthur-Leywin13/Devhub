import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import RightRail from '../components/RightRail'
import MobileNav from '../components/MobileNav'
import AccountNotices from '../components/AccountNotices'

export default function AppLayout({ withRail = true }) {
  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-grid-fade pb-20 lg:pb-0">
          <div className="flex">
            <div className="min-w-0 flex-1 px-4 py-6 lg:px-8">
              <AccountNotices />
              <Outlet />
            </div>
            {withRail && <RightRail />}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink bg-grid-fade px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-gradient font-display text-base font-bold text-white">
            D
          </div>
          <span className="font-display text-xl font-semibold text-text-hi">DevHub</span>
        </div>
        <div className="rounded-xl2 border border-line bg-surface p-7 shadow-glow">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

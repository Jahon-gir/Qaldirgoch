import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

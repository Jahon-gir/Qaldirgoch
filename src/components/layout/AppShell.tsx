import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname]) // yangi ekran yuqoridan ochilsin
  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { FlightProvider } from '../../home/flight'
import { PageFallback } from '../../pages/lazyPage'

export function AppShell() {
  const { pathname } = useLocation()
  // Effekt hech narsa qaytarmasin: scrollTo yangi brauzerlarda Promise qaytaradi, React uni tozalash funksiyasi deb chaqirib qulaydi
  useEffect(() => {
    window.scrollTo(0, 0) // yangi ekran yuqoridan ochilsin
    document.getElementById('root')?.scrollTo(0, 0) // telefon ramkasida (keng ekran) #root aylanadi
  }, [pathname])
  return (
    <FlightProvider>
      <div className="flex min-h-full flex-col">
        <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
          {/* Bo'lak yuklanayotganda pastki menyu joyida qoladi */}
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </FlightProvider>
  )
}

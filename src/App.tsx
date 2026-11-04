import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useAuth } from './auth/AuthProvider'
import { SyncDialogs } from './components/SyncDialogs'
import { UpdateBanner } from './components/UpdateBanner'
import { useT } from './i18n/I18nProvider'
import { useProfile } from './profile/ProfileProvider'
import Home from './pages/Home'
import Countries from './pages/countries/Countries'
import { CountryRoute, ProgramRoute, StepRoute } from './pages/countries/routes'
import Language from './pages/Language'
import ModulePage from './pages/german/ModulePage'
import LessonPage from './pages/german/LessonPage'
import Safety from './pages/Safety'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import Appearance from './pages/Appearance'
import InterfaceLanguage from './pages/InterfaceLanguage'
import ProfilePage from './pages/Profile'
import Onboarding from './pages/onboarding/Onboarding'

/** Onboarding tugamagan boʻlsa — avval u. */
function RequireOnboarding({ bare = false }: { bare?: boolean }) {
  const { onboarded } = useProfile()
  if (!onboarded) return <Navigate to="/boshlash" replace />
  return bare ? <Outlet /> : <AppShell />
}

/** Sessiya/akkaunt tekshirilayotganda (OAuth qaytishi) onboarding bir lahza ham yonib ketmasin. */
function useBooting() {
  const { status } = useAuth()
  const { sync, onboarded } = useProfile()
  return status === 'loading' || (status === 'signedIn' && sync === 'checking' && !onboarded)
}

/** Marshrutlar (testda MemoryRouter ichida ham ishlatiladi). */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="boshlash" element={<Onboarding />} />
      <Route element={<RequireOnboarding />}>
        <Route index element={<Home />} />
        <Route path="yol" element={<Countries />} />
        <Route path="yol/:country" element={<CountryRoute />} />
        <Route path="yol/:country/:program" element={<ProgramRoute />} />
        <Route path="yol/:country/:program/:stepId" element={<StepRoute />} />
        <Route path="yol/*" element={<Navigate to="/yol" replace />} />
        <Route path="til" element={<Language />} />
        <Route path="til/modul/:moduleId" element={<ModulePage />} />
        <Route path="xavfsizlik" element={<Safety />} />
        <Route path="ai" element={<Assistant />} />
        <Route path="sozlamalar" element={<Settings />} />
        <Route path="sozlamalar/profil" element={<ProfilePage />} />
        <Route path="sozlamalar/til" element={<InterfaceLanguage />} />
        <Route path="sozlamalar/korinish" element={<Appearance />} />
      </Route>
      {/* Dars ekrani pastki menyusiz */}
      <Route element={<RequireOnboarding bare />}>
        <Route path="til/dars/:lessonId" element={<LessonPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const t = useT()
  const booting = useBooting()
  if (booting) {
    return (
      <div role="status" className="flex min-h-full flex-col items-center justify-center gap-3">
        <img src="./icon.svg" alt="" width={72} height={72} className="h-[72px] w-[72px]" />
        <p className="text-ink-2">{t('sync.loading')}</p>
      </div>
    )
  }
  return (
    <HashRouter>
      <UpdateBanner />
      <SyncDialogs />
      <AppRoutes />
    </HashRouter>
  )
}

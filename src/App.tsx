import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useAuth } from './auth/AuthProvider'
import { SyncDialogs } from './components/SyncDialogs'
import { UpdateBanner } from './components/UpdateBanner'
import { MigraLogo } from './components/Logo'
import { Splash } from './components/Splash'
import { useT } from './i18n/I18nProvider'
import { useProfile } from './profile/ProfileProvider'
import Home from './pages/Home'
import Countries from './pages/countries/Countries'
import { CountryRoute, ProgramGuideRoute, ProgramRoute, StepRoute } from './pages/countries/routes'
import Language from './pages/Language'
import LanguagePicker from './pages/LanguagePicker'
import { CourseScope } from './lang/CourseContext'
import ModulePage from './pages/german/ModulePage'
import Professions from './pages/german/Professions'
import ProfessionModules from './pages/german/ProfessionModules'
import LessonPage from './pages/german/LessonPage'
import ReviewPage from './pages/german/ReviewPage'
import VocabPage from './pages/german/VocabPage'
import VocabLessonPage from './pages/german/VocabLessonPage'
import FinalTestPage from './pages/german/FinalTestPage'
import Safety from './pages/Safety'
import SafetyLayout from './pages/safety/SafetyLayout'
import AgencyCheck from './pages/safety/AgencyCheck'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import Appearance from './pages/Appearance'
import InterfaceLanguage from './pages/InterfaceLanguage'
import ProfilePage from './pages/Profile'
import InstallGuide from './pages/InstallGuide'
import Onboarding from './pages/onboarding/Onboarding'

/** Onboarding tugamagan boʻlsa — avval u. */
function RequireOnboarding({ bare = false }: { bare?: boolean }) {
  const { onboarded } = useProfile()
  if (!onboarded) return <Navigate to="/boshlash" replace />
  return bare ? <Outlet /> : <AppShell />
}

/** Splash faqat sahifa birinchi ochilganda (sovuq start) va kamida 1,8 soniya; testlarda koʻrsatilmaydi. */
let splashDone = import.meta.env.MODE === 'test'
function useSplash(booting: boolean) {
  const [minTime, setMinTime] = useState(!splashDone)
  useEffect(() => {
    if (splashDone) return
    const id = window.setTimeout(() => setMinTime(false), 1800)
    return () => window.clearTimeout(id)
  }, [])
  const show = minTime || (!splashDone && booting)
  useEffect(() => { if (!show) splashDone = true }, [show])
  return show
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
        {/* Aniq manzillar :stepId dan oldin: kirish ekrani va toʻliq tushuntirish */}
        <Route path="yol/:country/:program/kirish" element={<ProgramGuideRoute kind="kirish" />} />
        <Route path="yol/:country/:program/batafsil" element={<ProgramGuideRoute kind="batafsil" />} />
        <Route path="yol/:country/:program/:stepId" element={<StepRoute />} />
        <Route path="yol/*" element={<Navigate to="/yol" replace />} />
        {/* /til — har safar til tanlash; kurs ekranlari: /til/de (nemischa ichki manzillar avvalgidek), /til/ko/... */}
        <Route path="til" element={<LanguagePicker />} />
        <Route element={<CourseScope id="de" />}>
          <Route path="til/de" element={<Language />} />
          <Route path="til/modul/:moduleId" element={<ModulePage />} />
          <Route path="til/kasblar" element={<Professions />} />
          <Route path="til/kasblar/:soha" element={<ProfessionModules />} />
        </Route>
        <Route element={<CourseScope id="ko" />}>
          <Route path="til/ko" element={<Language />} />
          <Route path="til/ko/modul/:moduleId" element={<ModulePage />} />
        </Route>
        <Route path="xavfsizlik" element={<SafetyLayout />}>
          <Route index element={<Safety />} />
          <Route path="agentlik" element={<AgencyCheck />} />
        </Route>
        <Route path="sozlamalar" element={<Settings />} />
        <Route path="sozlamalar/profil" element={<ProfilePage />} />
        <Route path="sozlamalar/ornatish" element={<InstallGuide />} />
        <Route path="sozlamalar/til" element={<InterfaceLanguage />} />
        <Route path="sozlamalar/korinish" element={<Appearance />} />
      </Route>
      {/* Dars, takrorlash va lugʻat ekranlari pastki menyusiz */}
      <Route element={<RequireOnboarding bare />}>
        <Route path="ai" element={<Assistant />} />
        <Route element={<CourseScope id="de" />}>
          <Route path="til/dars/:lessonId" element={<LessonPage />} />
          <Route path="til/takrorlash" element={<ReviewPage />} />
          <Route path="til/lugat" element={<VocabPage />} />
          <Route path="til/lugat/:lessonId" element={<VocabLessonPage />} />
          <Route path="til/test/:scope" element={<FinalTestPage />} />
        </Route>
        <Route element={<CourseScope id="ko" />}>
          <Route path="til/ko/dars/:lessonId" element={<LessonPage />} />
          <Route path="til/ko/takrorlash" element={<ReviewPage />} />
          <Route path="til/ko/lugat" element={<VocabPage />} />
          <Route path="til/ko/lugat/:lessonId" element={<VocabLessonPage />} />
          <Route path="til/ko/test/:scope" element={<FinalTestPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default function App() {
  const t = useT()
  const booting = useBooting()
  const splash = useSplash(booting)
  if (splash) return <Splash />
  if (booting) {
    return (
      <div role="status" className="flex min-h-full flex-col items-center justify-center gap-3">
        <MigraLogo size={72} />
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

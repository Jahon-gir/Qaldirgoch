import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useAuth } from './auth/AuthProvider'
import { SyncDialogs } from './components/SyncDialogs'
import { UpdateBanner } from './components/UpdateBanner'
import { MigraLogo } from './components/Logo'
import { Splash } from './components/Splash'
import { splashState } from './components/splashState'
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

/** Splash faqat sahifa birinchi ochilganda (sovuq start): kamida 2,6 soniya, soʻng 0,7 soniyada silliq soʻnadi; testlarda yoʻq. */
function useSplash(booting: boolean) {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>(splashState.done ? 'gone' : 'in')
  const [minPassed, setMinPassed] = useState(splashState.done)
  useEffect(() => {
    if (splashState.done) return
    const id = window.setTimeout(() => setMinPassed(true), 2600)
    return () => window.clearTimeout(id)
  }, [])
  useEffect(() => {
    if (phase === 'in' && minPassed && !booting) setPhase('out')
  }, [phase, minPassed, booting])
  useEffect(() => {
    if (phase !== 'out') return
    const id = window.setTimeout(() => { splashState.done = true; setPhase('gone') }, 700)
    return () => window.clearTimeout(id)
  }, [phase])
  return phase
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
  /* Splash ilova ustida turadi (bitta nusxa): soʻnganda ilova ostidan koʻrinadi */
  const overlay = splash !== 'gone' && <Splash leaving={splash === 'out'} />
  if (booting) {
    return (
      <>
        {overlay}
        <div role="status" className="flex min-h-full flex-col items-center justify-center gap-3">
          <MigraLogo size={72} />
          <p className="text-ink-2">{t('sync.loading')}</p>
        </div>
      </>
    )
  }
  return (
    <>
      {overlay}
      <HashRouter>
        <UpdateBanner />
        <SyncDialogs />
        <AppRoutes />
      </HashRouter>
    </>
  )
}

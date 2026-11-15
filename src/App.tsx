import { Suspense, useEffect, useState } from 'react'
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
import Onboarding from './pages/onboarding/Onboarding'
import { lazyPage, PageFallback } from './pages/lazyPage'

/* Bosh ekran va onboarding asosiy JS'da; qolgan sahifalar alohida boʻlaklarda (birinchi ochilish tezroq). */
const Countries = lazyPage(() => import('./pages/countries/Countries'))
const Language = lazyPage(() => import('./pages/Language'))
const LanguagePicker = lazyPage(() => import('./pages/LanguagePicker'))
const ModulePage = lazyPage(() => import('./pages/german/ModulePage'))
const Professions = lazyPage(() => import('./pages/german/Professions'))
const ProfessionModules = lazyPage(() => import('./pages/german/ProfessionModules'))
const LessonPage = lazyPage(() => import('./pages/german/LessonPage'))
const ReviewPage = lazyPage(() => import('./pages/german/ReviewPage'))
const VocabPage = lazyPage(() => import('./pages/german/VocabPage'))
const VocabLessonPage = lazyPage(() => import('./pages/german/VocabLessonPage'))
const FinalTestPage = lazyPage(() => import('./pages/german/FinalTestPage'))
const Safety = lazyPage(() => import('./pages/Safety'))
const SafetyLayout = lazyPage(() => import('./pages/safety/SafetyLayout'))
const AgencyCheck = lazyPage(() => import('./pages/safety/AgencyCheck'))
const Assistant = lazyPage(() => import('./pages/Assistant'))
const Settings = lazyPage(() => import('./pages/Settings'))
const Appearance = lazyPage(() => import('./pages/Appearance'))
const InterfaceLanguage = lazyPage(() => import('./pages/InterfaceLanguage'))
const ProfilePage = lazyPage(() => import('./pages/Profile'))
const InstallGuide = lazyPage(() => import('./pages/InstallGuide'))
const CountryRoute = lazyPage(() => import('./pages/countries/routes').then((m) => ({ default: m.CountryRoute })))
const ProgramGuideRoute = lazyPage(() => import('./pages/countries/routes').then((m) => ({ default: m.ProgramGuideRoute })))
const ProgramRoute = lazyPage(() => import('./pages/countries/routes').then((m) => ({ default: m.ProgramRoute })))
const StepRoute = lazyPage(() => import('./pages/countries/routes').then((m) => ({ default: m.StepRoute })))
/* Kurs qatlami ham alohida: nemis paketlari (~2,3 MB) faqat til sahifasi ochilganda yuklanadi, bosh ekranni kutdirmaydi (0.28.0). */
const CourseScope = lazyPage(() => import('./lang/CourseContext').then((m) => ({ default: m.CourseScope })))

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

/**
 * Ilova chizilgach (splash vaqtidan foydalanib), boʻsh paytda kurs (nemis paketlari) oldindan yuklanadi: "Til" bosilganda kutilmaydi.
 * Ishga tushishni kutdirmaydi (0.28.0); testlarda kerak emas (sahifalar oldindan yuklanadi).
 */
function usePrefetchCourse() {
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    const run = () => void CourseScope.preload().catch(() => {})
    // Eski brauzerlarda (Safari) requestIdleCallback yoʻq — oddiy kechiktirish
    const w = window as Partial<Window> & Window
    if (w.requestIdleCallback && w.cancelIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 3000 })
      return () => w.cancelIdleCallback!(id)
    }
    const id = window.setTimeout(run, 1000)
    return () => window.clearTimeout(id)
  }, [])
}

/** Marshrutlar (testda MemoryRouter ichida ham ishlatiladi). */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
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
    </Suspense>
  )
}

export default function App() {
  const t = useT()
  const booting = useBooting()
  const splash = useSplash(booting)
  usePrefetchCourse()
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

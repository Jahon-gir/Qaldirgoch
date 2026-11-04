import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useProfile } from './profile/ProfileProvider'
import Home from './pages/Home'
import Roadmap from './pages/Roadmap'
import Language from './pages/Language'
import Safety from './pages/Safety'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import Appearance from './pages/Appearance'
import InterfaceLanguage from './pages/InterfaceLanguage'
import ProfilePage from './pages/Profile'
import Onboarding from './pages/onboarding/Onboarding'

/** Onboarding tugamagan boʻlsa — avval u. */
function RequireOnboarding() {
  const { onboarded } = useProfile()
  return onboarded ? <AppShell /> : <Navigate to="/boshlash" replace />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="boshlash" element={<Onboarding />} />
        <Route element={<RequireOnboarding />}>
          <Route index element={<Home />} />
          <Route path="yol" element={<Roadmap />} />
          <Route path="til" element={<Language />} />
          <Route path="xavfsizlik" element={<Safety />} />
          <Route path="ai" element={<Assistant />} />
          <Route path="sozlamalar" element={<Settings />} />
          <Route path="sozlamalar/profil" element={<ProfilePage />} />
          <Route path="sozlamalar/til" element={<InterfaceLanguage />} />
          <Route path="sozlamalar/korinish" element={<Appearance />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Home from './pages/Home'
import Roadmap from './pages/Roadmap'
import Language from './pages/Language'
import Safety from './pages/Safety'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import Appearance from './pages/Appearance'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="yol" element={<Roadmap />} />
          <Route path="til" element={<Language />} />
          <Route path="xavfsizlik" element={<Safety />} />
          <Route path="ai" element={<Assistant />} />
          <Route path="sozlamalar" element={<Settings />} />
          <Route path="sozlamalar/korinish" element={<Appearance />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

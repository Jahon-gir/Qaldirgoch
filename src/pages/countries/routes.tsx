import { Navigate, useParams } from 'react-router-dom'
import { AUSBILDUNG_PATH, countryById, programById } from '../../content/countries'
import { stepById } from '../../content/ausbildung'
import { contentOf } from '../../content/programs'
import Roadmap from '../Roadmap'
import DetailPage from './DetailPage'
import IntroPage from './IntroPage'
import StepDetail from '../StepDetail'
import CountryPage from './CountryPage'
import ProgramPage from './ProgramPage'

/** /yol/:x — davlat; eski havola (/yol/viza) boʻlsa yangi manzilga; notanish boʻlsa davlatlar roʻyxatiga. */
export function CountryRoute() {
  const { country = '' } = useParams()
  const c = countryById(country)
  if (c) return <CountryPage country={c} />
  if (stepById(country)) return <Navigate to={`${AUSBILDUNG_PATH}/${country}`} replace />
  return <Navigate to="/yol" replace />
}

/** /yol/:country/:program — Ausbildung yoʻl xaritasi yoki yopiq yoʻl tafsiloti. */
export function ProgramRoute() {
  const { country = '', program = '' } = useParams()
  const c = countryById(country)
  if (!c) return <Navigate to="/yol" replace />
  const p = programById(c, program)
  if (!p) return <Navigate to={`/yol/${c.id}`} replace />
  if (c.id === 'de' && p.id === 'ausbildung') return <Roadmap />
  // Kontenti bor yoʻl — kirish ekraniga; kontenti yoʻq yopiq yoʻl — ProgramPage
  if (contentOf(c.id, p.id)) return <Navigate to={`/yol/${c.id}/${p.id}/kirish`} replace />
  return <ProgramPage country={c} program={p} />
}

/** /yol/de/ausbildung/:stepId — bosqich; boshqa yoʻllarda bosqich yoʻq. */
export function StepRoute() {
  const { country = '', program = '' } = useParams()
  if (country !== 'de' || program !== 'ausbildung') return <Navigate to="/yol" replace />
  return <StepDetail />
}

/** /yol/:country/:program/kirish va /batafsil — faqat kontenti bor yoʻllarda; boshqasida davlatlar roʻyxatiga. */
export function ProgramGuideRoute({ kind }: { kind: 'kirish' | 'batafsil' }) {
  const { country = '', program = '' } = useParams()
  const c = countryById(country)
  const p = c && programById(c, program)
  const content = c && p ? contentOf(c.id, p.id) : undefined
  if (!c || !p || !content) return <Navigate to="/yol" replace />
  return kind === 'kirish' ? <IntroPage country={c} program={p} content={content} /> : <DetailPage country={c} program={p} content={content} />
}

import { Navigate, useParams } from 'react-router-dom'
import { AUSBILDUNG_PATH, countryById, programById } from '../../content/countries'
import { stepById } from '../../content/ausbildung'
import Roadmap from '../Roadmap'
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
  return <ProgramPage country={c} program={p} />
}

/** /yol/de/ausbildung/:stepId — bosqich; boshqa yoʻllarda bosqich yoʻq. */
export function StepRoute() {
  const { country = '', program = '' } = useParams()
  if (country !== 'de' || program !== 'ausbildung') return <Navigate to="/yol" replace />
  return <StepDetail />
}

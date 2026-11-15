import { Navigate, useParams } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { Card } from '../../components/ui/Card'
import { ModuleList } from '../../components/german/ModuleList'
import { TestCard } from '../../components/german/TestCard'
import { fieldScope, scopeInfo } from '../../german/finalTest'
import { useLessons } from '../../german/LessonsProvider'
import { useI18n } from '../../i18n/I18nProvider'
import { isDirection, visibleModules } from '../../german/logic'
import { useCourse, useCoursePaths } from '../../lang/CourseContext'
import { useBack } from '../../lib/useHistoryAnchor'
import { levelName } from '../../lang/text'

/** Tanlangan kasb modullari (/til/kasblar/:soha); oxirida — soha yakuniy testi (barcha vaziyatlar tugagach ochiladi). */
export default function ProfessionModules() {
  const { soha = '' } = useParams()
  const { lang, t } = useI18n()
  const course = useCourse()
  const paths = useCoursePaths()
  const back = useBack(paths.professions)
  const { results } = useLessons()
  if (!isDirection(soha) || soha === 'general' || !course.directions?.includes(soha)) return <Navigate to={paths.professions} replace />
  const modules = visibleModules(soha, course.modules).filter((m) => m.direction === soha)
  const levels = [...new Set(modules.map((m) => m.level))]
  return (
    <div className="space-y-3">
      <header className="flex min-h-[56px] items-center gap-2">
        <button type="button" onClick={back} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <IconArrowLeft size={24} aria-hidden />
        </button>
        <div>
          <p className="text-base text-ink-2">{t('kasb.open')}</p>
          <h1 className="text-xl font-semibold">{t(`dir.${soha}`)}</h1>
        </div>
      </header>
      {modules.length === 0 ? (
        <Card>
          <p className="text-base text-ink-2">{t('german.noLessons')}</p>
        </Card>
      ) : (
        levels.map((lv) => (
          <section key={lv} aria-label={levelName(course, lv, lang)} className="space-y-2">
            {levels.length > 1 && <h2 className="px-1 pt-1 text-lg font-semibold text-trust-text">{levelName(course, lv, lang)}</h2>}
            <ModuleList modules={modules.filter((m) => m.level === lv)} direction={soha} />
          </section>
        ))
      )}
      {(() => {
        const info = modules.length ? scopeInfo(fieldScope(soha), soha, course) : null
        return info && (
          <section aria-labelledby="field-test-title" className="space-y-2 pt-2">
            <h2 id="field-test-title" className="px-1 text-lg font-semibold text-trust-text">
              {t('ft.fieldSection')}
            </h2>
            <TestCard info={info} results={results} title={t('ft.fieldTitle')} always />
          </section>
        )
      })()}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { IconExternalLink } from '@tabler/icons-react'
import { safeUrl } from '../../components/countries/parts'
import { AUSBILDUNG_PATH } from '../../content/countries'
import type { ProgramContent } from '../../content/programs'
import { useT } from '../../i18n/I18nProvider'

const cta =
  'flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-accent px-4 py-3 text-center text-base font-semibold text-on-accent active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * Pastki tugma. roadmap boʻlsa (Ausbildung) — "Yoʻl xaritasini ochish" / "Davom etish"; boʻlmasa — birinchi rasmiy manbaga
 * tashqi havola va "Bosqichma-bosqich xarita keyingi versiyada".
 */
export function ProgramCta({ content, continueLabel }: { content: ProgramContent; continueLabel?: boolean }) {
  const t = useT()
  if (content.roadmap)
    return (
      <Link to={AUSBILDUNG_PATH} className={cta}>
        {continueLabel ? t('common.continue') : t('intro.openMap')}
      </Link>
    )
  const href = safeUrl(content.sources[0]?.url ?? '')
  return (
    <div className="space-y-2">
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cta}>
          {t('intro.openOfficial')}
          <IconExternalLink size={20} aria-hidden />
          <span className="sr-only">{t('step.sourceOpens')}</span>
        </a>
      )}
      <p className="text-center text-base text-ink-2">{t('intro.mapSoon')}</p>
    </div>
  )
}

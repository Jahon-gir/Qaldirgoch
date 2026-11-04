import { Notice } from '../components/ui/Notice'
import { useT } from '../i18n/I18nProvider'
import { Soon } from './Soon'

export default function Safety() {
  const t = useT()
  return (
    <Soon title="safety.title" items={['safety.i1', 'safety.i2', 'safety.i3']}>
      <Notice tone="danger">{t('safety.warning')}</Notice>
    </Soon>
  )
}

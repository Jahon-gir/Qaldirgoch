import type { TFn } from '../i18n/I18nProvider'
import { answerKey, type Answers } from './questions'

/** Kasb nomi: "Boshqa" tanlanib matn yozilgan boʻlsa — oʻsha matn. */
export function professionLabel(a: Pick<Answers, 'profession' | 'professionOther'>, t: TFn): string {
  if (a.profession === 'other' && a.professionOther) return a.professionOther
  return t(answerKey('profession', a.profession))
}

/** Natija ekrani uchun: "Bilmayman → B1". Faqat foydalanuvchi javobi va Ausbildung yoʻlidagi B1 bosqichi. */
export function germanPath(level: Answers['germanLevel'], t: TFn): string {
  if (level === 'b1') return t('q.germanLevel.b1')
  const from = level === 'none' ? t('result.germanNone') : level.toUpperCase()
  return `${from} → B1`
}

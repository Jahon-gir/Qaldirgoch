import { useRef, useState } from 'react'
import { useI18n } from '../../../i18n/I18nProvider'
import { ARTICLES, articleOf, type Article } from '../../../german/exercises'
import { useFeedback } from '../../../ui/useFeedback'
import { ARTICLE_BTN, ContinueFooter, Verdict, type ExProps } from './common'

/** Artikl: "___ Pflegekraft", uch rangli tugma (der / die / das). Faqat ot soʻzlar uchun. */
export function ArticleStep({ word, onAnswer, onDone }: ExProps) {
  const { lang, t } = useI18n()
  const fx = useFeedback()
  const a = articleOf(word.term)!
  const [picked, setPicked] = useState<Article | null>(null)
  const refs = useRef<Partial<Record<Article, HTMLButtonElement | null>>>({})
  const ok = picked === a.article
  const pick = (x: Article) => {
    if (picked) return
    setPicked(x)
    if (x === a.article) fx.right(refs.current[x])
    else fx.wrong()
    onAnswer?.(x === a.article)
  }
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <div className="rounded-2xl border border-head-line bg-head px-5 py-5 text-center text-white">
        <p className="text-base text-white/90">{t('ex.articleQ', { tr: word.tr[lang] })}</p>
        <p lang="de" className="mt-2 break-words text-3xl font-bold">
          <span aria-hidden>___</span> {a.noun}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('ex.articleQ', { tr: word.tr[lang] })}>
        {ARTICLES.map((x) => {
          const ring = picked === x ? (ok ? 'ring-4 ring-success fx-pop' : 'ring-4 ring-danger fx-shake') : ''
          return (
            <button
              key={x}
              ref={(el) => {
                refs.current[x] = el
              }}
              type="button"
              lang="de"
              disabled={picked !== null}
              onClick={() => pick(x)}
              aria-label={`${x} (${t(`ex.${x}`)})`}
              className={`flex min-h-[56px] flex-col items-center justify-center rounded-xl px-2 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${ARTICLE_BTN[x]} ${ring} ${picked && picked !== x ? 'opacity-70' : ''}`}
            >
              <span className="text-xl font-bold">{x}</span>
              <span lang={lang} className="text-[13px] font-medium">
                {t(`ex.${x}`)}
              </span>
            </button>
          )
        })}
      </div>
      {picked && <Verdict tone={ok ? 'right' : 'wrong'}>{ok ? t('ex.rightIs', { t: word.term }) : t('ex.wrong', { t: word.term })}</Verdict>}
      <ContinueFooter disabled={!picked} onClick={() => onDone(ok)} />
    </div>
  )
}

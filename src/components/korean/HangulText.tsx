import { Fragment } from 'react'

const HANGUL = /([ᄀ-ᇿ㄰-㆏가-힣]+)/

/** Aralash matn (oʻzbekcha + Hangul): Hangul boʻlaklari lang="ko" ichida (shrift va ekran oʻquvchi uchun). Hangul boʻlmasa — oddiy matn. */
export function HangulText({ text }: { text: string }) {
  if (!HANGUL.test(text)) return <>{text}</>
  return (
    <>
      {text.split(HANGUL).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} lang="ko">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  )
}

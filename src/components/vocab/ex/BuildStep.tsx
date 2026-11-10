import { useMemo, useRef, useState } from 'react'
import { IconArrowBackUp, IconBulb } from '@tabler/icons-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { chunksMatch, chunksOf, chunkTiles, isSentence, letterTiles, lettersMatch, lettersPrefixOk, targetLetters, type Tile } from '../../../german/exercises'
import { useFeedback } from '../../../ui/useFeedback'
import { useCourse } from '../../../lang/CourseContext'
import { ContinueFooter, Prompt, Verdict, type ExProps } from './common'

const tileCls =
  'flex h-12 min-w-[44px] items-center justify-center rounded-xl border border-vedge bg-vf px-2 text-xl font-semibold text-vink active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-30'
const toolCls =
  'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-line bg-surface px-3 text-base font-semibold text-ink active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40'

/** Harflardan (2 soʻzgacha) yoki soʻz boʻlaklaridan (3+ soʻz) yigʻish. Savol doim tarjima tilida. */
export function BuildStep(p: ExProps) {
  return isSentence(p.word.term) ? <Chunks {...p} /> : <Letters {...p} />
}

function useFinish({ word, speech, onAnswer }: ExProps) {
  const fx = useFeedback()
  const [result, setResult] = useState<boolean | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const finish = (ok: boolean) => {
    setResult(ok)
    if (ok) {
      fx.right(box.current)
      speech.speak(word.term)
    } else fx.wrong()
    onAnswer?.(ok)
  }
  return { result, finish, box }
}

function Letters(props: ExProps) {
  const { word, onDone } = props
  const { lang, t } = useI18n()
  const loc = useCourse().letterLocale
  const tiles = useMemo(() => letterTiles(word), [word])
  const letters = useMemo(() => targetLetters(word.term), [word])
  const [placed, setPlaced] = useState<Tile[]>([])
  const { result, finish, box } = useFinish(props)
  const done = result !== null
  const used = new Set(placed.map((x) => x.id))

  const commit = (next: Tile[]) => {
    setPlaced(next)
    // Hamma kataklar toʻlganda avtomatik tekshiriladi (katta-kichik farqsiz)
    if (next.length === letters.length) finish(lettersMatch(next.map((x) => x.text), word.term, loc))
  }
  const put = (tile: Tile) => !done && !used.has(tile.id) && placed.length < letters.length && commit([...placed, tile])
  const undo = () => !done && setPlaced(placed.slice(0, -1))
  const hint = () => {
    if (done) return
    // Qoʻyilganlar notoʻgʻri boʻlsa — avval hammasi tozalanadi
    const base = lettersPrefixOk(placed.map((x) => x.text), word.term, loc) ? placed : []
    const need = letters[base.length]
    const free = tiles.filter((x) => !base.some((b) => b.id === x.id))
    const tile = free.find((x) => x.text === need) ?? free.find((x) => x.text.toLocaleLowerCase(loc) === need.toLocaleLowerCase(loc))
    if (tile) commit([...base, tile])
    else setPlaced(base)
  }

  // Kataklar: soʻzlar orasida oraliq (boʻsh joy kiritilmaydi)
  let k = 0
  const groups = word.term.split(' ').map((part) => [...part.normalize('NFC')].map(() => k++))
  const slotTone = result === null ? 'border-ink-3' : result ? 'border-success text-success-text' : 'border-danger text-danger-text'
  const sofar = placed.map((x) => x.text).join('')

  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <Prompt label={t('ex.buildQ')}>{word.tr[lang]}</Prompt>
      <div ref={box} role="img" aria-label={t('ex.answerSoFar', { text: sofar || t('ex.empty') })} className={`flex flex-wrap justify-center gap-x-4 gap-y-2 py-2 ${result === false ? 'fx-shake' : result ? 'fx-pop' : ''}`}>
        {groups.map((g, gi) => (
          <span key={gi} className="flex flex-wrap justify-center gap-1">
            {g.map((i) => (
              <span key={i} lang="de" aria-hidden className={`flex h-[42px] w-[34px] items-end justify-center border-b-[3px] pb-1 text-xl font-bold ${slotTone}`}>
                {placed[i]?.text ?? ''}
              </span>
            ))}
          </span>
        ))}
      </div>
      {done ? (
        <Verdict tone={result ? 'right' : 'wrong'}>{result ? t('ex.rightIs', { t: word.term }) : t('ex.wrong', { t: word.term })}</Verdict>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('ex.buildQ')}>
            {tiles.map((x) => (
              <button key={x.id} type="button" lang="de" disabled={used.has(x.id)} onClick={() => put(x)} className={tileCls}>
                {x.text}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={undo} disabled={placed.length === 0} aria-label={t('ex.undoA11y')} className={toolCls}>
              <IconArrowBackUp size={20} aria-hidden />
              {t('ex.undo')}
            </button>
            <button type="button" onClick={hint} aria-label={t('ex.hintA11y')} className={toolCls}>
              <IconBulb size={20} aria-hidden />
              {t('ex.hint')}
            </button>
          </div>
        </>
      )}
      <ContinueFooter disabled={!done} onClick={() => onDone(!!result)} />
    </div>
  )
}

function Chunks(props: ExProps) {
  const { word, onDone } = props
  const { lang, t } = useI18n()
  const tiles = useMemo(() => chunkTiles(word), [word])
  const need = chunksOf(word.term).length
  const [placed, setPlaced] = useState<Tile[]>([])
  const { result, finish, box } = useFinish(props)
  const done = result !== null
  const put = (tile: Tile) => {
    if (done || placed.some((x) => x.id === tile.id)) return
    const next = [...placed, tile]
    setPlaced(next)
    if (next.length === need) finish(chunksMatch(next.map((x) => x.text), word.term))
  }
  const takeBack = (tile: Tile) => !done && setPlaced(placed.filter((x) => x.id !== tile.id))
  const lineTone = result === null ? 'border-line' : result ? 'border-success' : 'border-danger'
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <Prompt label={t('ex.chunksQ')}>{word.tr[lang]}</Prompt>
      <div
        ref={box}
        role="group"
        aria-label={t('ex.answerSoFar', { text: placed.map((x) => x.text).join(' ') || t('ex.empty') })}
        className={`flex min-h-[64px] flex-wrap content-start gap-2 rounded-xl border-2 border-dashed bg-surface p-2 ${lineTone} ${result === false ? 'fx-shake' : result ? 'fx-pop' : ''}`}
      >
        {placed.map((x) => (
          <button key={x.id} type="button" lang="de" disabled={done} onClick={() => takeBack(x)} className={tileCls}>
            {x.text}
          </button>
        ))}
      </div>
      {done ? (
        <Verdict tone={result ? 'right' : 'wrong'}>{result ? t('ex.rightIs', { t: word.term }) : t('ex.wrong', { t: word.term })}</Verdict>
      ) : (
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('ex.chunksQ')}>
          {tiles.map((x) => (
            <button key={x.id} type="button" lang="de" disabled={placed.some((p) => p.id === x.id)} onClick={() => put(x)} className={tileCls}>
              {x.text}
            </button>
          ))}
        </div>
      )}
      <ContinueFooter disabled={!done} onClick={() => onDone(!!result)} />
    </div>
  )
}

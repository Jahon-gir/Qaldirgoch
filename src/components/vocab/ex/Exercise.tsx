import { isNoun, playable, type ExerciseKind } from '../../../german/exercises'
import type { VocabFront } from '../../../profile/questions'
import { ArticleStep } from './ArticleStep'
import { BuildStep } from './BuildStep'
import type { ExProps } from './common'
import { ListenStep } from './ListenStep'
import { TestStep } from './TestStep'
import { WriteStep } from './WriteStep'

/** Bitta savol: usulga qarab. Ovoz yoʻq boʻlsa tinglash — Test; ot boʻlmasa artikl — Test. */
export function Exercise({ kind, front, ...p }: ExProps & { kind: ExerciseKind; front: VocabFront }) {
  let k = playable(kind, p.speech.canSpeak())
  if (k === 'article' && !isNoun(p.word)) k = 'test'
  switch (k) {
    case 'build':
      return <BuildStep {...p} />
    case 'listen':
      return <ListenStep {...p} />
    case 'write':
      return <WriteStep {...p} />
    case 'article':
      return <ArticleStep {...p} />
    default:
      return <TestStep {...p} front={front} />
  }
}

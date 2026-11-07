import { isNoun, playable, type ExerciseKind } from '../../../german/exercises'
import { ArticleStep } from './ArticleStep'
import { BuildStep } from './BuildStep'
import type { ExProps } from './common'
import { ListenStep } from './ListenStep'
import { SpeakStep } from './SpeakStep'
import { TestStep } from './TestStep'
import { WriteStep } from './WriteStep'

/** Bitta savol: usulga qarab. Ovoz yoʻq boʻlsa tinglash — Test; ot boʻlmasa artikl — Test. */
export function Exercise({ kind, ...p }: ExProps & { kind: ExerciseKind }) {
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
    case 'speak':
      return <SpeakStep {...p} />
    default:
      return <TestStep {...p} />
  }
}

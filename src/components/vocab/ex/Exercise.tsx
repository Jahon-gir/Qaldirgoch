import { canBuildSyllables, hasArticle, playable, type ExerciseKind } from '../../../german/exercises'
import { useCourse } from '../../../lang/CourseContext'
import { ArticleStep } from './ArticleStep'
import { BuildStep } from './BuildStep'
import type { ExProps } from './common'
import { ListenStep } from './ListenStep'
import { SpeakStep } from './SpeakStep'
import { TestStep } from './TestStep'
import { WriteStep } from './WriteStep'

/** Bitta savol: usulga qarab. Ovoz yoʻq boʻlsa tinglash — Test; ot boʻlmasa artikl — Test; bir boʻgʻinli koreyscha soʻzda yigʻish — Test. */
export function Exercise({ kind, ...p }: ExProps & { kind: ExerciseKind }) {
  const course = useCourse()
  let k = playable(kind, p.speech.canSpeak())
  if (k === 'article' && !hasArticle(p.word, course)) k = 'test'
  // Koreyscha bir boʻgʻinli soʻz (나, 네, 개) yigʻilmaydi; yozish usuli yoʻq kursda — Test
  if (k === 'build' && course.features.build === 'syllables' && !canBuildSyllables(p.word.term)) k = 'test'
  if (k === 'write' && !course.features.write) k = 'test'
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

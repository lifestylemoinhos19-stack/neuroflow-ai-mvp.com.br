import { Mini500Module, Mini500Answers, Mini500Question } from '@/lib/mini500-data'

export function getVisibleQuestions(
  module: Mini500Module,
  answers: Mini500Answers,
): Mini500Question[] {
  const isYes = (k: string) => answers[k] === 'Sim'
  const isAnyYes = (keys: string[]) => keys.some((k) => answers[k] === 'Sim')

  switch (module.id) {
    case 'A': {
      const screening = isAnyYes(['A1', 'A2'])
      return module.questions.filter((q) => (['A1', 'A2'].includes(q.key) ? true : screening))
    }
    case 'D': {
      const screening = isAnyYes(['D1a', 'D2a'])
      return module.questions.filter((q) => (['D1a', 'D2a'].includes(q.key) ? true : screening))
    }
    case 'E':
      return module.questions.filter((q) => (q.key === 'E1' ? true : isYes('E1')))
    case 'H':
      return module.questions.filter((q) => (q.key === 'H1' ? true : isYes('H1')))
    case 'I':
      return module.questions.filter((q) => (q.key === 'I1' ? true : isYes('I1')))
    case 'J':
      return module.questions.filter((q) => (q.key === 'J1' ? true : isYes('J1')))
    case 'K':
      return module.questions.filter((q) => (q.key === 'K1' ? true : isYes('K1')))
    case 'L': {
      return module.questions.filter((q) => {
        if (!q.followUpOf) return true
        return isYes(q.followUpOf)
      })
    }
    default:
      return module.questions
  }
}

export function clearHiddenAnswers(module: Mini500Module, answers: Mini500Answers): Mini500Answers {
  const visibleKeys = new Set(getVisibleQuestions(module, answers).map((q) => q.key))
  const cleaned = { ...answers }
  module.questions.forEach((q) => {
    if (!visibleKeys.has(q.key)) delete cleaned[q.key]
  })
  return cleaned
}

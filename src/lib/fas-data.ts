export const FAS_LETTERS = ['F', 'A', 'S'] as const
export const FAS_TIME_PER_LETTER = 60
export const FAS_DRAFT_KEY = 'neuroflow_fas_draft'
export const FAS_DISCLAIMER =
  'O teste de fluência verbal FAS é uma ferramenta de avaliação cognitiva. Resultados abaixo de 15 palavras podem indicar comprometimento. Não substitui avaliação clínica formal.'

export interface FasLetterResult {
  letter: string
  totalEntered: number
  validWords: number
  uniqueValid: number
  words: string[]
}

export function parseWords(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0)
}

export function validateWords(words: string[], letter: string): string[] {
  return words.filter((w) => w.startsWith(letter.toLowerCase()))
}

export function getUniqueWords(words: string[]): string[] {
  return [...new Set(words)]
}

export function calculateFasResult(wordInputs: Record<string, string>): {
  perLetter: FasLetterResult[]
  totalUnique: number
} {
  const perLetter = FAS_LETTERS.map((letter) => {
    const allWords = parseWords(wordInputs[letter] || '')
    const valid = validateWords(allWords, letter)
    const unique = getUniqueWords(valid)
    return {
      letter,
      totalEntered: allWords.length,
      validWords: valid.length,
      uniqueValid: unique.length,
      words: unique,
    }
  })
  const totalUnique = perLetter.reduce((sum, r) => sum + r.uniqueValid, 0)
  return { perLetter, totalUnique }
}

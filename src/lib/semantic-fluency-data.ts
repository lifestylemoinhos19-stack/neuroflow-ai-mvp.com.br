/**
 * Módulo de Dados e Regras de Avaliação para Fluência Verbal Semântica (Categorias: Animais e Frutas)
 *
 * Avalia recuperação léxica, memória semântica e funções executivas.
 * Cada categoria tem 60 segundos de tempo.
 *
 * Critérios padronizados exigidos:
 * Animais (60s):
 *   - > 15 palavras: preservado
 *   - 12–14 palavras: limítrofe
 *   - < 12 palavras: rebaixado
 *
 * Frutas (60s):
 *   - > 12 palavras: preservado
 *   - 9–11 palavras: limítrofe
 *   - < 9 palavras: rebaixado
 */

export interface SemanticClassification {
  status: 'preservado' | 'limitrofe' | 'rebaixado'
  label: string
  color: string
}

export interface SemanticFluencyCategoryResult {
  category: 'animais' | 'frutas'
  title: string
  totalEntered: number
  validCount: number
  uniqueCount: number
  words: string[]
  classification: SemanticClassification
}

export interface SemanticFluencyResult {
  animals: SemanticFluencyCategoryResult
  fruits: SemanticFluencyCategoryResult
  totalUnique: number
  globalClassification: string
}

export const SEMANTIC_FLUENCY_DISCLAIMER =
  'O Teste de Fluência Verbal por Categorias Semânticas (Animais e Frutas) avalia memória semântica, organização de busca léxica e controle inibitório. Resultados rebaixados podem sugerir declínio cognitivo ou disfunção executiva/linguagem.'

export function parseSemanticWords(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0)
}

export function getUniqueSemanticWords(words: string[]): string[] {
  return [...new Set(words)]
}

export function classifyAnimals(count: number): SemanticClassification {
  if (count > 15) {
    return { status: 'preservado', label: 'Desempenho preservado (>15 palavras)', color: '#2ECC71' }
  }
  if (count >= 12) {
    return { status: 'limitrofe', label: 'Desempenho limítrofe (12–14 palavras)', color: '#F39C12' }
  }
  return { status: 'rebaixado', label: 'Desempenho rebaixado (<12 palavras)', color: '#E74C3C' }
}

export function classifyFruits(count: number): SemanticClassification {
  if (count > 12) {
    return { status: 'preservado', label: 'Desempenho preservado (>12 palavras)', color: '#2ECC71' }
  }
  if (count >= 9) {
    return { status: 'limitrofe', label: 'Desempenho limítrofe (9–11 palavras)', color: '#F39C12' }
  }
  return { status: 'rebaixado', label: 'Desempenho rebaixado (<9 palavras)', color: '#E74C3C' }
}

export function calculateSemanticFluencyResult(
  animalText: string,
  fruitText: string,
): SemanticFluencyResult {
  const rawAnimals = parseSemanticWords(animalText)
  const uniqueAnimals = getUniqueSemanticWords(rawAnimals)
  const animalsCount = uniqueAnimals.length
  const animalsClass = classifyAnimals(animalsCount)

  const rawFruits = parseSemanticWords(fruitText)
  const uniqueFruits = getUniqueSemanticWords(rawFruits)
  const fruitsCount = uniqueFruits.length
  const fruitsClass = classifyFruits(fruitsCount)

  const totalUnique = animalsCount + fruitsCount

  let globalClassification = 'Acesso lexical e memória semântica preservados'
  if (animalsClass.status === 'rebaixado' || fruitsClass.status === 'rebaixado') {
    globalClassification = 'Sinais de rebaixamento no acesso léxico semântico e fluência verbal'
  } else if (animalsClass.status === 'limitrofe' || fruitsClass.status === 'limitrofe') {
    globalClassification = 'Desempenho limítrofe em fluência verbal semântica'
  }

  return {
    animals: {
      category: 'animais',
      title: 'Fluência Semântica — Animais (60s)',
      totalEntered: rawAnimals.length,
      validCount: rawAnimals.length,
      uniqueCount: animalsCount,
      words: uniqueAnimals,
      classification: animalsClass,
    },
    fruits: {
      category: 'frutas',
      title: 'Fluência Semântica — Frutas (60s)',
      totalEntered: rawFruits.length,
      validCount: rawFruits.length,
      uniqueCount: fruitsCount,
      words: uniqueFruits,
      classification: fruitsClass,
    },
    totalUnique,
    globalClassification,
  }
}

/** Chaves canônicas para o banco de dados */
export const SEMANTIC_FLUENCY_KEYS = {
  ANIMAIS_WORDS: 'fluencia_animais_words',
  ANIMAIS_COUNT: 'fluencia_animais',
  FRUTAS_WORDS: 'fluencia_frutas_words',
  FRUTAS_COUNT: 'fluencia_frutas',
  TOTAL: 'fluencia_semantica_total',
} as const

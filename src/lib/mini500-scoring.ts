import { Mini500Module, Mini500Answers } from '@/lib/mini500-data'

export interface Mini500ModuleResult {
  moduleId: string
  letter: string
  title: string
  status: 'POSITIVE' | 'NEGATIVE' | 'RISK' | 'DEPENDENCY' | 'ABUSE'
  label: string
  isPositive: boolean
  details: string
  score?: number
}

const isYes = (a: Mini500Answers, k: string) => a[k] === 'Sim'
const isNo = (a: Mini500Answers, k: string) => a[k] === 'Não'
const countYes = (a: Mini500Answers, keys: string[]) => keys.filter((k) => a[k] === 'Sim').length
const anyYes = (a: Mini500Answers, keys: string[]) => keys.some((k) => a[k] === 'Sim')

export function scoreModule(module: Mini500Module, a: Mini500Answers): Mini500ModuleResult {
  const base = { moduleId: module.id, letter: module.letter, title: module.title }

  switch (module.id) {
    case 'A': {
      const gate = isYes(a, 'A1') || isYes(a, 'A2')
      const s = countYes(a, ['A3a', 'A3b', 'A3c', 'A3d', 'A3e', 'A3f', 'A3g'])
      const pos = gate && s >= 4 && isYes(a, 'A5')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `${s}/7 sintomas`,
      }
    }
    case 'B': {
      const s = countYes(a, ['B3a', 'B3b', 'B3c', 'B3d', 'B3e', 'B3f'])
      const pos = isYes(a, 'B1') && isNo(a, 'B2') && s >= 2 && isYes(a, 'B4')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `${s}/6 sintomas`,
      }
    }
    case 'C': {
      const weights: Record<string, number> = { C1: 1, C2: 2, C3: 6, C4: 10, C5: 10, C6: 4 }
      const score = Object.entries(weights).reduce(
        (sum, [k, w]) => sum + (a[k] === 'Sim' ? w : 0),
        0,
      )
      let label = 'NEGATIVO'
      if (score >= 16) label = 'RISCO ALTO'
      else if (score >= 6) label = 'RISCO MODERADO'
      else if (score > 0) label = 'RISCO BAIXO'
      const pos = score > 0
      return {
        ...base,
        status: pos ? 'RISK' : 'NEGATIVE',
        label,
        isPositive: pos,
        details: `Pontuação ponderada: ${score}/33`,
        score,
      }
    }
    case 'D': {
      const gate = isYes(a, 'D1a') || isYes(a, 'D2a')
      const s = countYes(a, ['D2c', 'D2d', 'D2e', 'D2f', 'D2g', 'D2h', 'D2i'])
      const pos = gate && s >= 3 && isYes(a, 'D3')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `${s}/7 sintomas`,
      }
    }
    case 'E': {
      const s = countYes(a, [
        'E4a',
        'E4b',
        'E4c',
        'E4d',
        'E4e',
        'E4f',
        'E4g',
        'E4h',
        'E4i',
        'E4j',
        'E4k',
        'E4l',
        'E4m',
      ])
      const pos = isYes(a, 'E1') && isYes(a, 'E2') && isYes(a, 'E3') && s >= 4 && isYes(a, 'E5')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `${s}/13 sintomas`,
      }
    }
    case 'F': {
      const pos = isYes(a, 'F1') && isYes(a, 'F2')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: pos ? 'Critérios preenchidos' : 'Não preenchido',
      }
    }
    case 'G': {
      const pos = isYes(a, 'G1') && (isYes(a, 'G2') || isYes(a, 'G3')) && isYes(a, 'G4')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: pos ? 'Critérios preenchidos' : 'Não preenchido',
      }
    }
    case 'H': {
      const hasOC = isYes(a, 'H1')
      const obsessionPath = isYes(a, 'H2') && isYes(a, 'H3')
      const compulsionPath = isYes(a, 'H4') && isYes(a, 'H5')
      const pos = hasOC && (obsessionPath || compulsionPath) && isYes(a, 'H6')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: obsessionPath
          ? 'Obsessões confirmadas'
          : compulsionPath
            ? 'Compulsões confirmadas'
            : 'Não preenchido',
      }
    }
    case 'I': {
      const avoid = countYes(a, ['I3a', 'I3b', 'I3c', 'I3d', 'I3e', 'I3f'])
      const hyper = countYes(a, ['I4a', 'I4b', 'I4c', 'I4d', 'I4e'])
      const pos = isYes(a, 'I1') && isYes(a, 'I2') && avoid >= 3 && hyper >= 2 && isYes(a, 'I5')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `Evitação: ${avoid}/6, Hiperativação: ${hyper}/5`,
      }
    }
    case 'J':
    case 'K': {
      const p = module.id
      const dep = countYes(a, [
        `${p}2a`,
        `${p}2b`,
        `${p}2c`,
        `${p}2d`,
        `${p}2e`,
        `${p}2f`,
        `${p}2g`,
      ])
      const abuse = countYes(a, [`${p}3a`, `${p}3b`, `${p}3c`, `${p}3d`])
      if (isYes(a, `${p}1`) && dep >= 3)
        return {
          ...base,
          status: 'DEPENDENCY',
          label: 'POSITIVO - Dependência',
          isPositive: true,
          details: `${dep}/7 dependência, ${abuse}/4 abuso`,
        }
      if (isYes(a, `${p}1`) && abuse >= 1)
        return {
          ...base,
          status: 'ABUSE',
          label: 'POSITIVO - Abuso',
          isPositive: true,
          details: `${abuse}/4 abuso`,
        }
      return {
        ...base,
        status: 'NEGATIVE',
        label: 'NEGATIVO',
        isPositive: false,
        details: 'Não preenchido',
      }
    }
    case 'L': {
      const aKeys = ['L1a', 'L2a', 'L3a', 'L4a', 'L5a', 'L6a', 'L7a']
      const bKeys = ['L1b', 'L2b', 'L3b', 'L4b', 'L5b', 'L6b', 'L7b']
      const count = countYes(a, aKeys)
      const followUpCount = countYes(a, bKeys)
      const pos = anyYes(a, aKeys)
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `${count}/7 telas positivas, ${followUpCount} com persistência`,
      }
    }
    case 'M': {
      const pos = isYes(a, 'M2') && isYes(a, 'M3') && isYes(a, 'M4')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: pos ? 'Critérios preenchidos' : 'Não preenchido',
      }
    }
    case 'N': {
      const pos =
        isYes(a, 'N1') &&
        isYes(a, 'N2') &&
        isYes(a, 'N3') &&
        isYes(a, 'N4') &&
        isYes(a, 'N5') &&
        isYes(a, 'N6')
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: pos ? 'Critérios preenchidos' : 'Não preenchido',
      }
    }
    case 'O': {
      const s = countYes(a, ['O3a', 'O3b', 'O3c', 'O3d', 'O3e', 'O3f'])
      const pos = isYes(a, 'O1a') && isYes(a, 'O1b') && isYes(a, 'O2') && s >= 3
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `${s}/6 sintomas`,
      }
    }
    case 'P': {
      const child = countYes(a, ['P1a', 'P1b', 'P1c', 'P1d', 'P1e', 'P1f'])
      const adult = countYes(a, ['P2a', 'P2b', 'P2c', 'P2d', 'P2e', 'P2f'])
      const pos = child >= 3 && adult >= 3
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `Infância: ${child}/6, Adulto: ${adult}/6`,
      }
    }
    default:
      return { ...base, status: 'NEGATIVE', label: 'NEGATIVO', isPositive: false, details: '' }
  }
}

export function scoreAllModules(
  modules: Mini500Module[],
  answers: Mini500Answers,
): Mini500ModuleResult[] {
  return modules.map((m) => scoreModule(m, answers))
}

export function generateSummaryText(results: Mini500ModuleResult[]): string {
  const positives = results.filter((r) => r.isPositive)
  if (positives.length === 0) return 'Nenhum módulo apresentou resultado positivo.'
  return `Módulos positivos/com risco: ${positives.map((p) => `${p.letter} (${p.title})`).join(', ')}.`
}

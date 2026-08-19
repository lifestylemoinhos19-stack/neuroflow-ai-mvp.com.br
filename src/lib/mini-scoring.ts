import { MiniModule, MiniAnswers } from '@/lib/mini-data'

export interface MiniModuleResult {
  moduleId: string
  letter: string
  title: string
  status: 'POSITIVE' | 'NEGATIVE' | 'RISK' | 'DEPENDENCY' | 'ABUSE'
  label: string
  isPositive: boolean
  details: string
}

function isYes(a: MiniAnswers, k: string): boolean {
  return a[k] === 'Sim'
}
function isNo(a: MiniAnswers, k: string): boolean {
  return a[k] === 'Não'
}
function countYes(a: MiniAnswers, keys: string[]): number {
  return keys.filter((k) => a[k] === 'Sim').length
}
function anyYes(a: MiniAnswers, keys: string[]): boolean {
  return keys.some((k) => a[k] === 'Sim')
}

export function scoreModule(module: MiniModule, a: MiniAnswers): MiniModuleResult {
  const base = { moduleId: module.id, letter: module.letter, title: module.title }

  switch (module.id) {
    case 'A': {
      const gate = isYes(a, 'A1') || isYes(a, 'A2')
      const s = countYes(a, ['A3a', 'A3b', 'A3c', 'A3d', 'A3e', 'A3f', 'A3g'])
      const hasImpairment = isYes(a, 'A5')
      const melancholic = isYes(a, 'A6') || isYes(a, 'A7')
      const pos = gate && s >= 4 && hasImpairment
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details:
          pos && melancholic
            ? `${s}/7 sintomas (com características melancólicas)`
            : `${s}/7 sintomas`,
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
      const count = countYes(a, ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'])
      let riskLabel = 'NEGATIVO'
      if (isYes(a, 'C5') || isYes(a, 'C6')) riskLabel = 'RISCO ALTO'
      else if (isYes(a, 'C3') || isYes(a, 'C4')) riskLabel = 'RISCO MODERADO'
      else if (count > 0) riskLabel = 'RISCO BAIXO'
      const pos = count > 0
      return {
        ...base,
        status: pos ? 'RISK' : 'NEGATIVE',
        label: riskLabel,
        isPositive: pos,
        details: `${count}/6 respostas positivas`,
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
      const path1 = isYes(a, 'H1') && isYes(a, 'H2') && isYes(a, 'H3') && isYes(a, 'H6')
      const path2 = isYes(a, 'H4') && isYes(a, 'H5') && isYes(a, 'H6')
      const pos = path1 || path2
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: path1
          ? 'Obsessões confirmadas'
          : path2
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
      const prefix = module.id === 'J' ? 'J' : 'K'
      const dep = countYes(a, [
        `${prefix}2a`,
        `${prefix}2b`,
        `${prefix}2c`,
        `${prefix}2d`,
        `${prefix}2e`,
        `${prefix}2f`,
        `${prefix}2g`,
      ])
      const abuse = countYes(a, [`${prefix}3a`, `${prefix}3b`, `${prefix}3c`, `${prefix}3d`])
      const isDep = isYes(a, `${prefix}1`) && dep >= 3
      const isAbuse = isYes(a, `${prefix}1`) && abuse >= 1
      if (isDep)
        return {
          ...base,
          status: 'DEPENDENCY',
          label: 'POSITIVO - Dependência',
          isPositive: true,
          details: `${dep}/7 dependência, ${abuse}/4 abuso`,
        }
      if (isAbuse)
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
      const pos = anyYes(a, ['L1a', 'L2a', 'L3a', 'L4a', 'L5a', 'L6a', 'L7a'])
      const count = countYes(a, ['L1a', 'L2a', 'L3a', 'L4a', 'L5a', 'L6a', 'L7a'])
      return {
        ...base,
        status: pos ? 'POSITIVE' : 'NEGATIVE',
        label: pos ? 'POSITIVO' : 'NEGATIVO',
        isPositive: pos,
        details: `${count}/7 telas positivas`,
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
      const pos = child >= 3 && adult >= 1
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

export function scoreAllModules(modules: MiniModule[], answers: MiniAnswers): MiniModuleResult[] {
  return modules.map((m) => scoreModule(m, answers))
}

export function generateClinicalSummary(results: MiniModuleResult[]): string {
  const positive = results.filter((r) => r.isPositive)
  if (positive.length === 0) {
    return 'Nenhum módulo positivo identificado. Os resultados estão dentro dos parâmetros esperados.'
  }
  const lines = positive.map((r) => `- ${r.letter}: ${r.title} — ${r.label} (${r.details})`)
  lines.push(
    '',
    'Esta é uma triagem inicial. Os resultados representam sinais compatíveis a confirmar e não constituem fechamento diagnóstico. A confirmação clínica requer avaliação presencial especializada.',
  )
  return lines.join('\n')
}

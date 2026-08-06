export type Mini500QuestionType = 'yes-no' | 'text'

export interface Mini500Question {
  key: string
  label: string
  type: Mini500QuestionType
  group?: string
  weight?: number
  followUpOf?: string
}

export interface Mini500Module {
  id: string
  letter: string
  title: string
  description: string
  questions: Mini500Question[]
}

export type Mini500Answers = Record<string, string>

function yn(
  key: string,
  label: string,
  opts?: { group?: string; weight?: number; followUpOf?: string },
): Mini500Question {
  return { key, label, type: 'yes-no' as const, ...opts }
}

function txt(key: string, label: string, group?: string): Mini500Question {
  return { key, label, type: 'text' as const, group }
}

export const mini500Modules: Mini500Module[] = [
  {
    id: 'A',
    letter: 'A',
    title: 'Episódio Depressivo Maior',
    description: 'Triagem para episódio depressivo maior nos últimos 15 dias.',
    questions: [
      yn(
        'A1',
        'Nas últimas 2 semanas, esteve deprimido(a) ou sentiu triste a maior parte do dia, quase todos os dias?',
      ),
      yn(
        'A2',
        'Nas últimas 2 semanas, perdeu o interesse ou prazer em atividades que antes lhe davam prazer?',
      ),
      yn('A3a', 'Nas últimas 2 semanas, teve mudança significativa de peso ou apetite?', {
        group: 'Sintomas A3',
      }),
      yn('A3b', 'Nas últimas 2 semanas, teve problemas para dormir ou dormiu demais?', {
        group: 'Sintomas A3',
      }),
      yn('A3c', 'Nas últimas 2 semanas, esteve agitado(a) ou lentificado(a) quase todos os dias?', {
        group: 'Sintomas A3',
      }),
      yn('A3d', 'Nas últimas 2 semanas, esteve fatigado(a) ou sem energia quase todos os dias?', {
        group: 'Sintomas A3',
      }),
      yn('A3e', 'Nas últimas 2 semanas, sentiu-se inútil ou culpado(a) quase todos os dias?', {
        group: 'Sintomas A3',
      }),
      yn('A3f', 'Nas últimas 2 semanas, teve dificuldade para se concentrar ou tomar decisões?', {
        group: 'Sintomas A3',
      }),
      yn(
        'A3g',
        'Nas últimas 2 semanas, teve pensamentos recorrentes sobre morte ou ideação suicida?',
        { group: 'Sintomas A3' },
      ),
      yn(
        'A5',
        'Nas últimas 2 semanas, estes sintomas causaram sofrimento significativo ou prejuízo no funcionamento social, laboral ou outras áreas importantes?',
      ),
      yn(
        'A6',
        'Durante o pior período desse episódio, o(a) senhor(a) sentia perda de interesse ou prazer em quase todas as atividades?',
        { group: 'Características Melancólicas' },
      ),
      yn(
        'A7',
        'O(a) senhor(a) notava que seu humor não melhorava mesmo quando aconteciam coisas boas?',
        { group: 'Características Melancólicas' },
      ),
    ],
  },
  {
    id: 'B',
    letter: 'B',
    title: 'Distimia',
    description: 'Triagem para distimia (transtorno depressivo persistente).',
    questions: [
      yn(
        'B1',
        'No último ano, esteve deprimido(a) ou triste a maior parte do dia, quase todos os dias?',
      ),
      yn(
        'B2',
        'Durante esse período de depressão, ficou sem se sentir deprimido(a) por meses seguidos?',
      ),
      yn('B3a', 'Teve pouco apetite ou comeu demais?', { group: 'Sintomas B3' }),
      yn('B3b', 'Teve problemas para dormir ou dormiu demais?', { group: 'Sintomas B3' }),
      yn('B3c', 'Teve baixa energia ou esteve fatigado(a)?', { group: 'Sintomas B3' }),
      yn('B3d', 'Teve baixa autoestima?', { group: 'Sintomas B3' }),
      yn('B3e', 'Teve dificuldade para se concentrar ou tomar decisões?', { group: 'Sintomas B3' }),
      yn('B3f', 'Sentiu falta de esperança?', { group: 'Sintomas B3' }),
      yn('B4', 'Esses sintomas causaram sofrimento significativo ou prejuízo no funcionamento?'),
    ],
  },
  {
    id: 'C',
    letter: 'C',
    title: 'Risco de Suicídio',
    description: 'Avaliação de risco de suicídio — com pontuação ponderada (1-2-6-10-10-4).',
    questions: [
      yn(
        'C1',
        'Nas últimas 2 semanas, pensou que seria melhor estar morto(a) ou de se ferir de alguma forma?',
        { weight: 1 },
      ),
      yn('C2', 'Nas últimas 2 semanas, sentiu-se desesperançado(a) ou que nada daria certo?', {
        weight: 2,
      }),
      yn('C3', 'Alguma vez na vida pensou em suicídio ou em se matar?', { weight: 6 }),
      yn('C4', 'Alguma vez na vida tentou suicídio ou se matar?', { weight: 10 }),
      yn('C5', 'Neste momento, está pensando em se matar ou cometer suicídio?', { weight: 10 }),
      yn(
        'C6',
        'O(A) senhor(a) já tomou alguma precaução para evitar ser descoberto(a) ao tentar se matar?',
        { weight: 4 },
      ),
    ],
  },
  {
    id: 'D',
    letter: 'D',
    title: 'Episódio (Hipo)Maníaco',
    description: 'Triagem para episódio maníaco ou hipomaníaco.',
    questions: [
      yn(
        'D1a',
        'Alguma vez teve um período de pelo menos alguns dias em que se sentiu anormalmente eufórico(a), animado(a) ou "alto(a)"?',
      ),
      yn(
        'D2a',
        'Alguma vez teve um período de pelo menos alguns dias em que estava tão irritado(a) que brigava, gritava ou era muito difícil lidar com o(a) senhor(a)?',
      ),
      yn('D2b', 'Este período durou pelo menos 4 dias?'),
      yn('D2c', 'Teve autoestima inflada ou grandiosidade?', { group: 'Sintomas D2' }),
      yn('D2d', 'Precisou de menos sono?', { group: 'Sintomas D2' }),
      yn('D2e', 'Esteve mais falante(a) que o habitual?', { group: 'Sintomas D2' }),
      yn('D2f', 'Teve fuga de ideias ou pensamentos acelerados?', { group: 'Sintomas D2' }),
      yn('D2g', 'Esteve facilmente distraído(a)?', { group: 'Sintomas D2' }),
      yn('D2h', 'Esteve mais agitado(a) que o habitual?', { group: 'Sintomas D2' }),
      yn(
        'D2i',
        'Envolceu-se em atividades prazerosas com alto risco de consequências prejudiciais?',
        { group: 'Sintomas D2' },
      ),
      yn('D3', 'Este período causou prejuízo significativo ou necessitou hospitalização?'),
    ],
  },
  {
    id: 'E',
    letter: 'E',
    title: 'Transtorno do Pânico',
    description: 'Triagem para transtorno do pânico.',
    questions: [
      yn('E1', 'Teve ataques de pânico recorrentes e inesperados?'),
      yn(
        'E2',
        'Após o ataque, ficou preocupado(a) por pelo menos 1 mês com ter outro ataque ou suas consequências?',
      ),
      yn('E3', 'Os ataques de pânico foram caracterizados por pelo menos 4 dos sintomas abaixo?'),
      yn('E4a', 'Palpitações ou coração acelerado?', { group: 'Sintomas E4' }),
      yn('E4b', 'Sudorese?', { group: 'Sintomas E4' }),
      yn('E4c', 'Tremores ou abalos?', { group: 'Sintomas E4' }),
      yn('E4d', 'Falta de ar ou sensação de sufocamento?', { group: 'Sintomas E4' }),
      yn('E4e', 'Sensação de asfixia?', { group: 'Sintomas E4' }),
      yn('E4f', 'Dor ou desconforto no peito?', { group: 'Sintomas E4' }),
      yn('E4g', 'Náusea ou desconforto abdominal?', { group: 'Sintomas E4' }),
      yn('E4h', 'Tontura, vertigem ou sensação de desmaio?', { group: 'Sintomas E4' }),
      yn('E4i', 'Desrealização ou despersonalização?', { group: 'Sintomas E4' }),
      yn('E4j', 'Medo de perder o controle ou enlouquecer?', { group: 'Sintomas E4' }),
      yn('E4k', 'Medo de morrer?', { group: 'Sintomas E4' }),
      yn('E4l', 'Formigamento ou parestesias?', { group: 'Sintomas E4' }),
      yn('E4m', 'Calafrios ou ondas de calor?', { group: 'Sintomas E4' }),
      yn('E5', 'Os ataques não foram devidos a substâncias ou condição médica?'),
    ],
  },
  {
    id: 'F',
    letter: 'F',
    title: 'Agorafobia',
    description: 'Triagem para agorafobia.',
    questions: [
      yn(
        'F1',
        'Sente ansiedade em lugares ou situações de onde seria difícil escapar ou onde ajudaria não estar disponível?',
      ),
      yn('F2', 'Essas situações são evitadas ou suportadas com sofrimento significativo?'),
    ],
  },
  {
    id: 'G',
    letter: 'G',
    title: 'Fobia Social',
    description: 'Triagem para fobia social (transtorno de ansiedade social).',
    questions: [
      yn('G1', 'Sente medo marcante e persistente em situações sociais ou de desempenho?'),
      yn('G2', 'Tem medo de ser escrutinado(a) por outras pessoas?'),
      yn('G3', 'Tem medo de ser humilhado(a) ou envergonhado(a)?'),
      yn('G4', 'Essas situações são evitadas ou suportadas com sofrimento significativo?'),
    ],
  },
  {
    id: 'H',
    letter: 'H',
    title: 'Transtorno Obsessivo-Compulsivo',
    description: 'Triagem para TOC com critérios ajustados.',
    questions: [
      yn('H1', 'Tem obsessões ou compulsões?'),
      yn('H2', 'Os pensamentos são intrusivos e inadequados, causando ansiedade ou sofrimento?'),
      yn('H3', 'Tenta ignorar, suprimir ou neutralizar esses pensamentos?'),
      yn('H4', 'As compulsões são repetições que sente necessidade de realizar?'),
      yn('H5', 'As compulsões visam prevenir ou reduzir o sofrimento?'),
      yn(
        'H6',
        'As obsessões ou compulsões causam sofrimento marcante ou consomem mais de 1 hora por dia?',
      ),
    ],
  },
  {
    id: 'I',
    letter: 'I',
    title: 'Transtorno de Estresse Pós-Traumático',
    description: 'Triagem para TEPT.',
    questions: [
      yn('I1', 'Viveu um evento traumático em que sentiu medo, impotência ou horror?'),
      yn('I2', 'O evento foi revivido através de memórias intrusivas, pesadelos ou flashbacks?'),
      yn('I3a', 'Evita pensamentos ou sentimentos sobre o trauma?', {
        group: 'Sintomas Evitativo I3',
      }),
      yn('I3b', 'Evita atividades ou situações que lembram o trauma?', {
        group: 'Sintomas Evitativo I3',
      }),
      yn('I3c', 'É incapaz de recordar aspectos importantes do trauma?', {
        group: 'Sintomas Evitativo I3',
      }),
      yn('I3d', 'Tem interesse diminuído em atividades significativas?', {
        group: 'Sintomas Evitativo I3',
      }),
      yn('I3e', 'Sente-se distante ou desligado(a) dos outros?', {
        group: 'Sintomas Evitativo I3',
      }),
      yn('I3f', 'Tem afeto restrito ou incapacidade de ter sentimentos amorosos?', {
        group: 'Sintomas Evitativo I3',
      }),
      yn('I4a', 'Tem dificuldade para adormecer ou manter o sono?', { group: 'Hiperativação I4' }),
      yn('I4b', 'Está irritável ou tem explosões de raiva?', { group: 'Hiperativação I4' }),
      yn('I4c', 'Tem dificuldade de concentração?', { group: 'Hiperativação I4' }),
      yn('I4d', 'Está hipervigilante?', { group: 'Hiperativação I4' }),
      yn('I4e', 'Tem resposta de sobressalto exagerada?', { group: 'Hiperativação I4' }),
      yn('I5', 'Esses sintomas duram mais de 1 mês e causam sofrimento ou prejuízo?'),
    ],
  },
  {
    id: 'J',
    letter: 'J',
    title: 'Abuso/Dependência de Álcool',
    description: 'Triagem para abuso e dependência de álcool.',
    questions: [
      yn('J1', 'Bebe mais de 3 doses por dia ou mais de 14 doses por semana?'),
      yn('J2a', 'Necessita beber mais para obter o mesmo efeito (tolerância)?', {
        group: 'Dependência J2',
      }),
      yn('J2b', 'Sente sintomas de abstinência quando para de beber?', { group: 'Dependência J2' }),
      yn('J2c', 'Bebe mais ou por mais tempo do que pretendia?', { group: 'Dependência J2' }),
      yn('J2d', 'Tentou parar ou reduzir sem sucesso?', { group: 'Dependência J2' }),
      yn('J2e', 'Passa muito tempo bebendo ou se recuperando?', { group: 'Dependência J2' }),
      yn('J2f', 'Deixou de fazer atividades importantes por causa da bebida?', {
        group: 'Dependência J2',
      }),
      yn('J2g', 'Continua bebendo apesar de saber que lhe causa problemas?', {
        group: 'Dependência J2',
      }),
      yn('J3a', 'Deixou de cumprir obrigações por causa da bebida?', { group: 'Abuso J3' }),
      yn('J3b', 'Bebeu em situações de risco físico (dirigir, operar máquinas)?', {
        group: 'Abuso J3',
      }),
      yn('J3c', 'Teve problemas legais relacionados à bebida?', { group: 'Abuso J3' }),
      yn('J3d', 'Continua bebendo apesar de problemas sociais ou interpessoais?', {
        group: 'Abuso J3',
      }),
    ],
  },
  {
    id: 'K',
    letter: 'K',
    title: 'Abuso/Dependência de Substâncias',
    description: 'Triagem para abuso e dependência de substâncias não-alcoólicas.',
    questions: [
      yn(
        'K1',
        'Nos últimos 12 meses, usou alguma droga ou medicação para ficar "alto(a)" ou se acalmar?',
      ),
      txt('K1_specify', 'Se sim, qual(is) substância(s) utilizou?'),
      yn('K2a', 'Necessita usar mais para obter o mesmo efeito (tolerância)?', {
        group: 'Dependência K2',
      }),
      yn('K2b', 'Sente sintomas de abstinência quando para de usar?', { group: 'Dependência K2' }),
      yn('K2c', 'Usa mais ou por mais tempo do que pretendia?', { group: 'Dependência K2' }),
      yn('K2d', 'Tentou parar ou reduzir sem sucesso?', { group: 'Dependência K2' }),
      yn('K2e', 'Passa muito tempo usando ou se recuperando?', { group: 'Dependência K2' }),
      yn('K2f', 'Deixou de fazer atividades importantes por causa do uso?', {
        group: 'Dependência K2',
      }),
      yn('K2g', 'Continua usando apesar de saber que lhe causa problemas?', {
        group: 'Dependência K2',
      }),
      yn('K3a', 'Deixou de cumprir obrigações por causa do uso?', { group: 'Abuso K3' }),
      yn('K3b', 'Usou em situações de risco físico?', { group: 'Abuso K3' }),
      yn('K3c', 'Teve problemas legais relacionados ao uso?', { group: 'Abuso K3' }),
      yn('K3d', 'Continua usando apesar de problemas sociais ou interpessoais?', {
        group: 'Abuso K3',
      }),
    ],
  },
  {
    id: 'L',
    letter: 'L',
    title: 'Síndrome Psicótica',
    description: 'Triagem para transtornos psicóticos com perguntas de seguimento condicionais.',
    questions: [
      yn(
        'L1a',
        'Tem ou teve ideias delirantes de perseguição (sentir que estão tentando prejudicá-lo(a))?',
      ),
      yn('L1b', 'Essas ideias causaram sofrimento significativo ou prejuízo no funcionamento?', {
        followUpOf: 'L1a',
      }),
      yn(
        'L2a',
        'Tem ou teve ideias delirantes de referência (sentir que mensagens são dirigidas a você)?',
      ),
      yn('L2b', 'Essas ideias persistem apesar de evidências em contrário?', { followUpOf: 'L2a' }),
      yn(
        'L3a',
        'Tem ou teve ideias delirantes de grandiosidade (sentir que tem poderes especiais)?',
      ),
      yn('L3b', 'Essas ideias afetaram seu comportamento de forma significativa?', {
        followUpOf: 'L3a',
      }),
      yn('L4a', 'Tem ou teve ideia de que pensamentos são inseridos ou retirados de sua mente?'),
      yn('L4b', 'Essa experiência causa sofrimento ou prejuízo significativo?', {
        followUpOf: 'L4a',
      }),
      yn('L5a', 'Tem ou teve ideia de que seus pensamentos são transmitidos ou difundidos?'),
      yn('L5b', 'Essa experiência ocorre frequentemente?', { followUpOf: 'L5a' }),
      yn('L6a', 'Ouve vozes quando ninguém está presente, ou vê coisas que outros não veem?'),
      yn('L6b', 'Essas experiências causam sofrimento ou interferem em suas atividades?', {
        followUpOf: 'L6a',
      }),
      yn('L7a', 'Apresentou afeto embotado, falta de iniciativa ou empobrecimento do pensamento?'),
      yn('L7b', 'Estes sintomas persistem há mais de 6 meses?', { followUpOf: 'L7a' }),
    ],
  },
  {
    id: 'M',
    letter: 'M',
    title: 'Anorexia Nervosa',
    description: 'Triagem para anorexia nervosa.',
    questions: [
      yn('M1', 'Tem preocupação excessiva com o peso ou a forma do corpo?'),
      yn('M2', 'Seu peso está pelo menos 15% abaixo do esperado para sua altura?'),
      yn('M3', 'A perda de peso foi auto-induzida (dieta, vômito, laxantes, exercício excessivo)?'),
      yn('M4', 'Tem medo intenso de ganhar peso ou ficar gordo(a), mesmo estando abaixo do peso?'),
    ],
  },
  {
    id: 'N',
    letter: 'N',
    title: 'Bulimia Nervosa',
    description: 'Triagem para bulimia nervosa.',
    questions: [
      yn(
        'N1',
        'Tem episódios em que come uma quantidade anormalmente grande de comida em pouco tempo (comer compulsivo)?',
      ),
      yn(
        'N2',
        'Durante esses episódios, sente que não consegue parar de comer ou controlar o quanto come?',
      ),
      yn(
        'N3',
        'Para evitar ganhar peso, usa vômito, laxantes, diuréticos, jejum ou exercício excessivo?',
      ),
      yn('N4', 'Esses comportamentos ocorrem pelo menos 2 vezes por semana há 3 meses?'),
      yn('N5', 'Tem preocupação excessiva com o peso e a forma do corpo?'),
      yn('N6', 'Esses comportamentos não ocorrem exclusivamente durante episódios de anorexia?'),
    ],
  },
  {
    id: 'O',
    letter: 'O',
    title: 'Transtorno de Ansiedade Generalizada (TAG)',
    description: 'Triagem para transtorno de ansiedade generalizada.',
    questions: [
      yn('O1a', 'Preocupa-se excessivamente mais dias do que não, há pelo menos 6 meses?'),
      yn('O1b', 'A preocupação é difícil de controlar?'),
      yn('O2', 'Preocupa-se com uma variedade de coisas (não apenas um assunto específico)?'),
      yn('O3a', 'Sente inquietação ou se sente "no limite" ou tenso(a)?', { group: 'Sintomas O3' }),
      yn('O3b', 'Fica facilmente fatigado(a)?', { group: 'Sintomas O3' }),
      yn('O3c', 'Tem dificuldade de concentração ou sente a mente "vazia"?', {
        group: 'Sintomas O3',
      }),
      yn('O3d', 'Está irritável?', { group: 'Sintomas O3' }),
      yn('O3e', 'Tem tensão muscular?', { group: 'Sintomas O3' }),
      yn('O3f', 'Tem dificuldade para dormir ou sono não reparador?', { group: 'Sintomas O3' }),
    ],
  },
  {
    id: 'P',
    letter: 'P',
    title: 'Transtorno de Personalidade Antissocial',
    description:
      'Triagem para transtorno de personalidade antissocial (requer 3+ sintomas na fase adulta).',
    questions: [
      yn('P1a', 'Antes dos 15 anos, faltava frequentemente à escola sem justificativa?', {
        group: 'Sintomas Infância P1',
      }),
      yn('P1b', 'Antes dos 15 anos, fugiu de casa e passou a noite fora?', {
        group: 'Sintomas Infância P1',
      }),
      yn('P1c', 'Antes dos 15 anos, iniciava frequentemente brigas físicas?', {
        group: 'Sintomas Infância P1',
      }),
      yn('P1d', 'Antes dos 15 anos, usou arma que poderia causar ferimentos graves?', {
        group: 'Sintomas Infância P1',
      }),
      yn(
        'P1e',
        'Antes dos 15 anos, mentia ou quebrava promessas frequentemente para obter vantagens?',
        { group: 'Sintomas Infância P1' },
      ),
      yn(
        'P1f',
        'Antes dos 15 anos, cometeu atos que poderiam levar a prisão (roubo, vandalismo)?',
        { group: 'Sintomas Infância P1' },
      ),
      yn(
        'P2a',
        'É incapaz de manter comportamento consistente no trabalho ou cumprir obrigações financeiras?',
        { group: 'Sintomas Adulto P2' },
      ),
      yn(
        'P2b',
        'Deixa de seguir normas sociais (é preso ou comete atos que poderiam levar a prisão)?',
        { group: 'Sintomas Adulto P2' },
      ),
      yn('P2c', 'É irritável ou agressivo, iniciando brigas ou agressões?', {
        group: 'Sintomas Adulto P2',
      }),
      yn('P2d', 'Deixa de cumprir obrigações financeiras ou não honra dívidas?', {
        group: 'Sintomas Adulto P2',
      }),
      yn('P2e', 'Age de forma imprudente sem considerar consequências para si ou outros?', {
        group: 'Sintomas Adulto P2',
      }),
      yn('P2f', 'Não sente remorso após prejudicar ou magoar outras pessoas?', {
        group: 'Sintomas Adulto P2',
      }),
    ],
  },
]

export const SUBSTANCE_LIST_500: string[] = [
  'Estimulantes (anfetaminas, metanfetamina)',
  'Cocaína/Crack',
  'Opiáceos (heroína, morfina, etc.)',
  'Sedativos/Hipnóticos (benzodiazepínicos)',
  'Maconha/Haxixe',
  'Alucinógenos (LSD, etc.)',
  'Inalantes (cola, solventes)',
  'Esteroides anabolizantes',
  'Outros',
]

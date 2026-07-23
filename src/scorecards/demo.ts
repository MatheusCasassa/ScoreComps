// Dados fictícios para pré-visualizar a súmula (cobre todos os casos de regra).

import type { WcifRound } from '../wca/types'
import { buildRoundLayout, type ScorecardModel } from './logic'
import { eventName } from './format'

function round(partial: Partial<WcifRound> & { id: string; format: WcifRound['format'] }): WcifRound {
  return {
    timeLimit: null,
    cutoff: null,
    advancementCondition: null,
    ...partial,
  }
}

const NAMES = [
  'Ana Beatriz Nascimento',
  'Pedro Henrique Maciel Ceccopieri Belo (陈昊然)',
  'João Pedro da Silva Santos',
  'Yuxuan Wang (王宇轩)',
]
const WCA_IDS = ['2019NASC01', '2010PULC01', '2022SILV07', '2016WANG42']

export function demoModels(): ScorecardModel[] {
  const comp = 'Campeonato CubingSP 2026'

  const specs: { eventId: string; group: string; round: WcifRound }[] = [
    {
      // Média de 5, SEM tempo de corte (ex.: final) + limite simples.
      eventId: '333',
      group: '1',
      round: round({ id: '333-r1', format: 'a', timeLimit: { centiseconds: 60000, cumulativeRoundIds: [] } }),
    },
    {
      // Média de 5 COM tempo de corte.
      eventId: '444',
      group: '2',
      round: round({
        id: '444-r1',
        format: 'a',
        timeLimit: { centiseconds: 18000, cumulativeRoundIds: [] },
        cutoff: { numberOfAttempts: 2, attemptResult: 9000 },
      }),
    },
    {
      // Média de 3 (evento de 3 solves) com corte após 1 tentativa.
      eventId: '666',
      group: '1',
      round: round({
        id: '666-r1',
        format: 'm',
        timeLimit: { centiseconds: 36000, cumulativeRoundIds: [] },
        cutoff: { numberOfAttempts: 1, attemptResult: 18000 },
      }),
    },
    {
      // 3x3x3 de Olhos Vendados — Bo5/Ao5 (regra de 2026), limite CUMULATIVO.
      eventId: '333bf',
      group: '1',
      round: round({
        id: '333bf-r1',
        format: 'a',
        timeLimit: { centiseconds: 180000, cumulativeRoundIds: ['333bf-r1'] },
      }),
    },
  ]

  return specs.map((s, i) => ({
    competitionName: comp,
    eventName: `${eventName(s.eventId)} · Rodada 1`,
    competitorId: String(i + 1),
    wcaId: WCA_IDS[i % WCA_IDS.length],
    group: s.group,
    competitorName: NAMES[i % NAMES.length],
    layout: buildRoundLayout(s.round, s.eventId),
  }))
}

// Monta a lista de ScorecardModel a partir do WCIF e das seleções da UI.

import type { Wcif } from '../wca/types'
import {
  listGroups,
  competitorsInGroup,
  acceptedCompetitors,
  type RoundInfo,
  type GroupInfo,
} from '../wca/wcif'
import { buildRoundLayout, type ScorecardModel } from './logic'

export interface RoundSelection {
  round: RoundInfo
  /** Números de grupo selecionados. Vazio = todos os grupos da rodada. */
  groupNumbers: number[]
}

function eventLine(round: RoundInfo): string {
  return round.totalRounds > 1 ? `${round.eventName} · ${round.label}` : round.eventName
}

/** Constrói as súmulas de uma rodada (um ou mais grupos). */
export function buildRoundScorecards(wcif: Wcif, sel: RoundSelection): ScorecardModel[] {
  const layout = buildRoundLayout(sel.round.round, sel.round.eventId)
  const models: ScorecardModel[] = []

  let groups: GroupInfo[] = listGroups(wcif, sel.round.roundId)
  const useFallback = groups.length === 0

  if (useFallback) {
    // Sem grupos no cronograma: grupo único com todos os inscritos aceitos.
    groups = [{ number: 1, activityIds: [], label: 'Grupo 1' }]
  } else if (sel.groupNumbers.length > 0) {
    const wanted = new Set(sel.groupNumbers)
    groups = groups.filter((g) => wanted.has(g.number))
  }

  for (const group of groups) {
    const competitors = useFallback
      ? acceptedCompetitors(wcif, sel.round.eventId)
      : competitorsInGroup(wcif, group.activityIds)

    for (const c of competitors) {
      models.push({
        competitionName: wcif.name,
        eventName: eventLine(sel.round),
        competitorId: String(c.registrantId),
        wcaId: c.wcaId,
        group: String(group.number),
        competitorName: c.name,
        layout,
      })
    }
  }
  return models
}

/** Constrói súmulas para várias rodadas selecionadas. */
export function buildScorecards(wcif: Wcif, selections: RoundSelection[]): ScorecardModel[] {
  return selections.flatMap((sel) => buildRoundScorecards(wcif, sel))
}

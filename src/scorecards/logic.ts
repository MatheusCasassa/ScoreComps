// Lógica dinâmica de montagem da súmula a partir do WCIF.
// Decide blocos, textos de corte, DNF/cumulativo e extras conforme as
// regras da WCA (formato, cutoff, timeLimit simples vs cumulativo).

import type { WcifFormatId, WcifRound } from '../wca/types'
import { formatCentis, PENALTY_EXAMPLE } from './format'

export interface ScorecardRow {
  /** Rótulo do quadradinho: "1".."5" ou "E1"/"E2". */
  label: string
  isExtra: boolean
}

/** Layout compartilhado por todas as súmulas de uma mesma rodada. */
export interface RoundLayout {
  /** Nº de solves oficiais do formato. */
  solveCount: number
  /** Bloco 1 (antes do corte). */
  block1: ScorecardRow[]
  /** Bloco 2 (após o corte). Pode ser vazio (formatos de 1 solve). */
  block2: ScorecardRow[]
  /** Extras E1/E2. */
  extras: ScorecardRow[]
  /** Texto antes do 1º bloco (DNF simples OU cumulativo) — null se não há. */
  dnfText: string | null
  /** Sempre presente para eventos cronometrados. */
  penaltyText: string | null
  /** true quando o evento usa pontuação (FMC/Multi) e a penalidade some. */
  isFmc: boolean
  /** Texto intermediário 1 (linha do corte). */
  cutoffText: string
  /** Exibir a linha de corte? (só quando há bloco 2). */
  showCutoff: boolean
  /** Cabeçalho do bloco de extras. */
  extrasText: string
}

const SOLVES_BY_FORMAT: Record<WcifFormatId, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
  m: 3,
  a: 5,
}

const EXTRA_COUNT = 2

function makeRows(from: number, to: number): ScorecardRow[] {
  const rows: ScorecardRow[] = []
  for (let i = from; i <= to; i++) rows.push({ label: String(i), isExtra: false })
  return rows
}

export function buildRoundLayout(round: WcifRound, eventId: string): RoundLayout {
  const format = round.format
  // Nº de solves vem do FORMATO da rodada no WCIF — nunca fixado por evento.
  // Assim, mudanças de regra (ex.: 3BLD virou Bo5/Ao5 em 2026) já são refletidas
  // automaticamente pelos dados oficiais da competição.
  const solveCount = SOLVES_BY_FORMAT[format] ?? 5
  const isFmc = eventId === '333fm'
  const isMulti = eventId === '333mbf'

  // Só há divisão em blocos quando existe um TEMPO DE CORTE de verdade.
  // Sem cutoff, todos os solves ficam num único bloco (padrão WCA/Groupifier).
  const cutoffAttempts =
    round.cutoff && round.cutoff.numberOfAttempts < solveCount
      ? round.cutoff.numberOfAttempts
      : null

  const block1 = cutoffAttempts != null ? makeRows(1, cutoffAttempts) : makeRows(1, solveCount)
  const block2 = cutoffAttempts != null ? makeRows(cutoffAttempts + 1, solveCount) : []

  const extras: ScorecardRow[] = []
  for (let i = 1; i <= EXTRA_COUNT; i++) extras.push({ label: `E${i}`, isExtra: true })

  // --- Texto DNF / cumulativo (antes do 1º bloco) ---
  let dnfText: string | null = null
  const tl = round.timeLimit
  if (tl && tl.cumulativeRoundIds && tl.cumulativeRoundIds.length > 0) {
    // Limite CUMULATIVO (ex.: 3BLD, Multi-BLD).
    const t = formatCentis(tl.centiseconds)
    dnfText =
      tl.cumulativeRoundIds.length > 1
        ? `Tempo cumulativo de ${t} (múltiplas rodadas)`
        : `Tempo cumulativo de ${t}`
  } else if (tl && tl.centiseconds > 0 && !isFmc && !isMulti) {
    dnfText = `DNF se > ${formatCentis(tl.centiseconds)}`
  }

  // --- Texto de corte (intermediário 1) — só quando há bloco 2 ---
  const showCutoff = block2.length > 0
  const cutoffText =
    showCutoff && round.cutoff
      ? `Tempo de corte se > ${formatCentis(round.cutoff.attemptResult)}`
      : ''

  return {
    solveCount,
    block1,
    block2,
    extras,
    dnfText,
    penaltyText: isFmc || isMulti ? null : PENALTY_EXAMPLE,
    isFmc,
    cutoffText,
    showCutoff,
    extrasText: 'Extra(s)',
  }
}

/** Dados de identificação de uma súmula individual (um competidor num grupo). */
export interface ScorecardModel {
  competitionName: string
  eventName: string
  competitorId: string
  wcaId: string | null
  group: string
  competitorName: string
  layout: RoundLayout
}

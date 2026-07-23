// Formatação de tempos e nomes de eventos.
import { getEventName } from '@wca/helpers'

/**
 * Converte centésimos de segundo no formato WCA:
 *   < 60s  -> "SS.cc"   (ex.: 12.34)
 *   >= 60s -> "M:SS.cc" (ex.: 1:23.45)
 */
export function formatCentis(cs: number): string {
  const total = Math.round(cs)
  const cc = total % 100
  const totalSec = Math.floor(total / 100)
  const s = totalSec % 60
  const m = Math.floor(totalSec / 60)
  const cc2 = String(cc).padStart(2, '0')
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}.${cc2}`
  return `${s}.${cc2}`
}

/** Exemplo fixo de penalidade exibido na súmula. */
export const PENALTY_EXAMPLE = 'Exemplo de Penalidade: 14.67 + 2 = 16.67'

/** Nome do evento no padrão oficial da WCA (ex.: "3x3x3 Cube"). */
export function eventName(eventId: string): string {
  try {
    return getEventName(eventId as Parameters<typeof getEventName>[0]) ?? eventId
  } catch {
    return eventId
  }
}

/** Nome legível da rodada, ex.: "Rodada 1", "Final". */
export function roundLabel(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds && totalRounds > 1) return 'Final'
  return `Rodada ${roundNumber}`
}

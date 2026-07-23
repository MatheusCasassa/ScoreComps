import type { Wcif } from '../src/wca/types'
import { generateGroups, defaultRoundConfig, type GroupingConfig } from '../src/wca/grouping'
import { buildScorecards } from '../src/scorecards/build'
import { listRounds } from '../src/wca/wcif'
import { buildCompetitorCards } from '../src/scorecards/competitorCards'

// --- Mock WCIF: 11 pessoas, eventos 333 (2 rodadas) e 444, com cronograma ---
const names = [
  'Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Melo', 'Eva Nunes',
  'Felipe Rocha', 'Gabi Alves', 'Hugo Pinto', 'Ivo Castro', 'Jana Reis', 'Kaue Sá',
]
function pb(eventId: string, single: number, average: number) {
  return [
    { eventId, best: single, type: 'single' as const },
    { eventId, best: average, type: 'average' as const },
  ]
}
const persons = names.map((name, i) => ({
  registrantId: i + 1,
  name,
  wcaId: `2020TEST${String(i + 1).padStart(2, '0')}`,
  countryIso2: 'BR',
  registration: { eventIds: ['333', '444'], status: 'accepted' as const },
  assignments: [],
  personalBests: [...pb('333', 800 + i * 90, 1000 + i * 90), ...pb('444', 3000 + i * 200, 3500 + i * 200)],
}))

const activity = (id: number, code: string, name: string, start: string, end: string) => ({
  id, name, activityCode: code, startTime: start, endTime: end, childActivities: [],
})

const wcif: Wcif = {
  id: 'MockComp2026',
  name: 'Mock Comp 2026',
  persons: persons as unknown as Wcif['persons'],
  events: [
    { id: '333', rounds: [
      { id: '333-r1', format: 'a', timeLimit: { centiseconds: 60000, cumulativeRoundIds: [] }, cutoff: null, advancementCondition: null },
      { id: '333-r2', format: 'a', timeLimit: { centiseconds: 60000, cumulativeRoundIds: [] }, cutoff: null, advancementCondition: null },
    ] },
    { id: '444', rounds: [
      { id: '444-r1', format: 'a', timeLimit: { centiseconds: 18000, cumulativeRoundIds: [] }, cutoff: { numberOfAttempts: 2, attemptResult: 9000 }, advancementCondition: null },
    ] },
  ],
  schedule: { venues: [{ id: 1, name: 'Ginásio', rooms: [{ id: 1, name: 'Sala Principal', activities: [
    activity(10, '333-r1', '3x3x3 Rodada 1', '2026-05-01T13:00:00.000Z', '2026-05-01T14:00:00.000Z'),
    activity(11, '444-r1', '4x4x4 Rodada 1', '2026-05-01T14:00:00.000Z', '2026-05-01T15:00:00.000Z'),
  ] }] }] },
}

const stations = 4
const config: GroupingConfig = { stations, perRound: {} }
for (const r of listRounds(wcif)) {
  const comp = 11
  config.perRound[r.roundId] = defaultRoundConfig(comp, stations, r.roundNumber)
}
// força judges e 2 grupos p/ 333-r1
config.perRound['333-r1'].groups = 2
config.perRound['333-r1'].stationNumbers = true

const res = generateGroups(wcif, ['333-r1', '444-r1'], config)

console.log('=== RESULTADO DE GRUPOS ===')
for (const r of res.rounds) {
  console.log(`\n${r.label}  (cronograma real: ${r.hasRealSchedule})`)
  for (const g of r.groups) console.log(`  Grupo ${g.number}: ${g.competitors} competidores (alvo ${g.size})`)
}
console.log('\ncanSave:', res.canSave)

// Distribuição de staff
const staffCount: Record<string, number> = {}
for (const p of res.wcif.persons) for (const a of p.assignments) {
  if (a.assignmentCode.startsWith('staff-')) staffCount[a.assignmentCode] = (staffCount[a.assignmentCode] ?? 0) + 1
}
console.log('\nStaff total:', staffCount)

// Scorecards a partir dos grupos gerados
const rounds = listRounds(res.wcif)
const sc = buildScorecards(res.wcif, [{ round: rounds.find((r) => r.roundId === '333-r1')!, groupNumbers: [] }])
console.log(`\nScorecards 333-r1: ${sc.length} (esperado 11)`)
console.log('  ex.:', sc.slice(0, 2).map((m) => `${m.competitorName} G${m.group} ID${m.competitorId}`))

// Cartões de competidor
const cc = buildCompetitorCards(res.wcif)
console.log(`\nCartões de competidor: ${cc.length}`)
const sample = cc[0]
console.log('  ex.:', sample.name, '| colunas:', sample.columns.map((c) => c.label).join(','))
for (const row of sample.rows) console.log('    ', row.eventName, JSON.stringify(row.cells))

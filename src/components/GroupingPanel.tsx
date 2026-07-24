import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { patchWcif } from '../wca/api'
import type { CompetitionListItem, Wcif } from '../wca/types'
import { listRounds, acceptedCompetitors } from '../wca/wcif'
import {
  generateGroups,
  defaultRoundConfig,
  type GroupingConfig,
  type GroupingResult,
  type RoundGroupConfig,
} from '../wca/grouping'
import { buildScorecards, type RoundSelection } from '../scorecards/build'
import { downloadScorecardsPdf } from '../scorecards/export'
import { downloadCompetitorCardsPdf } from '../scorecards/competitorCards'
import { PAPER_OPTIONS, type PaperId } from '../scorecards/paper'

const NO_GROUP = new Set(['333fm', '333mbf'])

export function GroupingPanel({ wcif, competition }: { wcif: Wcif; competition: CompetitionListItem }) {
  const { token } = useAuth()
  const rounds = useMemo(() => listRounds(wcif).filter((r) => !NO_GROUP.has(r.eventId)), [wcif])
  const compCount = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of rounds) m[r.roundId] = acceptedCompetitors(wcif, r.eventId).length
    return m
  }, [rounds, wcif])

  const [stations, setStations] = useState(8)
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rounds.map((r) => [r.roundId, r.roundNumber === 1])),
  )
  const [cfg, setCfg] = useState<Record<string, RoundGroupConfig>>({})
  const [result, setResult] = useState<GroupingResult | null>(null)
  const [paper, setPaper] = useState<PaperId>('a4')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // (Re)calcula padrões quando o nº de estações muda.
  useEffect(() => {
    setCfg(
      Object.fromEntries(
        rounds.map((r) => [r.roundId, defaultRoundConfig(compCount[r.roundId] ?? 0, stations, r.roundNumber)]),
      ),
    )
  }, [rounds, compCount, stations])

  const setRound = (id: string, patch: Partial<RoundGroupConfig>) =>
    setCfg((c) => ({ ...c, [id]: { ...c[id], ...patch } }))

  const selectedIds = rounds.filter((r) => selected[r.roundId]).map((r) => r.roundId)

  const gerar = () => {
    setBusy('gerar')
    setMsg(null)
    try {
      const config: GroupingConfig = { stations, perRound: cfg }
      setResult(generateGroups(wcif, selectedIds, config))
    } finally {
      setBusy(null)
    }
  }

  const salvar = async () => {
    if (!result || !token) return
    setBusy('salvar')
    setMsg(null)
    try {
      await patchWcif(token.accessToken, competition.id, result.wcif)
      setMsg({ kind: 'ok', text: 'Grupos e atribuições salvos na WCA com sucesso.' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Falha ao salvar.' })
    } finally {
      setBusy(null)
    }
  }

  const baixarSumulas = async () => {
    if (!result) return
    setBusy('sumulas')
    try {
      const selections: RoundSelection[] = result.rounds.map((r) => ({
        round: listRounds(result.wcif).find((x) => x.roundId === r.roundId)!,
        groupNumbers: [],
      }))
      const models = buildScorecards(result.wcif, selections)
      await downloadScorecardsPdf(models, { paperId: paper }, `sumulas-${competition.id}-${paper}.pdf`)
    } finally {
      setBusy(null)
    }
  }

  const baixarCartoes = async () => {
    if (!result) return
    setBusy('cartoes')
    try {
      await downloadCompetitorCardsPdf(result.wcif, `cartoes-${competition.id}.pdf`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="pb-8">
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label" htmlFor="stations">
              Estações de resolução
            </label>
            <input
              id="stations"
              type="number"
              min={1}
              max={64}
              className="input w-28"
              value={stations}
              onChange={(e) => setStations(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <p className="flex-1 text-xs text-app-faint">
            As estações definem a sugestão de nº de grupos, embaralhadores, runners e juízes (mesma
            lógica do Groupifier). Ajuste cada rodada abaixo se quiser.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rounds.map((r) => {
          const c = cfg[r.roundId]
          const on = !!selected[r.roundId]
          if (!c) return null
          return (
            <div key={r.roundId} className="card p-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-56 flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-500"
                    checked={on}
                    onChange={() => setSelected((s) => ({ ...s, [r.roundId]: !s[r.roundId] }))}
                  />
                  <span className="font-medium text-app-fg">
                    {r.eventName} <span className="text-app-faint">· {r.label}</span>
                  </span>
                  <span className="text-xs text-app-faint">{compCount[r.roundId]} inscritos</span>
                </label>

                {on && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Field label="Grupos">
                      <input type="number" min={1} max={30} className="input w-16 !py-1"
                        value={c.groups} onChange={(e) => setRound(r.roundId, { groups: Math.max(1, Number(e.target.value) || 1) })} />
                    </Field>
                    <Field label="Divisão">
                      <select className="input w-32 !py-1" value={c.sorting}
                        onChange={(e) => setRound(r.roundId, { sorting: e.target.value as RoundGroupConfig['sorting'] })}>
                        <option value="clustered">Por nível</option>
                        <option value="balanced">Equilibrada</option>
                      </select>
                    </Field>
                    <Field label="Emb.">
                      <input type="number" min={0} max={20} className="input w-14 !py-1"
                        value={c.scramblers} onChange={(e) => setRound(r.roundId, { scramblers: Math.max(0, Number(e.target.value) || 0) })} />
                    </Field>
                    <Field label="Runners">
                      <input type="number" min={0} max={20} className="input w-14 !py-1"
                        value={c.runners} onChange={(e) => setRound(r.roundId, { runners: Math.max(0, Number(e.target.value) || 0) })} />
                    </Field>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={c.assignJudges}
                        onChange={(e) => setRound(r.roundId, { assignJudges: e.target.checked })} />
                      Juízes
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={c.stationNumbers}
                        onChange={(e) => setRound(r.roundId, { stationNumbers: e.target.checked })} />
                      Estações
                    </label>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-primary" onClick={gerar} disabled={selectedIds.length === 0 || busy !== null}>
          {busy === 'gerar' ? 'Gerando…' : 'Gerar grupos'}
        </button>
      </div>

      {msg && (
        <div className={'mt-4 rounded-lg border px-4 py-3 text-sm ' + (msg.kind === 'ok'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          : 'border-accent-red/40 bg-accent-red/10 text-red-200')}>
          {msg.text}
        </div>
      )}

      {result && (
        <div className="mt-5 card p-4">
          <h3 className="mb-3 text-sm font-bold text-app-fg">Grupos gerados</h3>
          <div className="space-y-3">
            {result.rounds.map((r) => (
              <div key={r.roundId}>
                <div className="text-sm font-medium text-app-fg">{r.label}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {r.groups.map((g) => (
                    <span key={g.number} className="rounded-md border border-app-border bg-app-surface-2 px-2.5 py-1 text-xs text-app-fg">
                      Grupo {g.number}: <span className="font-semibold text-app-fg">{g.competitors}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!result.canSave && (
            <p className="mt-3 rounded-md border border-accent-yellow/40 bg-accent-yellow/10 px-3 py-2 text-xs text-amber-100">
              Alguma rodada não tem horário no cronograma da WCA, então os grupos foram criados só
              localmente (dá para gerar as súmulas e cartões). Para <strong>salvar na WCA</strong>,
              configure o cronograma da competição no site da WCA primeiro.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div>
              <label className="label" htmlFor="paper2">Folha das súmulas</label>
              <select id="paper2" className="input !py-1.5 !text-xs" value={paper}
                onChange={(e) => setPaper(e.target.value as PaperId)}>
                {PAPER_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <button className="btn-primary" onClick={baixarSumulas} disabled={busy !== null}>
              {busy === 'sumulas' ? 'Gerando…' : 'Baixar súmulas'}
            </button>
            <button className="btn-ghost" onClick={baixarCartoes} disabled={busy !== null}>
              {busy === 'cartoes' ? 'Gerando…' : 'Baixar cartões de competidor'}
            </button>
            <button className="btn-ghost" onClick={salvar} disabled={!result.canSave || busy !== null}
              title={result.canSave ? 'Grava os grupos no WCIF oficial' : 'Requer cronograma na WCA'}>
              {busy === 'salvar' ? 'Salvando…' : 'Salvar na WCA'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-app-muted">{label}</span>
      {children}
    </span>
  )
}

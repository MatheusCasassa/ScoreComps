import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchWcif } from '../wca/api'
import type { CompetitionListItem, Wcif } from '../wca/types'
import { listRounds, listGroups, competitorsInGroup, acceptedCompetitors, type RoundInfo } from '../wca/wcif'
import { buildScorecards, type RoundSelection } from '../scorecards/build'
import { downloadScorecardsPdf, scorecardsBlobUrl } from '../scorecards/export'
import { PAPER_OPTIONS, type PaperId } from '../scorecards/paper'
import { Spinner } from './Spinner'
import { ScorecardPreview } from './ScorecardPreview'
import { GroupingPanel } from './GroupingPanel'

interface PreparedGroup {
  number: number
  label: string
  count: number
  activityIds: number[]
}
interface PreparedRound {
  info: RoundInfo
  groups: PreparedGroup[]
  fallback: boolean
}

function prepare(wcif: Wcif): PreparedRound[] {
  return listRounds(wcif).map((info) => {
    const raw = listGroups(wcif, info.roundId)
    if (raw.length === 0) {
      const count = acceptedCompetitors(wcif, info.eventId).length
      return {
        info,
        fallback: true,
        groups: [{ number: 1, label: 'Todos os inscritos', count, activityIds: [] }],
      }
    }
    return {
      info,
      fallback: false,
      groups: raw.map((g) => ({
        number: g.number,
        label: g.label,
        count: competitorsInGroup(wcif, g.activityIds).length,
        activityIds: g.activityIds,
      })),
    }
  })
}

export function CompetitionView({
  competition,
  onBack,
}: {
  competition: CompetitionListItem
  onBack: () => void
}) {
  const { token } = useAuth()
  const [wcif, setWcif] = useState<Wcif | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, Set<number>>>({})
  const [busy, setBusy] = useState(false)
  const [paper, setPaper] = useState<PaperId>('a4')
  const [tab, setTab] = useState<'sumulas' | 'grupos'>('sumulas')

  useEffect(() => {
    if (!token) return
    let active = true
    setWcif(null)
    setError(null)
    fetchWcif(token.accessToken, competition.id)
      .then((w) => active && setWcif(w))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Erro ao carregar WCIF.'))
    return () => {
      active = false
    }
  }, [token, competition.id])

  const prepared = useMemo(() => (wcif ? prepare(wcif) : []), [wcif])

  const toggleGroup = (roundId: string, n: number) =>
    setSelected((prev) => {
      const set = new Set(prev[roundId] ?? [])
      set.has(n) ? set.delete(n) : set.add(n)
      return { ...prev, [roundId]: set }
    })

  const toggleRound = (r: PreparedRound) =>
    setSelected((prev) => {
      const cur = prev[r.info.roundId] ?? new Set<number>()
      const allNums = r.groups.map((g) => g.number)
      const allOn = allNums.every((n) => cur.has(n)) && cur.size > 0
      return { ...prev, [r.info.roundId]: allOn ? new Set() : new Set(allNums) }
    })

  const selectAll = () =>
    setSelected(
      Object.fromEntries(prepared.map((r) => [r.info.roundId, new Set(r.groups.map((g) => g.number))])),
    )
  const clearAll = () => setSelected({})

  const { selections, totalCards } = useMemo(() => {
    const sels: RoundSelection[] = []
    let total = 0
    for (const r of prepared) {
      const set = selected[r.info.roundId]
      if (!set || set.size === 0) continue
      sels.push({ round: r.info, groupNumbers: [...set] })
      total += r.groups.filter((g) => set.has(g.number)).reduce((a, g) => a + g.count, 0)
    }
    return { selections: sels, totalCards: total }
  }, [prepared, selected])

  const previewModel = useMemo(() => {
    if (!wcif || selections.length === 0) return null
    return buildScorecards(wcif, selections)[0] ?? null
  }, [wcif, selections])

  const generate = async (openInTab: boolean) => {
    if (!wcif || selections.length === 0) return
    setBusy(true)
    try {
      const models = buildScorecards(wcif, selections)
      const opts = { paperId: paper }
      if (openInTab) {
        const url = await scorecardsBlobUrl(models, opts)
        window.open(url, '_blank')
      } else {
        await downloadScorecardsPdf(models, opts, `sumulas-${competition.id}-${paper}.pdf`)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <button onClick={onBack} className="mb-4 text-sm text-brand-400 hover:underline">
        ← Voltar às competições
      </button>
      <h2 className="text-lg font-bold">{competition.name}</h2>

      {error && (
        <div className="mt-4 rounded-lg border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!wcif && !error && <Spinner label="Carregando rodadas e grupos…" />}

      {wcif && (
        <div className="mt-4 flex gap-1 border-b border-app-border">
          {(['grupos', 'sumulas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ' +
                (tab === t ? 'bg-app-surface-2 text-app-fg' : 'text-app-muted hover:text-app-fg')
              }
            >
              {t === 'grupos' ? 'Agrupamento & staff' : 'Súmulas (grupos existentes)'}
            </button>
          ))}
        </div>
      )}

      {wcif && tab === 'grupos' && (
        <div className="mt-4">
          <GroupingPanel wcif={wcif} competition={competition} />
        </div>
      )}

      {wcif && tab === 'sumulas' && (
        <>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex gap-2">
              <button className="btn-ghost !py-1.5 !text-xs" onClick={selectAll}>
                Selecionar tudo
              </button>
              <button className="btn-ghost !py-1.5 !text-xs" onClick={clearAll}>
                Limpar
              </button>
            </div>
            <div>
              <label className="label" htmlFor="paper">
                Tamanho da folha
              </label>
              <select
                id="paper"
                className="input !py-1.5 !text-xs"
                value={paper}
                onChange={(e) => setPaper(e.target.value as PaperId)}
              >
                {PAPER_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {previewModel && (
            <div className="mt-5 flex flex-col items-center rounded-xl border border-app-border bg-app-surface p-5">
              <span className="mb-3 text-xs uppercase tracking-widest text-app-faint">
                Prévia da primeira súmula
              </span>
              <div className="origin-top scale-90">
                <ScorecardPreview model={previewModel} widthMm={105} />
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {prepared.map((r) => {
              const set = selected[r.info.roundId] ?? new Set<number>()
              const roundOn = set.size > 0
              return (
                <div key={r.info.roundId} className="card p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-500"
                      checked={roundOn}
                      onChange={() => toggleRound(r)}
                    />
                    <span className="font-medium text-app-fg">
                      {r.info.eventName}{' '}
                      <span className="text-app-faint">· {r.info.label}</span>
                    </span>
                  </label>

                  <div className="mt-3 flex flex-wrap gap-2 pl-7">
                    {r.groups.map((g) => {
                      const on = set.has(g.number)
                      return (
                        <button
                          key={g.number}
                          onClick={() => toggleGroup(r.info.roundId, g.number)}
                          className={
                            'rounded-md border px-2.5 py-1 text-xs transition-colors ' +
                            (on
                              ? 'border-brand-500 bg-brand-600/20 text-brand-200'
                              : 'border-app-border bg-app-surface-2 text-app-muted hover:border-app-border-strong')
                          }
                        >
                          {g.label} · {g.count}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Barra fixa de ação */}
      {wcif && tab === 'sumulas' && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-app-border bg-app-bg backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <span className="text-sm text-app-muted">
              {totalCards} súmula{totalCards === 1 ? '' : 's'} selecionada
              {totalCards === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <button
                className="btn-ghost"
                disabled={totalCards === 0 || busy}
                onClick={() => generate(true)}
              >
                Pré-visualizar
              </button>
              <button
                className="btn-primary"
                disabled={totalCards === 0 || busy}
                onClick={() => generate(false)}
              >
                {busy ? 'Gerando…' : 'Baixar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

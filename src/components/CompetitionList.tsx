import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchManagedCompetitions } from '../wca/api'
import type { CompetitionListItem } from '../wca/types'
import { Spinner } from './Spinner'

function formatDate(d?: string): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function CompetitionList({ onSelect }: { onSelect: (c: CompetitionListItem) => void }) {
  const { token, isDelegate, setManagesCompetitions } = useAuth()
  const [comps, setComps] = useState<CompetitionListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let active = true
    fetchManagedCompetitions(token.accessToken)
      .then((list) => {
        if (!active) return
        setComps(list)
        setManagesCompetitions(list.length > 0)
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Erro ao carregar.'))
    return () => {
      active = false
    }
  }, [token, setManagesCompetitions])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </div>
    )
  }

  if (!comps) return <Spinner label="Carregando suas competições…" />

  // Acesso negado: não é delegado e não gerencia nenhuma competição.
  if (comps.length === 0 && !isDelegate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold">Acesso restrito</h2>
          <p className="mt-3 text-sm text-slate-400">
            Sua conta WCA não é Delegada nem Organizadora de nenhuma competição. Esta ferramenta é
            exclusiva para quem gerencia competições na WCA.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="mb-1 text-lg font-bold">Suas competições</h2>
      <p className="mb-5 text-sm text-slate-500">
        Apenas competições em que você é Delegado ou Organizador aparecem aqui.
      </p>

      {comps.length === 0 ? (
        <p className="text-sm text-slate-400">
          Você é Delegado, mas não há competições gerenciáveis no momento.
        </p>
      ) : (
        <ul className="space-y-2">
          {comps.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c)}
                className="card flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:border-brand-500/60 hover:bg-ink-800"
              >
                <span>
                  <span className="block font-medium text-slate-100">{c.name}</span>
                  <span className="block text-xs text-slate-500">
                    {formatDate(c.start_date)}
                    {c.city ? ` · ${c.city}` : ''}
                  </span>
                </span>
                <span className="text-brand-400" aria-hidden>
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { isConfigured } from '../config'
import { downloadScorecardsPdf } from '../scorecards/export'
import { demoModels } from '../scorecards/demo'
import { PAPER_OPTIONS, type PaperId } from '../scorecards/paper'
import { ScorecardPreview } from './ScorecardPreview'

export function Login() {
  const { login, error } = useAuth()
  const configured = isConfigured()
  const [paper, setPaper] = useState<PaperId>('a4')
  const [busy, setBusy] = useState(false)
  const preview = demoModels()[1] // nome longo com caracteres CJK

  const gerarExemplo = async () => {
    setBusy(true)
    try {
      await downloadScorecardsPdf(demoModels(), { paperId: paper }, `sumulas-exemplo-${paper}.pdf`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="grid items-start gap-8 md:grid-cols-2">
        <div className="card p-8">
          <h1 className="text-2xl font-bold">
            Score<span className="text-accent-red">Comps</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Ferramenta para <strong className="text-slate-200">Delegados</strong> e{' '}
            <strong className="text-slate-200">Organizadores</strong>: agrupamento, atribuição de
            staff e <strong className="text-slate-200">súmulas</strong> em PDF, a partir dos dados
            oficiais da WCA.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {!configured && (
            <div className="mt-5 rounded-lg border border-accent-yellow/40 bg-accent-yellow/10 px-4 py-3 text-sm text-amber-100">
              <strong>Configuração pendente.</strong> Defina <code>VITE_WCA_CLIENT_ID</code> no
              arquivo <code>.env</code> (veja o README).
            </div>
          )}

          <div className="mt-6">
            <label className="label" htmlFor="paper">
              Tamanho da folha
            </label>
            <select
              id="paper"
              className="input"
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

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={login} disabled={!configured}>
              Entrar com a conta WCA
            </button>
            <button className="btn-ghost" onClick={gerarExemplo} disabled={busy}>
              {busy ? 'Gerando…' : 'Baixar PDF de exemplo'}
            </button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Login oficial da WCA (OAuth) — nenhuma senha passa por aqui e nenhum segredo é
            armazenado. Roda 100% no seu navegador.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <span className="mb-3 text-xs uppercase tracking-widest text-slate-500">
            Prévia da súmula
          </span>
          <div className="origin-top scale-90 sm:scale-100">
            <ScorecardPreview model={preview} widthMm={105} />
          </div>
        </div>
      </div>
    </div>
  )
}

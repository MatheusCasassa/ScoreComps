import { useAuth } from '../auth/AuthContext'
import { isConfigured } from '../config'

export function Login() {
  const { login, error } = useAuth()
  const configured = isConfigured()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-20 text-center sm:py-28">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
        Score<span className="text-navy dark:text-canary">Comps</span>
      </h1>

      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-app-fg sm:text-xl">
        O ScoreComps é uma ferramenta feita para facilitar Delegados e Organizadores com as
        principais tarefas para uma competição: <strong>Agrupamento</strong>,{' '}
        <strong>Atribuição de Tarefas</strong> e <strong>Geração de Súmulas em PDF</strong>, tudo a
        partir dos dados oficiais da WCA.
      </p>

      <p className="mt-5 max-w-2xl text-base leading-relaxed text-app-muted">
        Para utilizar a ferramenta, é necessário fazer login em sua conta WCA. Nenhuma senha ou
        armazenamento passam por aqui, roda 100% no seu navegador.
      </p>

      {error && (
        <div className="mt-8 w-full max-w-md rounded-lg border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-red-500 dark:text-red-200">
          {error}
        </div>
      )}

      {!configured && (
        <div className="mt-8 w-full max-w-md rounded-lg border border-accent-yellow/40 bg-accent-yellow/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
          <strong>Configuração pendente.</strong> Defina <code>VITE_WCA_CLIENT_ID</code> no build.
        </div>
      )}

      <button
        onClick={login}
        disabled={!configured}
        className="btn-primary mt-10 gap-3 px-8 py-4 text-base sm:text-lg"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3.2a6.8 6.8 0 0 1 6.2 4h-4.1a2.8 2.8 0 0 0-4.2 0H5.8a6.8 6.8 0 0 1 6.2-4zM5.2 12a6.8 6.8 0 0 1 .3-2h4.1a2.8 2.8 0 0 0 2.1 3.6l-2 3.5A6.8 6.8 0 0 1 5.2 12zm7.9 6.7 2-3.6a2.8 2.8 0 0 0 1.4-1.5h4.1a6.8 6.8 0 0 1-7.5 5.1z" />
        </svg>
        Entrar com a conta WCA
      </button>
    </div>
  )
}

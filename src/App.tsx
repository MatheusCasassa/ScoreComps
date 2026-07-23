import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { Header } from './components/Header'
import { Login } from './components/Login'
import { CompetitionList } from './components/CompetitionList'
import { CompetitionView } from './components/CompetitionView'
import { Spinner } from './components/Spinner'
import type { CompetitionListItem } from './wca/types'

export default function App() {
  const { status } = useAuth()
  const [competition, setCompetition] = useState<CompetitionListItem | null>(null)

  return (
    <div className="min-h-full">
      <Header />
      <main>
        {status === 'loading' && <Spinner label="Verificando sessão…" />}

        {(status === 'anonymous' || status === 'error') && <Login />}

        {status === 'authenticated' &&
          (competition ? (
            <CompetitionView competition={competition} onBack={() => setCompetition(null)} />
          ) : (
            <CompetitionList onSelect={setCompetition} />
          ))}
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-600">
        Ferramenta não oficial · dados via API da WCA · feito para a comunidade CubingSP
      </footer>
    </div>
  )
}

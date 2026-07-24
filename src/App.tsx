import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { Header } from './components/Header'
import { Login } from './components/Login'
import { CompetitionList } from './components/CompetitionList'
import { CompetitionView } from './components/CompetitionView'
import { Spinner } from './components/Spinner'
import { Footer } from './components/Footer'
import type { CompetitionListItem } from './wca/types'

export default function App() {
  const { status } = useAuth()
  const [competition, setCompetition] = useState<CompetitionListItem | null>(null)

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
        {status === 'loading' && <Spinner label="Verificando sessão…" />}

        {(status === 'anonymous' || status === 'error') && <Login />}

        {status === 'authenticated' &&
          (competition ? (
            <CompetitionView competition={competition} onBack={() => setCompetition(null)} />
          ) : (
            <CompetitionList onSelect={setCompetition} />
          ))}
      </main>

      <Footer />
    </div>
  )
}

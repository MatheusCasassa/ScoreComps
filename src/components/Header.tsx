import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getTheme, applyTheme, type Theme } from '../theme'

/** Marca do ScoreComps: cubo amarelo canarinho sobre azul escuro. */
export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  const canary = '#ffdf00'
  const cells = [
    [0, 0], [2, 0], [1, 1], [0, 2], [2, 2], // amarelo (checkerboard)
  ]
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#14235e" />
      {cells.map(([c, r], i) => (
        <rect key={i} x={5 + c * 7.5} y={5 + r * 7.5} width="6.6" height="6.6" rx="1.4" fill={canary} />
      ))}
    </svg>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="text-base font-extrabold leading-none tracking-tight">
        Score<span className="text-navy dark:text-canary">Comps</span>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    applyTheme(next)
  }
  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-app-border bg-app-surface-2 p-2 text-app-muted transition-colors hover:text-app-fg"
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
      aria-label="Alternar tema"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}

export function Header() {
  const { status, me, logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 border-b border-app-border bg-app-bg backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <Logo />
        <div className="flex items-center gap-3">
          {status === 'authenticated' && me && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium text-app-fg">{me.name}</div>
                <div className="text-[11px] text-app-faint">{me.wca_id ?? 'sem WCA ID'}</div>
              </div>
              <button className="btn-ghost !py-1.5 !text-xs" onClick={logout}>
                Sair
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

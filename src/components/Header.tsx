import { useAuth } from '../auth/AuthContext'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="6" fill="#161923" />
        <rect x="6" y="6" width="6.5" height="6.5" rx="1.2" fill="#3b5bea" />
        <rect x="13" y="6" width="6.5" height="6.5" rx="1.2" fill="#f4f5f8" />
        <rect x="20" y="6" width="6.5" height="6.5" rx="1.2" fill="#c81e3c" />
        <rect x="6" y="13" width="6.5" height="6.5" rx="1.2" fill="#f4f5f8" />
        <rect x="13" y="13" width="6.5" height="6.5" rx="1.2" fill="#c81e3c" />
        <rect x="20" y="13" width="6.5" height="6.5" rx="1.2" fill="#3b5bea" />
        <rect x="6" y="20" width="6.5" height="6.5" rx="1.2" fill="#c81e3c" />
        <rect x="13" y="20" width="6.5" height="6.5" rx="1.2" fill="#3b5bea" />
        <rect x="20" y="20" width="6.5" height="6.5" rx="1.2" fill="#f4f5f8" />
      </svg>
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-tight">
          Score<span className="text-accent-red">Comps</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500">CubingSP</div>
      </div>
    </div>
  )
}

export function Header() {
  const { status, me, logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo />
        {status === 'authenticated' && me && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-slate-200">{me.name}</div>
              <div className="text-[11px] text-slate-500">{me.wca_id ?? 'sem WCA ID'}</div>
            </div>
            <button className="btn-ghost !py-1.5 !text-xs" onClick={logout}>
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

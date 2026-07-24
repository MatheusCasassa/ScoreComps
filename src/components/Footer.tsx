export const APP_VERSION = 'v0.2'

const LINKS = {
  guide: 'https://github.com/MatheusCasassa/ScoreComps/wiki/Guide',
  github: 'https://github.com/MatheusCasassa/ScoreComps',
  email: 'mailto:matcasviana@gmail.com',
  wca: 'https://www.worldcubeassociation.org/persons/2017VIAN01',
}

function IconLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      title={title}
      aria-label={title}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      className="text-app-faint transition-colors hover:text-app-fg"
    >
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-app-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <span className="text-xs text-app-muted">
          Desenvolvido por <strong className="text-app-fg">Matheus Casassa</strong> para a comunidade
          Speedcubing 😎
        </span>

        <div className="flex items-center gap-4">
          <IconLink href={LINKS.guide} title="Guia de uso">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
              <path d="M19 17H6a2 2 0 0 0-2 2" />
              <path d="M8 7h7M8 10.5h7" />
            </svg>
          </IconLink>

          <IconLink href={LINKS.github} title="Repositório no GitHub">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
            </svg>
          </IconLink>

          <IconLink href={LINKS.email} title="Enviar e-mail">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3.5 6.5 8.5 6 8.5-6" />
            </svg>
          </IconLink>

          <IconLink href={LINKS.wca} title="Perfil na WCA">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
              <path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" />
            </svg>
          </IconLink>

          <span className="text-xs font-medium text-app-faint">{APP_VERSION}</span>
        </div>
      </div>
    </footer>
  )
}

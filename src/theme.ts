// Tema claro/escuro. Escuro é o padrão. Persistido em localStorage.
export type Theme = 'light' | 'dark'

const KEY = 'scorecomps.theme'

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* ignore */
  }
}

export function initTheme(): void {
  applyTheme(getTheme())
}

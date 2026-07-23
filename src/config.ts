// Configuração central lida das variáveis de ambiente do Vite.
// Todas são públicas por natureza (cliente público, sem secret).

const rawOrigin = (import.meta.env.VITE_WCA_ORIGIN ?? 'https://www.worldcubeassociation.org').replace(
  /\/$/,
  '',
)

export const config = {
  /** Client ID (Application UID) do app OAuth registrado na WCA. */
  wcaClientId: import.meta.env.VITE_WCA_CLIENT_ID ?? '',

  /** Origem da WCA (produção ou staging). */
  wcaOrigin: rawOrigin,

  /** Endpoints derivados. */
  get wcaAuthorizeUrl() {
    return `${this.wcaOrigin}/oauth/authorize`
  },
  get wcaTokenUrl() {
    return `${this.wcaOrigin}/oauth/token`
  },
  get wcaApiBase() {
    return `${this.wcaOrigin}/api/v0`
  },

  /** Redirect URI = raiz atual do app (implicit grant volta o token no #). */
  get redirectUri() {
    const base = import.meta.env.BASE_URL || '/'
    return `${window.location.origin}${base}`.replace(/([^:]\/)\/+/g, '$1')
  },

  /** Escopos solicitados. manage_competitions dá acesso ao WCIF gerenciável. */
  scopes: ['public', 'manage_competitions'] as const,
}

export const isConfigured = () => config.wcaClientId.trim().length > 0

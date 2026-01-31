/**
 * URL pública do app (para QR codes e deep links).
 * Use VITE_APP_URL em produção para que o QR impresso na gaiola abra no app
 * mesmo quando escaneado em outro dispositivo.
 */
function getAppBaseUrl(): string {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) {
        return (import.meta.env.VITE_APP_URL as string).replace(/\/$/, '')
    }
    if (typeof window !== 'undefined') return window.location.origin
    return ''
}

/**
 * URL para abrir a gaiola (casal) no app.
 * Ao escanear o QR code no celular, abre a página da gaiola; se o PWA estiver instalado, abre no PWA.
 */
export function getGaiolaAppUrl(casalId: number): string {
    const base = getAppBaseUrl()
    return base ? `${base}/gaiola/${casalId}` : `/gaiola/${casalId}`
}

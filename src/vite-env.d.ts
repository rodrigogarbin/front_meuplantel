/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
    readonly VITE_API_URL?: string
    /** URL pública do app (para QR codes e deep links). Ex: https://app.meuplantel.com */
    readonly VITE_APP_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

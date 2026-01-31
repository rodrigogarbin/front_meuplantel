/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string
    /** URL pública do app (para QR codes e deep links). Ex: https://app.meuplantel.com */
    readonly VITE_APP_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

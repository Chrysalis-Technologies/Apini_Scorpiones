
/// <reference types="vite/client" />

declare let self: ServiceWorkerGlobalScope

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __WB_MANIFEST: Array<{ url: string; revision: string }>

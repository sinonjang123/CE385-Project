/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL of the user website. Defaults to http://localhost:5173 in development. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

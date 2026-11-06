/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL of the separate admin app. Defaults to http://localhost:5174 in development. */
  readonly VITE_ADMIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

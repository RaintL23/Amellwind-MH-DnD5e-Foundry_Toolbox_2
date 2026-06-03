/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_5ETOOLS_DATA?: "local" | "remote";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_5ETOOLS_DATA?: "local" | "remote";
  /** Override the 5etools mirror repo slug, e.g. "5etools-mirror-4/5etools-src". */
  readonly VITE_5ETOOLS_MIRROR?: string;
  /** Override the 5etools mirror git ref (branch/tag/commit). Default: "main". */
  readonly VITE_5ETOOLS_REF?: string;
  /** Override the Amellwind homebrew repo slug, e.g. "TheGiddyLimit/homebrew". */
  readonly VITE_HOMEBREW_MIRROR?: string;
  /** Override the homebrew git ref (branch/tag/commit). Default: "master". */
  readonly VITE_HOMEBREW_REF?: string;
  /** Override the Unearthed Arcana repo slug, e.g. "TheGiddyLimit/unearthed-arcana". */
  readonly VITE_UA_MIRROR?: string;
  /** Override the UA git ref (branch/tag/commit). Default: "master". */
  readonly VITE_UA_REF?: string;
  /** Public site origin used in Foundry description deep links. */
  readonly VITE_PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

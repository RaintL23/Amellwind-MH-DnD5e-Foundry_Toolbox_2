/**
 * In-memory hand-off of portrait/token art into the next Builder mount (e.g.
 * Character Sheet → Edit in Builder). Art is too large for the localStorage
 * autosave, and SPA navigation keeps this module alive between routes.
 */
import type { BuilderCharacterArt } from "../builder-json/builder-character.types";

let pendingArt: BuilderCharacterArt | null = null;

export function handOffBuilderArt(art: BuilderCharacterArt | null | undefined): void {
  pendingArt = art && (art.portrait || art.token) ? art : null;
}

/** Returns and clears the pending art (null when nothing was handed off). */
export function consumeBuilderArtHandoff(): BuilderCharacterArt | null {
  const art = pendingArt;
  pendingArt = null;
  return art;
}

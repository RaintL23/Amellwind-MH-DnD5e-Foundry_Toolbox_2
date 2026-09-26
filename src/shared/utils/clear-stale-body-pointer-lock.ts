/**
 * Radix modal stacks (Dropdown → Sheet/Dialog, nested Dialog on Sheet) can leave
 * `document.body.style.pointerEvents = "none"` after the last overlay closes,
 * freezing the UI. Call when an overlay closes.
 */
export function clearStaleBodyPointerLock(): void {
  window.setTimeout(() => {
    const openOverlay = document.querySelector(
      '[role="dialog"][data-state="open"], [data-radix-menu-content][data-state="open"], [data-radix-select-content][data-state="open"]',
    );
    if (!openOverlay) {
      document.body.style.pointerEvents = "";
    }
  }, 0);
}

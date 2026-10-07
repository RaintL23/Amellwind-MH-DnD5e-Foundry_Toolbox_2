/** Smooth scrolling unless the user prefers reduced motion. */
export function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined" || !window.matchMedia) return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

export const CLASS_FEATURE_ANCHOR_PREFIX = "class-feature-";

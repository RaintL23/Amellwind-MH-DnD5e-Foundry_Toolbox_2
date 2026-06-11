export const ORIGIN_FEAT_SOURCE_NAME = "Origin Feat";

/** Prefix for Origin Feats granted by optional features (invocations, etc.). */
export const INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX = "Origin Feat · ";

export function formatInvocationOriginFeatSourceName(
  featureName: string,
  duplicateIndex: number,
): string {
  if (duplicateIndex === 0) {
    return `${INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX}${featureName}`;
  }
  return `${INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX}${featureName} (${duplicateIndex + 1})`;
}

export function isInvocationOriginFeatSourceName(name: string): boolean {
  return name.startsWith(INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX);
}

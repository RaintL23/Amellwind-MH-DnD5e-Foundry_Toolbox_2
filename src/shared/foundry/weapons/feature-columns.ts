/** Combat Features column labels (not weapon-resource unlocks). */
export function isPrimaryFeaturesColumn(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    lower === "features" ||
    lower.includes("single features") ||
    lower.includes("splint features")
  );
}

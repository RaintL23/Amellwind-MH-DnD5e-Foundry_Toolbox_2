export function tagVariant(tag: string): "blue" | "orange" | "green" | "red" {
  if (tag.startsWith("class:")) return "blue";
  if (tag.startsWith("weapon-type:")) return "orange";
  if (tag.startsWith("type:")) return "red";
  return "green";
}

export function formatTag(tag: string): string {
  const stripped = tag.replace(/^(class:|weapon-type:|mechanic:|type:)/, "");
  const colonIdx = stripped.indexOf(":");
  if (colonIdx === -1) return stripped;
  return `${stripped.slice(0, colonIdx)} (${stripped.slice(colonIdx + 1)})`;
}

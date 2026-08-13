import { ExternalLink } from "lucide-react";

export interface RuleSegment {
  type: "text" | "bold" | "link";
  content: string;
  href?: string;
}

export function parseRuleText(raw: string): RuleSegment[] {
  const segments: RuleSegment[] = [];
  const regex =
    /\{@b ([^}]+)\}|\{@link ([^|]+)\|([^}]+)\}|\{@[a-zA-Z]+ ([^}|]+)(?:\|[^}]*)?\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > last)
      segments.push({ type: "text", content: raw.slice(last, match.index) });
    if (match[1] !== undefined)
      segments.push({ type: "bold", content: match[1] });
    else if (match[2] !== undefined)
      segments.push({ type: "link", content: match[2], href: match[3] });
    else if (match[4] !== undefined)
      segments.push({ type: "text", content: match[4] });
    last = match.index + match[0].length;
  }
  if (last < raw.length)
    segments.push({ type: "text", content: raw.slice(last) });
  return segments;
}

export function RuleText({ raw }: { raw: string }) {
  const segments = parseRuleText(raw);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "bold")
          return (
            <strong key={i} className="text-foreground font-semibold">
              {seg.content}
            </strong>
          );
        if (seg.type === "link")
          return (
            <a
              key={i}
              href={seg.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-sky-400 hover:underline"
            >
              {seg.content}
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        return <span key={i}>{seg.content}</span>;
      })}
    </>
  );
}

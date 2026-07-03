import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import {
  parseRuleText,
  type RuleSegment,
} from "@/features/environments/components/RuleText";

export const HUNT_ROLES_GUIDE_PATH = "/character-guide?tab=hunt-roles";

const HUNT_ROLE_NAMES = new Set([
  "trailblazer",
  "scout",
  "spotter",
  "artisan",
]);

const HUNT_ROLE_REGEX =
  /\b(Trailblazer|Scout|Spotter|Artisan|trailblazer|scout|spotter|artisan)\b/g;

export function isHuntRoleName(name: string): boolean {
  return HUNT_ROLE_NAMES.has(name.trim().toLowerCase());
}

export function HuntRoleName({ name }: { name: string }) {
  if (!isHuntRoleName(name)) {
    return <>{name}</>;
  }

  return (
    <Link
      to={HUNT_ROLES_GUIDE_PATH}
      className="font-semibold text-primary hover:underline"
    >
      {name}
    </Link>
  );
}

function withHuntRoleLinks(content: string, keyPrefix: string) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(HUNT_ROLE_REGEX.source, "g");

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      nodes.push(
        <span key={`${keyPrefix}-t-${match.index}`}>
          {content.slice(last, match.index)}
        </span>,
      );
    }
    nodes.push(
      <Link
        key={`${keyPrefix}-r-${match.index}`}
        to={HUNT_ROLES_GUIDE_PATH}
        className="font-semibold text-primary hover:underline"
      >
        {match[1]}
      </Link>,
    );
    last = match.index + match[0].length;
  }

  if (last < content.length) {
    nodes.push(
      <span key={`${keyPrefix}-end`}>{content.slice(last)}</span>,
    );
  }

  return nodes.length > 0 ? nodes : content;
}

function renderSegment(seg: RuleSegment, index: number) {
  if (seg.type === "bold") {
    return (
      <strong key={index} className="text-foreground font-semibold">
        {withHuntRoleLinks(seg.content, `bold-${index}`)}
      </strong>
    );
  }

  if (seg.type === "link") {
    return (
      <a
        key={index}
        href={seg.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-sky-400 hover:underline"
      >
        {seg.content}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <span key={index}>{withHuntRoleLinks(seg.content, `text-${index}`)}</span>
  );
}

export function HuntRuleText({ raw }: { raw: string }) {
  const segments = parseRuleText(raw);
  return <>{segments.map(renderSegment)}</>;
}

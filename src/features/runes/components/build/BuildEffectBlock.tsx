import { DndRichText } from "@/shared/components/DndRichText";
import { cn } from "@/shared/utils/cn";

interface BuildEffectBlockProps {
  runeName: string;
  monsterName: string;
  effect: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
}

export function BuildEffectBlock({
  runeName,
  monsterName,
  effect,
  accentColor,
  borderColor,
  bgColor,
}: BuildEffectBlockProps) {
  return (
    <div className={cn("rounded-md border px-3 py-2.5 space-y-1.5", borderColor, bgColor)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-xs font-semibold", accentColor)}>{runeName}</span>
        <span className="text-xs text-muted-foreground/50 truncate shrink-0">{monsterName}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        <DndRichText text={effect} />
      </p>
    </div>
  );
}

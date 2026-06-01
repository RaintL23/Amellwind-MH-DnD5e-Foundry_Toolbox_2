import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

interface EffectSectionProps {
  label: string;
  text: string;
}

export function EffectSection({ label, text }: EffectSectionProps) {
  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
        {label}
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {parseFiveToolsMarkup(text)}
      </p>
    </div>
  );
}

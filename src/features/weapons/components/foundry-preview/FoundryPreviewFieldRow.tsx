import type { ReactNode } from "react";

export function FieldRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-0.5 text-xs sm:grid-cols-[9rem_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0">
        <div className="text-foreground/90 break-words">{value}</div>
        {hint ? (
          <p className="text-[10px] text-muted-foreground/80">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h4>
  );
}

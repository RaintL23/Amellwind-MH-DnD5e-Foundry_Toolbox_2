export function StatBadge({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-card/60 px-3 py-2 min-w-[70px]">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

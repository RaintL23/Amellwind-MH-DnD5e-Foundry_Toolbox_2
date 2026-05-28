import { cn } from "@/shared/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "blue" | "orange" | "green" | "red";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "border border-border text-foreground": variant === "outline",
          "bg-blue-900/50 text-blue-300 border border-blue-700": variant === "blue",
          "bg-orange-900/50 text-orange-300 border border-orange-700": variant === "orange",
          "bg-green-900/50 text-green-300 border border-green-700": variant === "green",
          "bg-red-900/50 text-red-300 border border-red-700": variant === "red",
        },
        className
      )}
      {...props}
    />
  );
}

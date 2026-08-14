import { cn } from "@/shared/utils/cn";
import { resolveMhTokenPath } from "@/shared/utils/mh-token.utils";

interface MhTokenImageProps {
  name: string;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Use eager loading for above-the-fold hero tokens. */
  priority?: boolean;
}

const SIZE_CLASS = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-36 w-36",
} as const;

export function MhTokenImage({
  name,
  alt,
  className,
  size = "md",
  priority = false,
}: MhTokenImageProps) {
  const src = resolveMhTokenPath(name);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt ?? `${name} token`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn(
        "rounded-full border border-border/60 bg-muted/30 object-cover object-center shadow-sm",
        SIZE_CLASS[size],
        className,
      )}
    />
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

interface ScrollableWhenNeededProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  maxHeightClass?: string;
}

/**
 * Applies overflow-y-auto only when content exceeds max height so wheel events
 * propagate to parent scroll containers when there is nothing to scroll inside.
 */
export function ScrollableWhenNeeded({
  children,
  className,
  contentClassName,
  maxHeightClass = "max-h-[1400px]",
}: ScrollableWhenNeededProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const update = () => {
      setOverflowing(content.scrollHeight > container.clientHeight + 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(content);
    observer.observe(container);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-auto",
        maxHeightClass,
        overflowing && "overflow-y-auto pr-1",
        className,
      )}
    >
      <div ref={contentRef} className={cn("space-y-1", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

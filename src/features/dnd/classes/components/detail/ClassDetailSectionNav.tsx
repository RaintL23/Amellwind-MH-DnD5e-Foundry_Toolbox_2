import { memo, useEffect, useState, type RefObject } from "react";
import { cn } from "@/shared/utils/cn";
import { scrollBehavior } from "../../utils/class-detail-scroll.utils";

export interface ClassDetailSection {
  id: string;
  label: string;
  count?: number;
}

interface ClassDetailSectionNavProps {
  sections: ClassDetailSection[];
  scrollRootRef: RefObject<HTMLElement>;
}

/**
 * Sticky in-page nav for the class detail scroll container. Height must match
 * `--class-nav-h` (2.75rem) set on the container; other sticky offsets use it.
 */
export const ClassDetailSectionNav = memo(function ClassDetailSectionNav({
  sections,
  scrollRootRef,
}: ClassDetailSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const sectionKey = sections.map((s) => s.id).join("|");

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;
    const targets = sectionKey
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // Active = last section whose top has passed just below the sticky nav;
    // at the very bottom the last section wins even if it is short.
    let frame = 0;
    const update = () => {
      frame = 0;
      const threshold = root.getBoundingClientRect().top + 64;
      const atBottom =
        root.scrollTop + root.clientHeight >= root.scrollHeight - 4;
      let current = targets[0].id;
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= threshold) current = el.id;
      }
      if (atBottom) current = targets[targets.length - 1].id;
      setActiveId(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollRootRef, sectionKey]);

  const handleClick = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ block: "start", behavior: scrollBehavior() });
  };

  return (
    <nav
      aria-label="Class sections"
      className="sticky top-0 z-10 -mx-3 mb-3 flex h-11 items-center gap-1 overflow-x-auto border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 @lg/classdetail:-mx-4 @lg/classdetail:px-4 @4xl/classdetail:-mx-6 @4xl/classdetail:mb-4 @4xl/classdetail:px-6"
    >
      {sections.map((section) => {
        const active = section.id === activeId;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => handleClick(section.id)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              active
                ? "bg-sky-500/15 text-sky-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {section.label}
            {section.count !== undefined && (
              <span
                className={cn(
                  "hidden rounded-full px-1.5 text-[10px] tabular-nums @md/classdetail:inline",
                  active ? "bg-sky-500/20" : "bg-muted",
                )}
              >
                {section.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
});

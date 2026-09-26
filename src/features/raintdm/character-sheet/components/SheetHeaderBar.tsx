import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  Coffee,
  MoreHorizontal,
  Sparkles,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";
import type { ActionLocks } from "../utils/condition-effects.data";
import type {
  PlayCharacterCompiled,
  PlaySessionState,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import type { ConfirmDialogFn } from "../hooks/useConfirmDialog";
import { SheetStatStrip } from "./SheetStatStrip";
import { StatusChips } from "./StatusPanel";

interface SheetHeaderBarProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  locks: ActionLocks;
  effectiveAc: number;
  dispatch: (a: PlaySessionAction) => void;
  onOpenHp: () => void;
  onRest: (kind: "short" | "long") => void;
  onRollInit: () => void;
  onOpenStatus: () => void;
  confirm: ConfirmDialogFn;
  onEditInBuilder: () => void;
}

export function SheetHeaderBar({
  compiled,
  session,
  locks,
  effectiveAc,
  dispatch,
  onOpenHp,
  onRest,
  onRollInit,
  onOpenStatus,
  confirm,
  onEditInBuilder,
}: SheetHeaderBarProps) {
  const hpPct = Math.round(
    (session.hp.current / Math.max(1, session.hp.max)) * 100,
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full max-w-7xl space-y-2 px-3 py-2">
        <div className="flex items-start gap-2">
          <Link
            to="/sheet"
            aria-label="Back"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">
              {compiled.name}
            </h1>
            <p className="truncate text-[11px] text-muted-foreground">
              {compiled.className}
              {compiled.subclass ? ` (${compiled.subclass})` : ""} · Lv{" "}
              {compiled.level}
              {compiled.species ? ` · ${compiled.species}` : ""}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={session.inspiration ? "default" : "outline"}
            className="h-10 shrink-0 gap-1.5 px-2.5"
            onClick={() => dispatch({ type: "TOGGLE_INSPIRATION" })}
            title="Inspiration"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden text-xs sm:inline">
              {session.inspiration ? "Inspired" : "Inspire"}
            </span>
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 w-10 shrink-0 px-0"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  // Defer so the menu fully closes before the Rest sheet opens
                  // (avoids Radix pointer-events lock on body).
                  window.setTimeout(() => onRest("short"), 0);
                }}
              >
                <Coffee className="h-4 w-4" /> Short Rest
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  window.setTimeout(() => onRest("long"), 0);
                }}
              >
                <BedDouble className="h-4 w-4" /> Long Rest
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  window.setTimeout(() => onEditInBuilder(), 0);
                }}
              >
                Edit in Builder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SheetStatStrip
          compiled={compiled}
          locks={locks}
          effectiveAc={effectiveAc}
          onRollInit={onRollInit}
        />

        <button
          type="button"
          className="block w-full text-left"
          onClick={onOpenHp}
        >
          <div className="mb-1 flex justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Heart className="h-3.5 w-3.5" />
              {session.hp.current}/{session.hp.max}
              {session.hp.temp > 0 ? (
                <span className="text-sky-600 dark:text-sky-400">
                  (+{session.hp.temp})
                </span>
              ) : null}
            </span>
            <span className="text-muted-foreground">Tap to adjust</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                hpPct > 50
                  ? "bg-emerald-600"
                  : hpPct > 25
                    ? "bg-amber-500"
                    : "bg-destructive",
              )}
              style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
            />
          </div>
        </button>

        <StatusChips
          session={session}
          edition={compiled.rulesEdition}
          dispatch={dispatch}
          onOpenStatus={onOpenStatus}
          confirm={confirm}
        />
      </div>
    </header>
  );
}

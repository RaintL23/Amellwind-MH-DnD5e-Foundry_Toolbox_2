import { useRef, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { ImageIcon, Upload, X, ZoomIn, RotateCcw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";

const TOKEN_FRAME_SRC = "/token/token-circle.png";

// ─── Image transform ──────────────────────────────────────────────────────────

interface ImageTransform {
  /** Zoom multiplier. 1 = fit, max 4. */
  scale: number;
  /** Horizontal offset as % of container width. */
  x: number;
  /** Vertical offset as % of container height. */
  y: number;
}

const DEFAULT_TRANSFORM: ImageTransform = { scale: 1, x: 0, y: 0 };

function clampOffset(value: number, scale: number): number {
  const max = Math.max(0, (scale - 1) * 50);
  return Math.max(-max, Math.min(max, value));
}

// ─── Drag + wheel hook ────────────────────────────────────────────────────────

/**
 * Attaches drag-to-pan and scroll-to-zoom behaviour to a container div.
 * Keeps refs for transform / onChange so event handlers never go stale.
 */
function useImageEditor(
  transform: ImageTransform,
  onChange: (t: ImageTransform) => void,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, startTx: 0, startTy: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragOrigin.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startTx: transformRef.current.x,
      startTy: transformRef.current.y,
    };
  }, []);

  // Global mouse move / up while dragging.
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      const t = transformRef.current;
      const dx = ((e.clientX - dragOrigin.current.mouseX) / width) * 100;
      const dy = ((e.clientY - dragOrigin.current.mouseY) / height) * 100;
      onChangeRef.current({
        ...t,
        x: clampOffset(dragOrigin.current.startTx + dx, t.scale),
        y: clampOffset(dragOrigin.current.startTy + dy, t.scale),
      });
    };
    const handleUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  // Non-passive wheel listener so we can prevent page scroll while zooming.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const t = transformRef.current;
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newScale = Math.max(1, Math.min(4, t.scale + delta));
      onChangeRef.current(
        newScale === 1
          ? DEFAULT_TRANSFORM
          : {
              scale: newScale,
              x: clampOffset(t.x, newScale),
              y: clampOffset(t.y, newScale),
            },
      );
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return { containerRef, isDragging, handleMouseDown };
}

// ─── Zoom slider + reset ──────────────────────────────────────────────────────

function ZoomControls({
  transform,
  onChange,
}: {
  transform: ImageTransform;
  onChange: (t: ImageTransform) => void;
}) {
  const isDefault =
    transform.scale === 1 && transform.x === 0 && transform.y === 0;

  return (
    <div className="flex items-center gap-2 pt-0.5">
      <ZoomIn className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="range"
        min={100}
        max={400}
        step={5}
        value={Math.round(transform.scale * 100)}
        onChange={(e) => {
          const newScale = parseInt(e.target.value, 10) / 100;
          onChange(
            newScale === 1
              ? DEFAULT_TRANSFORM
              : {
                  scale: newScale,
                  x: clampOffset(transform.x, newScale),
                  y: clampOffset(transform.y, newScale),
                },
          );
        }}
        className="h-1 flex-1 cursor-pointer accent-primary"
        aria-label="Zoom level"
      />
      <button
        type="button"
        title="Reset position"
        onClick={() => onChange(DEFAULT_TRANSFORM)}
        disabled={isDefault}
        className={cn(
          "rounded p-0.5 text-muted-foreground transition-colors",
          "hover:bg-muted/50 hover:text-foreground",
          "disabled:pointer-events-none disabled:opacity-30",
        )}
        aria-label="Reset image position"
      >
        <RotateCcw className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Reads an image file as a base64 data URL for in-memory (transient) use. */
function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

interface ImageSectionProps {
  label: string;
  hint: string;
  value: string | null;
  onRemove: () => void;
  children: ReactNode;
}

function ImageUploadButton({
  label,
  onPick,
}: {
  label: string;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        className="h-auto w-full gap-1.5 bg-muted/20 py-2 text-[11px] hover:bg-muted/40"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden />
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function BuilderImagePanel() {
  const { portraitImage, setPortraitImage, tokenImage, setTokenImage } =
    useCharacterBuilder();

  const tokenSrc = tokenImage ?? portraitImage;

  const [portraitTransform, setPortraitTransform] =
    useState<ImageTransform>(DEFAULT_TRANSFORM);
  const [tokenTransform, setTokenTransform] =
    useState<ImageTransform>(DEFAULT_TRANSFORM);

  const portraitEditor = useImageEditor(portraitTransform, setPortraitTransform);
  const tokenEditor = useImageEditor(tokenTransform, setTokenTransform);

  async function handlePick(
    file: File,
    setter: (dataUrl: string | null) => void,
    resetTransform: () => void,
  ) {
    try {
      setter(await readImageAsDataUrl(file));
      resetTransform();
    } catch {
      /* ignore unreadable files */
    }
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <Accordion type="single" collapsible>
        <AccordionItem value="character-art" className="border-0">
          <AccordionTrigger className="gap-1.5 px-3.5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:no-underline">
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">Character Image</span>
              {portraitImage && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
                  Set
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5">
            <div className="flex flex-col gap-4">
              {/* Character portrait */}
              <ImageSection
                label="Portrait"
                hint="Drag or scroll to reposition · Shown on the sheet and as the main Foundry art."
                value={portraitImage}
                onRemove={() => {
                  setPortraitImage(null);
                  setPortraitTransform(DEFAULT_TRANSFORM);
                }}
              >
                <div
                  ref={portraitEditor.containerRef}
                  onMouseDown={portraitEditor.handleMouseDown}
                  className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border bg-muted/20"
                  style={{
                    cursor: portraitEditor.isDragging ? "grabbing" : portraitImage ? "grab" : "default",
                  }}
                >
                  {portraitImage ? (
                    <img
                      src={portraitImage}
                      alt="Character portrait"
                      draggable={false}
                      className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                      style={{
                        transform: `translate(${portraitTransform.x}%, ${portraitTransform.y}%) scale(${portraitTransform.scale})`,
                        transformOrigin: "center center",
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 opacity-40" aria-hidden />
                    </div>
                  )}
                </div>
                {portraitImage && (
                  <ZoomControls
                    transform={portraitTransform}
                    onChange={setPortraitTransform}
                  />
                )}
                <ImageUploadButton
                  label="Upload portrait"
                  onPick={(file) =>
                    void handlePick(file, setPortraitImage, () =>
                      setPortraitTransform(DEFAULT_TRANSFORM),
                    )
                  }
                />
              </ImageSection>

              {/* Token */}
              <ImageSection
                label="Token"
                hint="Drag or scroll to reposition · Defaults to the portrait if not set."
                value={tokenImage}
                onRemove={() => {
                  setTokenImage(null);
                  setTokenTransform(DEFAULT_TRANSFORM);
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-24 w-24">
                    {tokenSrc ? (
                      <div
                        ref={tokenEditor.containerRef}
                        onMouseDown={tokenEditor.handleMouseDown}
                        className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
                        style={{
                          cursor: tokenEditor.isDragging ? "grabbing" : "grab",
                        }}
                      >
                        <img
                          src={tokenSrc}
                          alt="Token"
                          draggable={false}
                          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                          style={{
                            transform: `translate(${tokenTransform.x}%, ${tokenTransform.y}%) scale(${tokenTransform.scale})`,
                            transformOrigin: "center center",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="absolute left-1/2 top-1/2 flex h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-muted/30 text-muted-foreground">
                        <ImageIcon className="h-6 w-6 opacity-40" aria-hidden />
                      </div>
                    )}
                    <img
                      src={TOKEN_FRAME_SRC}
                      alt=""
                      aria-hidden
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    />
                  </div>
                  {tokenSrc && (
                    <ZoomControls
                      transform={tokenTransform}
                      onChange={setTokenTransform}
                    />
                  )}
                </div>
                <ImageUploadButton
                  label={tokenImage ? "Replace token" : "Upload token (optional)"}
                  onPick={(file) =>
                    void handlePick(file, setTokenImage, () =>
                      setTokenTransform(DEFAULT_TRANSFORM),
                    )
                  }
                />
              </ImageSection>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function ImageSection({
  label,
  hint,
  value,
  onRemove,
  children,
}: ImageSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {value && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "inline-flex items-center gap-1 rounded border border-destructive/30 bg-destructive/5",
              "px-1.5 py-0.5 text-[10px] font-medium text-destructive transition-colors hover:bg-destructive/10",
            )}
          >
            <X className="h-3 w-3" aria-hidden />
            Remove
          </button>
        )}
      </div>
      {children}
      <p className="text-[10px] leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

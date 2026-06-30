import { useRef } from "react";
import type { ReactNode } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";

const TOKEN_FRAME_SRC = "/token/token-circle.png";

/** Reads an image file as a base64 data URL for in-memory (transient) use. */
function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

interface ImageDropProps {
  label: string;
  hint: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-muted/20 px-2.5 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/40"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden />
        {label}
      </button>
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

export function BuilderImagePanel() {
  const { portraitImage, setPortraitImage, tokenImage, setTokenImage } =
    useCharacterBuilder();

  const tokenSrc = tokenImage ?? portraitImage;

  async function handlePick(
    file: File,
    setter: (dataUrl: string | null) => void,
  ) {
    try {
      setter(await readImageAsDataUrl(file));
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
                hint="Shown on the sheet and as the main Foundry art."
                value={portraitImage}
                onChange={setPortraitImage}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border bg-muted/20">
                  {portraitImage ? (
                    <img
                      src={portraitImage}
                      alt="Character portrait"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 opacity-40" aria-hidden />
                    </div>
                  )}
                </div>
                <ImageUploadButton
                  label="Upload portrait"
                  onPick={(file) => void handlePick(file, setPortraitImage)}
                />
              </ImageSection>

              {/* Token */}
              <ImageSection
                label="Token"
                hint="Small round art for the Foundry prototype token. Defaults to the portrait."
                value={tokenImage}
                onChange={setTokenImage}
              >
                <div className="flex justify-center">
                  <div className="relative h-24 w-24">
                    {tokenSrc ? (
                      <img
                        src={tokenSrc}
                        alt="Token"
                        className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
                      />
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
                </div>
                <ImageUploadButton
                  label={tokenImage ? "Replace token" : "Upload token (optional)"}
                  onPick={(file) => void handlePick(file, setTokenImage)}
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
  onChange,
  children,
}: ImageDropProps & { children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
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

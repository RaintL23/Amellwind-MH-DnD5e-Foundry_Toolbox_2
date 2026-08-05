import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FoundryItem } from "@/shared/foundry";
import { downloadFoundryJson } from "@/shared/foundry";
import { Check, Copy, Download } from "lucide-react";

export function FoundryRawJsonDialog({
  open,
  onOpenChange,
  item,
  filename,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FoundryItem;
  filename: string;
}) {
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => JSON.stringify(item, null, 2), [item]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked in some embedded contexts.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[60] flex max-h-[90vh] w-[min(96vw,56rem)] max-w-4xl flex-col gap-0 overflow-hidden"
        overlayClassName="z-[60]"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Raw Foundry JSON</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {filename}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="min-h-0 flex-1 overflow-hidden px-6 pb-4">
          <pre className="h-[min(60vh,32rem)] overflow-auto rounded-md border border-border/50 bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground whitespace-pre">
            {json}
          </pre>
        </DialogBody>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-1.5 h-4 w-4" />
            ) : (
              <Copy className="mr-1.5 h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadFoundryJson(item, filename)}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dices, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { XgeTable } from "../data/xanathar-tables.data";
import type { RollResult } from "../utils/xanathar-roll.utils";

interface BackstoryTableCardProps {
  table: XgeTable;
  result?: RollResult;
  /** Auto-cascaded child results (birth orders, life events, supplementals) */
  childResults?: RollResult[];
  onRoll: (tableId: string) => void;
  onSelect: (tableId: string, rowIndex: number) => void;
  rollDisabled?: boolean;
  selectDisabled?: boolean;
  disabledReason?: string;
}

function formatResult(r: RollResult): string {
  return r.expandedResult ? `${r.result} → ${r.expandedResult}` : r.result;
}

export function BackstoryTableCard({
  table,
  result,
  childResults = [],
  onRoll,
  onSelect,
  rollDisabled = false,
  selectDisabled = false,
  disabledReason,
}: BackstoryTableCardProps) {
  const [showTable, setShowTable] = useState(false);

  const hasResult = !!result;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        hasResult ? "border-primary/40" : "border-border",
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">
              {table.name}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">
              {table.dice.label ?? `${table.dice.count}d${table.dice.sides}`}
            </span>
          </div>
          {table.note && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{table.note}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="h-7 px-2 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
            title={showTable ? "Hide table" : "Show table"}
          >
            {showTable ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Table
          </button>

          <button
            type="button"
            onClick={() => onRoll(table.id)}
            disabled={rollDisabled}
            title={rollDisabled ? disabledReason : `Roll ${table.dice.label}`}
            className={cn(
              "h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors",
              rollDisabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <Dices className="h-3.5 w-3.5" />
            Roll
          </button>
        </div>
      </div>

      {/* Result badge */}
      {hasResult && (
        <div className="mx-4 mb-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-md">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-primary shrink-0">
              {result.isManual
                ? "Selected"
                : `Roll: ${result.finalValue !== result.rawRoll
                    ? `${result.rawRoll} + ${result.finalValue - result.rawRoll} = ${result.finalValue}`
                    : result.rawRoll}`}
            </span>
            <span className="text-sm text-foreground leading-snug">
              {result.expandedResult
                ? `${result.result} → ${result.expandedResult}`
                : result.result}
            </span>
          </div>
        </div>
      )}

      {childResults.length > 0 && (
        <div className="mx-4 mb-3 space-y-1.5">
          {childResults.map((child) => (
            <div
              key={child.tableId}
              className="px-3 py-2 bg-muted/50 border border-border rounded-md text-xs"
            >
              <span className="font-medium text-muted-foreground block">
                ↳ {child.tableName}
              </span>
              <span className="text-foreground leading-snug">{formatResult(child)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible table */}
      {showTable && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-2">
            Haz clic en una fila para elegir esa opción manualmente.
          </p>
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground w-16 shrink-0">
                    {table.dice.label ?? `${table.dice.count}d${table.dice.sides}`}
                  </th>
                  <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => {
                  const rangeLabel =
                    row.range[0] === row.range[1]
                      ? String(row.range[0])
                      : `${row.range[0]}–${row.range[1]}`;
                  const isActive =
                    hasResult &&
                    (result!.selectedRowIndex === i ||
                      (result!.selectedRowIndex === undefined &&
                        result!.finalValue >= row.range[0] &&
                        result!.finalValue <= row.range[1]));
                  return (
                    <tr
                      key={i}
                      onClick={() => !selectDisabled && onSelect(table.id, i)}
                      title={selectDisabled ? disabledReason : "Seleccionar esta opción"}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        selectDisabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer",
                        isActive
                          ? "bg-primary/15 font-medium text-primary"
                          : !selectDisabled && "hover:bg-muted/40",
                      )}
                    >
                      <td className="px-2 py-1.5 font-mono text-center">{rangeLabel}</td>
                      <td className="px-2 py-1.5">{row.result}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

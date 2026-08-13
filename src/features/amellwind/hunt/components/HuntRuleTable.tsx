import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HuntRuleTable } from "../data/hunt-rules.data";

interface HuntRuleTableProps {
  table: HuntRuleTable;
}

export function HuntRuleTableView({ table }: HuntRuleTableProps) {
  return (
    <Table>
      <TableCaption className="caption-top mb-3 text-left text-sm font-semibold text-foreground">
        {table.caption}
      </TableCaption>
      <TableHeader>
        <TableRow>
          {table.headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {table.rows.map((row) => (
          <TableRow key={row.join("-")}>
            {row.map((cell) => (
              <TableCell key={cell} className="text-muted-foreground">
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

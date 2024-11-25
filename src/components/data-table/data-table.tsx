import { QueryParamsList } from "@/models/query-models/query-params-list";
import { ColumnBasic } from "./data-table-interfaces";
import { xPagination } from "@/models/query-models/pagination";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import { Typography } from "../typography/typography";
import { DataTableAsync } from "./data-table-async";
import { DataTableSync } from "./data-table-sync";
import { useDataTableStoreContext } from "./data-table-store";
import { useEffect, useState } from "react";

export interface DataTableProps<T> {
  tableId: string;
  columns: ColumnBasic<T>[];
  data:
    | T[]
    | ((filters?: QueryParamsList) => Promise<{
        data: T[];
        paginationData: xPagination | null;
      }>);
  title?: string;
  subtitle?: string;
  manualResetFiltering?: boolean;
}

export default function DataTable<TData>({
  tableId,
  columns,
  data,
  title = "",
  subtitle = "",
  manualResetFiltering = false,
}: DataTableProps<TData>) {
  const dataTableStore = useDataTableStoreContext();
  const [ready, isReady] = useState<boolean>(false);
  useEffect(() => {
    if (!manualResetFiltering) {
      dataTableStore.setFiltering(tableId, []);
    }
    isReady(true);
  }, []);

  if (!ready) {
    return <></>;
  }
  return (
    <Card>
      <CardHeader className="mb-2 px-0 pb-0 pt-1 text-center">
        {title != "" && (
          <Typography
            variant="h4"
            weight="semibold"
            className="mt-10 scroll-m-20 border-b pb-1 tracking-wide text-primary transition-colors first:mt-0"
          >
            {title}
          </Typography>
        )}
        {subtitle != "" && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {typeof data === "function" ? (
          <DataTableAsync
            tableId={tableId}
            columns={columns}
            queryData={data}
          />
        ) : (
          <DataTableSync<TData>
            initialData={data}
            columns={columns}
            tableId={tableId}
          />
        )}
      </CardContent>
    </Card>
  );
}

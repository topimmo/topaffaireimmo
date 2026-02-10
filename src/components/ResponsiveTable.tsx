import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T) => void;
}

export default function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "No data available",
  loading = false,
  onRowClick,
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3 text-sm", col.className)}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <Card
            key={keyExtractor(item)}
            className={cn(onRowClick && "cursor-pointer")}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4 space-y-3">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center justify-between gap-2"
                  >
                    {col.mobileLabel && (
                      <span className="text-xs text-muted-foreground">
                        {col.mobileLabel}
                      </span>
                    )}
                    <div className={cn("flex-1", !col.mobileLabel && "col-span-2")}>
                      {col.render(item)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

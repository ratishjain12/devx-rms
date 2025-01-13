import React from "react";
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function CollapsibleTableCell({
  items,
  maxVisible = 2,
}: {
  items: string[];
  maxVisible?: number;
}) {
  if (!items || items.length === 0) return <TableCell>-</TableCell>;

  return (
    <TableCell>
      <div className="relative group">
        <div className="flex items-center gap-1">
          {items.slice(0, maxVisible).map((item, index) => (
            <Badge
              key={`${item}-${index}`}
              variant="secondary"
              className="capitalize"
            >
              {item}
            </Badge>
          ))}
          {items.length > maxVisible && (
            <span className="border rounded-full flex items-center justify-center w-[28px] h-[28px] text-sm">
              {`+${items.length - maxVisible}`}
            </span>
          )}
        </div>

        {items.length > maxVisible && (
          <div className="absolute left-0 top-full mt-1 hidden w-48 bg-white border border-gray-200 rounded-md shadow-md group-hover:block z-10">
            <div className="p-2 text-sm">
              {items.slice(maxVisible).map((item, index) => (
                <div key={`${item}-${index}`} className="py-1 capitalize">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TableCell>
  );
}

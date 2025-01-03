import React from "react";
import { format } from "date-fns";

interface TimelineHeaderProps {
  weeks: Date[];
}

export function TimelineHeader({ weeks }: TimelineHeaderProps) {
  return (
    <div className="flex mb-2">
      <div className="w-1/4" />
      <div className="w-3/4 flex">
        {weeks.map((week) => (
          <div
            key={week.toISOString()}
            className="text-center text-xs"
            style={{ width: `${100 / weeks.length}%` }}
          >
            {format(week, "MMM d")}
          </div>
        ))}
      </div>
    </div>
  );
}

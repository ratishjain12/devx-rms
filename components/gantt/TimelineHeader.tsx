import React from "react";
import { format } from "date-fns";

interface TimelineHeaderProps {
  weeks: Date[];
}

export function TimelineHeader({ weeks }: TimelineHeaderProps) {
  return (
    <div className="flex mb-2">
      <div className="w-1/6" />
      <div className="w-3/4 flex gap-[20px]">
        {weeks.map((week) => (
          <div key={week.toISOString()} className="flex-1 text-center text-xs">
            {format(week, "MMM d")}
          </div>
        ))}
      </div>
    </div>
  );
}

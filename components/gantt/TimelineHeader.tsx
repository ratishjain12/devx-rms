// TimelineHeader.tsx
import React from "react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineHeaderProps {
  weeks: Date[];
  selectedWeek: Date | null;
  onSelectWeek: (week: Date | null) => void;
}

export function TimelineHeader({
  weeks,
  selectedWeek,
  onSelectWeek,
}: TimelineHeaderProps) {
  const formatWeekRange = (startDate: Date) => {
    const endDate = addDays(startDate, 6);
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
  };

  const handleWeekClick = (week: Date) => {
    if (selectedWeek?.toISOString() === week.toISOString()) {
      onSelectWeek(null);
    } else {
      onSelectWeek(week);
    }
  };

  return (
    <div className="flex">
      {/* Project name column header */}
      <div className="w-48 shrink-0 p-4 border-r border-gray-200 bg-gray-50">
        <div className="font-semibold">Project Name</div>
      </div>

      {/* Week columns */}
      <div className="flex flex-1">
        {weeks.map((week) => (
          <div
            key={week.toISOString()}
            className={cn(
              " shrink-0 border-r border-gray-200",
              selectedWeek?.toISOString() === week.toISOString()
                ? "w-[180px]"
                : "w-[120px]"
            )}
          >
            <button
              onClick={() => handleWeekClick(week)}
              className={`w-full h-full p-2 text-sm transition-colors ${
                selectedWeek?.toISOString() === week.toISOString()
                  ? "bg-blue-100 font-medium"
                  : "hover:bg-blue-50 bg-white"
              }`}
            >
              <div className="text-xs text-gray-600 mb-1">
                Week {format(week, "w")}
              </div>
              <div className="whitespace-nowrap">{formatWeekRange(week)}</div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

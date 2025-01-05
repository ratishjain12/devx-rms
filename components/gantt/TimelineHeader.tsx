// TimelineHeader.tsx
import React from "react";
import { format, addDays } from "date-fns";

interface TimelineHeaderProps {
  weeks: Date[];
  selectedWeek: Date | null;
  onSelectWeek: (week: Date | null) => void; // Updated to allow null
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

  const isCurrentWeek = (week: Date) => {
    const today = new Date();
    const weekEnd = addDays(week, 6);
    return today >= week && today <= weekEnd;
  };

  const handleWeekClick = (week: Date) => {
    // If clicking the already selected week, deselect it
    if (selectedWeek?.toISOString() === week.toISOString()) {
      onSelectWeek(null);
    } else {
      onSelectWeek(week);
    }
  };

  return (
    <div className="flex">
      <div className="w-48 flex-shrink-0 p-4 border-r bg-gray-50">
        <div className="font-semibold">Project Name</div>
      </div>

      <div className="flex flex-1 min-w-max">
        {weeks.map((week) => (
          <div
            key={week.toISOString()}
            className="border-r border-gray-200 min-w-[120px] relative"
          >
            <button
              onClick={() => handleWeekClick(week)}
              className={`w-full p-2 text-sm transition-colors duration-150
                ${
                  selectedWeek?.toISOString() === week.toISOString()
                    ? "bg-blue-100 font-medium hover:bg-blue-200"
                    : isCurrentWeek(week)
                    ? "bg-yellow-50 hover:bg-yellow-100"
                    : "hover:bg-blue-50 bg-white"
                }`}
            >
              <div className="whitespace-nowrap flex items-center justify-center gap-1">
                {formatWeekRange(week)}
                {isCurrentWeek(week) && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Week {format(week, "w")}
              </div>
            </button>
            <div className="absolute bottom-0 top-full border-r border-gray-100 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

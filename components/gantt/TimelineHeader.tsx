// TimelineHeader.tsx
import React from "react";
import { format, addDays } from "date-fns";

interface TimelineHeaderProps {
  weeks: Date[];
  selectedWeek: Date | null;
  onSelectWeek: (week: Date) => void;
}

// TimelineHeader.tsx
export function TimelineHeader({
  weeks,
  selectedWeek,
  onSelectWeek,
}: TimelineHeaderProps) {
  const formatWeekRange = (startDate: Date) => {
    const endDate = addDays(startDate, 6);
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
  };

  return (
    <div className="flex">
      <div className="w-48 flex-shrink-0 p-4 border-r bg-gray-50">
        <div className="font-semibold">Project Name</div>
      </div>

      <div className="flex-1" style={{ minWidth: `${120 * weeks.length}px` }}>
        <div className="flex">
          {weeks.map((week) => (
            <div
              key={week.toISOString()}
              className="border-r border-gray-200"
              style={{ width: "120px" }}
            >
              <button
                onClick={() => onSelectWeek(week)}
                className={`w-full p-2 text-sm transition-colors duration-150
                  ${
                    selectedWeek?.toISOString() === week.toISOString()
                      ? "bg-blue-100 font-medium"
                      : "hover:bg-blue-50 bg-white"
                  }`}
              >
                <div className="whitespace-nowrap text-center">
                  {formatWeekRange(week)}
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  Week {format(week, "w")}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

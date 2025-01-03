// TimelineHeader.tsx
import React from "react";
import { format, addDays } from "date-fns";

interface TimelineHeaderProps {
  weeks: Date[];
  selectedWeek: Date | null;
  onSelectWeek: (week: Date) => void;
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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Project Timeline</h2>
        <select className="p-2 border rounded-md">
          <option>View by Week</option>
          <option>View by Month</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <div className="flex min-w-max">
          <div className="w-48 flex-shrink-0 p-4 bg-gray-50 border-r border-gray-200">
            Project Name
          </div>
          <div className="flex flex-1">
            {weeks.map((week) => (
              <button
                key={week.toISOString()}
                onClick={() => onSelectWeek(week)}
                className={`
                  min-w-[120px] p-2 text-sm border-r border-gray-200 
                  hover:bg-blue-50 transition-colors duration-150
                  ${
                    selectedWeek?.toISOString() === week.toISOString()
                      ? "bg-blue-100 font-medium"
                      : "bg-white"
                  }
                `}
              >
                <div className="whitespace-nowrap">{formatWeekRange(week)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Week {format(week, "w")}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

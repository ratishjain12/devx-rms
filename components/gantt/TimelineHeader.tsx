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
    <div className="flex border-b">
      {/* Project column header */}
      <div className="w-48 shrink-0 p-3 border-r border-gray-200">
        <div className="flex items-center">
          <span className="font-semibold text-gray-900">Project</span>
        </div>
      </div>

      {/* Week columns */}
      <div className="flex flex-1">
        {weeks.map((week) => {
          const isSelected = selectedWeek?.toISOString() === week.toISOString();

          return (
            <div
              key={week.toISOString()}
              className={cn(
                "shrink-0 border-r border-gray-200",
                isSelected ? "w-[250px]" : "w-[190px]"
              )}
            >
              <button
                onClick={() => handleWeekClick(week)}
                className={cn(
                  "w-full p-2 text-left transition-all group",
                  isSelected ? "bg-blue-50" : ""
                )}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-blue-600" : "text-[#444444]"
                    )}
                  >
                    Week {format(week, "w")}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-xs",
                    isSelected ? "text-blue-900 font-medium" : "text-[#B6B6B6]"
                  )}
                >
                  {formatWeekRange(week)}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ProjectBar.tsx
import React from "react";
import { format, differenceInWeeks, addDays } from "date-fns";
import { Project } from "@/types/models";
import { ResourceBar } from "./ResourceBar";
import { PlusCircle } from "lucide-react";

// Update ProjectBar calculation
interface ProjectBarProps {
  project: Project;
  timelineStart: Date;
  timelineEnd: Date;
  onAddAssignment: (projectId: number) => void;
  selectedWeek: Date | null;
}

export function ProjectBar({
  project,
  timelineStart,
  timelineEnd,
  onAddAssignment,
  selectedWeek,
}: ProjectBarProps) {
  const startDate = new Date(project.startDate);
  const endDate = project.endDate ? new Date(project.endDate) : timelineEnd;

  // Calculate week-based positions
  const totalWeeks = differenceInWeeks(timelineEnd, timelineStart) + 1;
  const projectStartOffset = Math.max(
    0,
    differenceInWeeks(startDate, timelineStart)
  );
  const projectEndOffset = Math.min(
    totalWeeks,
    differenceInWeeks(endDate, timelineStart) + 1
  );

  const startPercentage = (projectStartOffset / totalWeeks) * 100;
  const widthPercentage =
    ((projectEndOffset - projectStartOffset) / totalWeeks) * 100;

  return (
    <div className="flex border-b hover:bg-gray-50">
      <div className="w-48 flex-shrink-0 p-4 border-r bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium truncate" title={project.name}>
              {project.name}
            </h3>
            <span className="text-xs text-gray-500 block truncate">
              {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
            </span>
          </div>
          <button
            onClick={() => onAddAssignment(project.id)}
            className="flex-shrink-0 text-blue-500 hover:text-blue-600 p-1"
            title="Add Assignment"
          >
            <PlusCircle size={16} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative h-16"
        style={{ minWidth: `${120 * totalWeeks}px` }}
      >
        <div
          className={`absolute top-0 h-full transition-colors 
            ${
              selectedWeek &&
              startDate <= addDays(selectedWeek, 6) &&
              endDate >= selectedWeek
                ? "bg-blue-100"
                : "bg-gray-50"
            } border border-blue-200`}
          style={{
            left: `${startPercentage}%`,
            width: `${widthPercentage}%`,
          }}
        >
          <div className="flex h-full">
            {project.assignments.map((assignment) => (
              <ResourceBar
                key={assignment.id}
                assignment={assignment}
                projectId={project.id}
                width={100 / Math.max(1, project.assignments.length)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ProjectBar.tsx
import React from "react";
import { format, addDays, isSameWeek } from "date-fns";
import { Project } from "@/types/models";
import { ResourceBar } from "./ResourceBar";
import { PlusCircle } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { calculateProjectRequirementStatus, cn } from "@/lib/utils";
import Link from "next/link";

interface ProjectBarProps {
  project: Project;
  timelineStart: Date;
  timelineEnd: Date;
  onAddAssignment: (projectId: number) => void;
  selectedWeek: Date | null;
  weeks: Date[];
  onSelectWeek: (week: Date | null) => void; // Add this prop
}

export function ProjectBar({
  project,
  onAddAssignment,
  selectedWeek,
  weeks,
  onSelectWeek,
}: ProjectBarProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-${project.id}`,
  });

  const requirementStatus = calculateProjectRequirementStatus(project);

  const getStatusColor = () => {
    switch (requirementStatus.status) {
      case "fulfilled":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-500";
      case "unfulfilled":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="flex items-center min-w-max border-b hover:bg-gray-50">
      {/* Project Name and Add Assignment Button */}
      <div className="w-48 flex-shrink-0 py-3 px-3 border-r bg-white">
        <div className="flex items-center justify-between gap-2">
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor()}`}
            title={`Requirements Coverage: ${Math.round(
              requirementStatus.coverage
            )}%`}
          />
          <Link
            href={`/projects/${project.id}`}
            className="min-w-0 cursor-pointer"
          >
            <h3 className="font-medium truncate" title={project.name}>
              {project.name}
            </h3>
            <span className="text-xs text-gray-500 block truncate">
              {format(project.startDate, "MMM d")} -{" "}
              {project.endDate ? format(project.endDate, "MMM d") : "Ongoing"}
            </span>
          </Link>
          <button
            onClick={() => onAddAssignment(project.id)}
            className="flex-shrink-0 text-blue-500 hover:text-blue-600 p-1"
            title="Add Assignment"
          >
            <PlusCircle size={16} />
          </button>
        </div>
      </div>

      {/* Weekly Resource Bars */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-lg relative transition-all duration-200",
          isOver ? "bg-blue-50 border-2 border-blue-400" : "bg-white",
          selectedWeek ? "h-24" : "h-12" // Dynamically adjust height
        )}
      >
        <div className="flex h-full">
          {weeks.map((week) => {
            const weekStart = week;
            const weekEnd = addDays(week, 6);

            // Check if this week is selected
            const isSelected =
              selectedWeek &&
              isSameWeek(week, selectedWeek, { weekStartsOn: 0 });

            // Find assignments that fall within this week
            const assignmentsInWeek = project.assignments.filter(
              (assignment) => {
                const assignmentStart = new Date(assignment.startDate);
                const assignmentEnd = new Date(assignment.endDate);

                // Check if the assignment overlaps with the week
                return (
                  (assignmentStart <= weekEnd && assignmentEnd >= weekStart) ||
                  (assignmentStart <= weekStart && assignmentEnd >= weekEnd)
                );
              }
            );

            return (
              <div
                key={week.toISOString()}
                className={`shrink-0 border-r border-gray-200 transition-all duration-100 relative ${
                  isSelected ? "w-[180px]" : "w-[120px]" // Expand the selected week
                }`}
                onClick={() => onSelectWeek(week)} // Select the week on click
              >
                <div
                  className={cn(
                    "absolute inset-0 flex flex-col gap-1 p-1",
                    isSelected ? "gap-2" : "gap-1"
                  )}
                >
                  {assignmentsInWeek.map((assignment) => (
                    <ResourceBar
                      key={`${assignment.id}-${week.toISOString()}`}
                      assignment={assignment}
                      projectId={project.id}
                      week={week}
                      isSelected={isSelected} // Pass the selected state
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

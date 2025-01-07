// ProjectBar.tsx
import React from "react";
import { format, addDays } from "date-fns";
import { Project } from "@/types/models";
import { ResourceBar } from "./ResourceBar";
import { PlusCircle } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { calculateProjectRequirementStatus } from "@/lib/utils";
import Link from "next/link";

interface ProjectBarProps {
  project: Project;
  timelineStart: Date;
  timelineEnd: Date;
  onAddAssignment: (projectId: number) => void;
  selectedWeek: Date | null;
  weeks: Date[];
}

export function ProjectBar({
  project,

  onAddAssignment,

  weeks,
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
        className={`flex-1 rounded-lg relative h-12 ${
          isOver ? "bg-blue-50" : ""
        }`}
      >
        <div className="flex h-full">
          {weeks.map((week) => {
            const weekStart = week;
            const weekEnd = addDays(week, 6);

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
                className="w-[120px] shrink-0 border-r border-gray-200 relative"
              >
                <div className="absolute inset-0 flex flex-col gap-1 p-1">
                  {assignmentsInWeek.map((assignment) => (
                    <ResourceBar
                      key={`${assignment.id}-${week.toISOString()}`}
                      assignment={assignment}
                      projectId={project.id}
                      week={week}
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

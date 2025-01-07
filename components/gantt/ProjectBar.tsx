import React from "react";
import { addDays, isSameWeek } from "date-fns";
import { Project } from "@/types/models";
import { ResourceCard } from "./ResourceBar";
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
  onSelectWeek: (week: Date | null) => void;
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

  const getProgressInfo = () => {
    const { status } = requirementStatus;
    switch (status) {
      case "fulfilled":
        return { color: "bg-green-500" };
      case "partial":
        return { color: "bg-yellow-500" };
      case "unfulfilled":
        return { color: "bg-red-500" };
      default:
        return { color: "bg-gray-400" };
    }
  };

  const progressInfo = getProgressInfo();

  return (
    <div className="flex min-w-max border-b hover:bg-gray-50">
      {/* Project Info Column */}
      <div className="w-48 flex-shrink-0 py-2 px-3 border-r bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full ${progressInfo.color}`} />
            <Link href={`/projects/${project.id}`} className="group truncate">
              <h3 className="font-medium truncate text-sm" title={project.name}>
                {project.name}
              </h3>
            </Link>
          </div>
          <button
            onClick={() => onAddAssignment(project.id)}
            className="flex-shrink-0 text-blue-500 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
            title="Add Assignment"
          >
            <PlusCircle size={14} />
          </button>
        </div>
      </div>

      {/* Resources Grid */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 relative transition-all duration-200",
          isOver ? "bg-blue-50 border-2 border-blue-400" : "bg-white"
        )}
      >
        <div className="flex h-full">
          {weeks.map((week) => {
            const weekStart = week;
            const weekEnd = addDays(week, 6);
            const isSelected =
              selectedWeek &&
              isSameWeek(week, selectedWeek, { weekStartsOn: 0 });

            const assignmentsInWeek = project.assignments.filter(
              (assignment) => {
                const assignmentStart = new Date(assignment.startDate);
                const assignmentEnd = new Date(assignment.endDate);
                return (
                  (assignmentStart <= weekEnd && assignmentEnd >= weekStart) ||
                  (assignmentStart <= weekStart && assignmentEnd >= weekEnd)
                );
              }
            );

            return (
              <div
                key={week.toISOString()}
                className={cn(
                  "shrink-0 border-r border-gray-200 transition-all duration-100 relative",
                  isSelected ? "w-[250px]" : "w-[190px]",
                  assignmentsInWeek.length > 0 ? "p-1" : ""
                )}
                onClick={() => onSelectWeek(week)}
              >
                {assignmentsInWeek.length > 0 ? (
                  <div className="space-y-1 p-1">
                    {assignmentsInWeek.map((assignment) => (
                      <ResourceCard
                        key={`${assignment.id}-${week.toISOString()}`}
                        assignment={assignment}
                        projectId={project.id}
                        week={week}
                        isSelected={!!isSelected}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-8 flex items-center justify-center text-gray-400 text-xs">
                    {isSelected && "No resources"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

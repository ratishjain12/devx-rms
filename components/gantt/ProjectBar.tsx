import React from "react";
import { addDays, isSameWeek } from "date-fns";
import { Assignment, Project } from "@/types/models";
import { ResourceCard } from "./ResourceCard";
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

// Custom component for droppable week column
function WeekColumn({
  project,
  week,
  isSelected,
  assignments,
  onSelectWeek,
}: {
  project: Project;
  week: Date;
  isSelected: boolean | null;
  assignments: Assignment[];
  onSelectWeek: (week: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-${project.id}-week-${week.toISOString()}`,
    data: {
      projectId: project.id,
      week: week,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "shrink-0 border-r border-gray-200 transition-all duration-100 relative",
        isSelected ? "w-[250px]" : "w-[190px]",
        isOver ? "bg-blue-50" : "bg-white",
        assignments.length > 0 ? "p-1" : ""
      )}
      onClick={() => onSelectWeek(week)}
    >
      {/* Visual feedback for drop target */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none" />
      )}

      {assignments.length > 0 ? (
        <div className="space-y-1 relative">
          {assignments.map((assignment) => (
            <ResourceCard
              key={`${assignment.id}-${week.toISOString()}`}
              assignment={assignment}
              projectId={project.id}
              week={week}
              isSelected={isSelected}
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
}

export function ProjectBar({
  project,
  onAddAssignment,
  selectedWeek,
  weeks,
  onSelectWeek,
}: ProjectBarProps) {
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
      <div className="flex-1 relative">
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
              <WeekColumn
                key={week.toISOString()}
                project={project}
                week={week}
                isSelected={isSelected}
                assignments={assignmentsInWeek}
                onSelectWeek={onSelectWeek}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

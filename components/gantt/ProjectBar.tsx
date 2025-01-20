// ProjectBar.tsx
import React from "react";
import { addDays, format, isSameWeek } from "date-fns";
import { Assignment, Project } from "@/types/models";
import { ResourceCard } from "./ResourceCard";
import { PlusCircle, Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { calculateProjectRequirementStatus, cn } from "@/lib/utils";
import Link from "next/link";

interface ProjectBarProps {
  project: Project;
  timelineStart: Date;
  timelineEnd: Date;
  onAddAssignment: (projectId: number, week?: Date) => void;
  selectedWeek: Date | null;
  weeks: Date[];
  onSelectWeek: (week: Date | null) => void;
  allProjects: Project[];
  isShiftPressed: boolean;
  selectedResources: Set<string>;
  onResourceSelect: (resourceId: string, selected: boolean) => void;
  onUpdateAssignment?: (
    assignmentId: number,
    updates: {
      employeeId: number;
      projectId: number;
      startDate: string;
      endDate: string;
      utilisation: number;
    }
  ) => void;
  selectedCell: { projectId: number; week: string } | null;
  onCellSelect: (projectId: number, week: string) => void;
  copiedResources: boolean;
}

function WeekColumn({
  project,
  week,
  isSelected,
  assignments,
  onSelectWeek,
  allAssignments,
  isShiftPressed,
  selectedResources,
  onResourceSelect,
  onUpdateAssignment,
  selectedCell,
  onCellSelect,
  copiedResources,
  onAddAssignment,
}: {
  project: Project;
  week: Date;
  isSelected: boolean | null;
  assignments: Assignment[];
  onSelectWeek: (week: Date | null) => void;
  allAssignments: Assignment[];
  isShiftPressed: boolean;
  selectedResources: Set<string>;
  onResourceSelect: (resourceId: string, selected: boolean) => void;
  onUpdateAssignment?: (
    assignmentId: number,
    updates: {
      employeeId: number;
      projectId: number;
      startDate: string;
      endDate: string;
      utilisation: number;
    }
  ) => void;
  selectedCell: { projectId: number; week: string } | null;
  onCellSelect: (projectId: number, week: string) => void;
  copiedResources: boolean;
  onAddAssignment: (projectId: number, week?: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-${project.id}-week-${week.toISOString()}`,
    data: {
      projectId: project.id,
      week: week,
    },
  });

  const isCellSelected =
    selectedCell?.projectId === project.id &&
    selectedCell?.week === week.toISOString();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCellSelected) {
      // Deselect if already selected
      onCellSelect(0, "");
      onSelectWeek(null);
    } else {
      // Select new cell
      onCellSelect(project.id, week.toISOString());
      onSelectWeek(week);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddAssignment(project.id, week); // Pass the week start date
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={cn(
        "shrink-0 border-r border-gray-200 transition-all duration-100 relative",
        isSelected ? "w-[250px]" : "w-[190px]",
        isOver ? "bg-blue-50" : "bg-white",
        isCellSelected && "bg-blue-50",
        assignments.length > 0 ? "p-1" : "",
        copiedResources && !isCellSelected && "hover:bg-green-50"
      )}
    >
      {isCellSelected && (
        <>
          <div className="absolute inset-0 border-2 border-blue-400 pointer-events-none" />
        </>
      )}

      {copiedResources && !isCellSelected && (
        <div className="absolute inset-0 border-2 border-dashed border-green-500 opacity-0 hover:opacity-100 pointer-events-none" />
      )}

      {isOver && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none" />
      )}

      {assignments.length > 0 ? (
        <div className="space-y-1 relative">
          {assignments.map((assignment) => (
            <ResourceCard
              key={`${assignment.id}-${week.toISOString()}`}
              assignment={assignment}
              project={project}
              week={week}
              isSelected={isSelected}
              onUpdateAssignment={onUpdateAssignment}
              isShiftPressed={isShiftPressed}
              selectedResources={selectedResources}
              onResourceSelect={onResourceSelect}
              allAssignments={allAssignments}
            />
          ))}
        </div>
      ) : (
        <div className="h-full py-2 flex items-center justify-center text-gray-400 text-xs">
          {isSelected && (
            <div className="flex flex-col items-center gap-2">
              {project.name}
              <button
                onClick={handleAddClick}
                className=" p-1 bg-black w-fit text-white rounded-full hover:bg-gray-800 z-10"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
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
  allProjects,
  isShiftPressed,
  selectedResources,
  onResourceSelect,
  onUpdateAssignment,
  selectedCell,
  copiedResources,
  onCellSelect,
}: ProjectBarProps) {
  const requirementStatus = calculateProjectRequirementStatus(project);

  const allAssignments = allProjects.flatMap((p) => p.assignments);

  const getProgressInfo = () => {
    const { status } = requirementStatus;
    switch (status) {
      case "unfulfilled":
        return { color: "bg-[#FF0000]" };
      default:
        return { color: "bg-transparent" };
    }
  };

  const progressInfo = getProgressInfo();
  const formattedStartDate = project.startDate
    ? format(new Date(project.startDate), "MMM d")
    : "N/A";
  const formattedEndDate = project.endDate
    ? format(new Date(project.endDate), "MMM d, yyyy")
    : "Ongoing";

  return (
    <div className="flex min-w-max border-b hover:bg-gray-50">
      {/* Project Info Column */}
      <div className="relative w-48 flex justify-between flex-shrink-0 py-1 px-3 border-r bg-white">
        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="flex justify-between items-center gap-2 min-w-0">
            <div
              className={`h-full w-[6px] absolute left-0 ${progressInfo.color}`}
            />
            <Link href={`/projects/${project.id}`} className="group truncate">
              <h3
                className="font-medium capitalize truncate text-sm"
                title={project.name}
              >
                {project.name}
              </h3>
              <p className="text-xs text-wrap text-gray-500">
                {formattedStartDate} - {formattedEndDate}
              </p>
            </Link>
          </div>
          <button
            onClick={() => onAddAssignment(project.id)}
            className="flex-shrink-0 text-black hover:text-gray-600 p-1 rounded"
            title="Add Assignment"
          >
            <PlusCircle size={18} />
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
                allAssignments={allAssignments}
                isShiftPressed={isShiftPressed}
                selectedResources={selectedResources}
                onResourceSelect={onResourceSelect}
                onUpdateAssignment={onUpdateAssignment}
                selectedCell={selectedCell}
                onCellSelect={onCellSelect}
                copiedResources={copiedResources}
                onAddAssignment={onAddAssignment}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, KeyboardEvent, TouchEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Assignment, Project } from "@/types/models";
import { UserCircle2 } from "lucide-react";
import { isSameWeek } from "date-fns";
import { EditResourceModal } from "../modals/EditResourceModal";

interface ResourceCardProps {
  assignment: Assignment;
  project: Project;
  week: Date;
  isSelected: boolean | null;
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
}

export function ResourceCard({
  assignment,
  project,
  week,
  isSelected,
  allAssignments,
  isShiftPressed,
  selectedResources,
  onResourceSelect,
  onUpdateAssignment,
}: ResourceCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const uniqueId = `${project.id}-${assignment.id}-${week.toISOString()}`;
  const isResourceSelected = selectedResources?.has(uniqueId);

  const isDragStarted = useRef(false);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: uniqueId,
    data: {
      assignment,
      projectId: project.id,
      week,
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isShiftPressed) {
      e.preventDefault();
      e.stopPropagation();
      onResourceSelect(uniqueId, !isResourceSelected);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isShiftPressed) {
      setShowEditModal(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragStarted.current = false;
    listeners?.onMouseDown?.(e);

    clickTimeout.current = setTimeout(() => {
      isDragStarted.current = true;
    }, 200);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    listeners?.onMouseUp?.(e);

    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }

    if (!isDragStarted.current) {
      handleClick(e);
    }
    isDragStarted.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.movementX !== 0 || e.movementY !== 0) {
      isDragStarted.current = true;
    }
    listeners?.onMouseMove?.(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    listeners?.onKeyDown?.(e);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    listeners?.onTouchStart?.(e);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    listeners?.onTouchEnd?.(e);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    listeners?.onTouchMove?.(e);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    position: "relative" as const,
    touchAction: "none",
  };

  const calculateWeeklyUtilization = () => {
    return allAssignments
      .filter((a) => a.employeeId === assignment.employeeId)
      .reduce((total, currentAssignment) => {
        const assignmentStart = new Date(currentAssignment.startDate);
        const assignmentEnd = new Date(currentAssignment.endDate);

        if (
          isSameWeek(week, assignmentStart) ||
          isSameWeek(week, assignmentEnd) ||
          (assignmentStart <= week && assignmentEnd >= week)
        ) {
          return total + currentAssignment.utilisation;
        }
        return total;
      }, 0);
  };

  const weeklyUtilization = calculateWeeklyUtilization();

  const getUtilizationInfo = (totalUtilization: number) => {
    if (totalUtilization < 50) {
      return {
        color: "bg-red-100",
        borderColor: "border-red-200",
        textColor: "text-red-700",
      };
    }
    if (totalUtilization >= 50 && totalUtilization < 80) {
      return {
        color: "bg-yellow-100",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
      };
    }
    if (totalUtilization >= 80 && totalUtilization <= 100) {
      return {
        color: "bg-green-200",
        borderColor: "border-green-300",
        textColor: "text-black",
      };
    }
    return {
      color: "bg-green-500",
      borderColor: "border-green-600",
      textColor: "text-black",
    };
  };

  const utilizationInfo = getUtilizationInfo(weeklyUtilization);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onDoubleClick={handleDoubleClick}
        className={`
          w-full rounded border transition-transform transform-gpu
          ${utilizationInfo.color} ${utilizationInfo.borderColor}
          ${isSelected ? "ring-1 ring-blue-400" : ""}
          ${isResourceSelected ? "ring-2 ring-blue-600" : ""}
          hover:shadow-sm active:shadow-md
          ${isDragging ? "shadow-lg rotate-2" : ""}
          select-none
        `}
      >
        <div className="px-2 py-1 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <UserCircle2
              className={`w-4 h-4 ${utilizationInfo.textColor} ${
                isDragging ? "animate-pulse" : ""
              }`}
            />
            <span className="font-medium text-gray-900 truncate text-sm">
              {assignment.employee.name.split(" ")[0]}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`text-xs ${utilizationInfo.textColor} font-medium`}
            >
              {assignment.utilisation}%
            </span>
            <span className="text-xs text-gray-800">/</span>
            <span className={`text-xs "text-gray-500" font-medium`}>
              {weeklyUtilization}%
            </span>
          </div>
        </div>
      </div>

      <EditResourceModal
        assignment={assignment}
        project={project}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={(
          assignmentId,
          employeeId,
          projectId,
          startDate,
          endDate,
          utilization
        ) => {
          onUpdateAssignment?.(assignmentId, {
            employeeId,
            projectId,
            startDate,
            endDate,
            utilisation: utilization,
          });
          setShowEditModal(false);
        }}
      />
    </>
  );
}

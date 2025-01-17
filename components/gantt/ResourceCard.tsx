import React, { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Assignment, Project } from "@/types/models";
import { EditResourceModal } from "../modals/EditResourceModal";

import {
  isDateOverlapping,
  toUTCStartOfDay,
  toUTCEndOfDay,
} from "@/lib/dateUtils";

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
  const isDragInitiated = useRef(false);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isShiftPressed) {
      e.preventDefault();
      e.stopPropagation();
      onResourceSelect(uniqueId, !isResourceSelected);
      return;
    }
    isDragInitiated.current = true;
    listeners?.onMouseDown?.(e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isShiftPressed && !isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setShowEditModal(true);
    }
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

  // ... other imports remain the same

  const calculateWeeklyUtilization = () => {
    const weekStart = toUTCStartOfDay(week.toISOString());
    const weekEnd = toUTCEndOfDay(
      new Date(week.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
    );

    return allAssignments
      .filter((a) => a.employeeId === assignment.employeeId)
      .reduce((total, currentAssignment) => {
        const assignmentStart = toUTCStartOfDay(currentAssignment.startDate);
        const assignmentEnd = toUTCEndOfDay(currentAssignment.endDate);

        if (
          isDateOverlapping(assignmentStart, assignmentEnd, weekStart, weekEnd)
        ) {
          return total + currentAssignment.utilisation;
        }

        console.log(`Assignment does NOT overlap with the week.`);
        return total;
      }, 0);
  };
  const weeklyUtilization = calculateWeeklyUtilization();

  const getUtilizationInfo = (totalUtilization: number) => {
    if (totalUtilization < 50) {
      return {
        color: "bg-[#FF4500]",

        textColor: "text-[#FFFFFF]",
      };
    }
    if (totalUtilization >= 50 && totalUtilization < 90) {
      return {
        color: "bg-[#FFD700]",

        textColor: "text-[#000000]",
      };
    }
    if (totalUtilization >= 90 && totalUtilization <= 120) {
      return {
        color: "bg-[#90EE90]",

        textColor: "text-[#000000]",
      };
    }
    return {
      color: "bg-[#FFA500]",

      textColor: "text-[#000000]",
    };
  };

  const utilizationInfo = getUtilizationInfo(weeklyUtilization);

  const customListeners = {
    ...listeners,
    onMouseDown: handleMouseDown,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...customListeners}
        onDoubleClick={handleDoubleClick}
        className={`
          w-full rounded border transition-transform transform-gpu
          bg-[#F9FAFB] px-[8px] py-[6px]
          ${isSelected ? "ring-1 ring-blue-400" : ""}
          ${isResourceSelected ? "ring-2 ring-blue-600" : ""}
          hover:shadow-sm active:shadow-md
          ${isDragging ? "shadow-lg rotate-2" : ""}
          select-none
        `}
      >
        <div className=" flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`font-medium truncate text-sm `}>
              {assignment.employee.name.split(" ")[0]}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 shrink-0 ${utilizationInfo.color} py-[4px] px-[8px] rounded-[40px]`}
          >
            <span
              className={`text-xs ${utilizationInfo.textColor} font-medium`}
            >
              {assignment.utilisation}%
            </span>
            <span className={`text-xs ${utilizationInfo.textColor}`}>|</span>
            <span
              className={`text-xs ${utilizationInfo.textColor} font-medium`}
            >
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

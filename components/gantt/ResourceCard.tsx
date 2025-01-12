import React, { useState } from "react";
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
  onUpdateAssignment,
}: ResourceCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const uniqueId = `${project.id}-${assignment.id}-${week.toISOString()}`;

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

  const handleEditConfirm = (
    assignmentId: number,
    employeeId: number,
    projectId: number,
    startDate: string,
    endDate: string,
    utilization: number
  ) => {
    if (onUpdateAssignment) {
      onUpdateAssignment(assignmentId, {
        employeeId,
        projectId,
        startDate,
        endDate,
        utilisation: utilization,
      });
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onDoubleClick={() => setShowEditModal(true)}
        className={`
          w-full rounded border transition-transform transform-gpu
          ${utilizationInfo.color} ${utilizationInfo.borderColor}
          ${isSelected ? "ring-1 ring-blue-400" : ""}
          hover:shadow-sm active:shadow-md
          ${isDragging ? "shadow-lg rotate-2" : ""}
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

        {/* Drag handle indicator */}
        <div className="absolute inset-y-0 left-0 w-1 bg-gray-200 opacity-0 group-hover:opacity-100 rounded-l" />
      </div>

      <EditResourceModal
        assignment={assignment}
        project={project}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={handleEditConfirm}
      />
    </>
  );
}

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Assignment } from "@/types/models";
import { UserCircle2 } from "lucide-react";

interface ResourceCardProps {
  assignment: Assignment;
  projectId: number;
  week: Date;
  isSelected: boolean;
}

export function ResourceCard({
  assignment,
  projectId,
  week,
  isSelected,
}: ResourceCardProps) {
  const uniqueId = `${projectId}-${assignment.id}-${week.toISOString()}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: uniqueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const getUtilizationInfo = (utilization: number) => {
    if (utilization >= 80) {
      return {
        color: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-700",
      };
    }
    if (utilization >= 40) {
      return {
        color: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
      };
    }
    return {
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
    };
  };

  const utilizationInfo = getUtilizationInfo(assignment.utilisation);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        w-full relative z-10 rounded border cursor-move transition-all text-sm
        ${utilizationInfo.color} ${utilizationInfo.borderColor}
        ${isSelected ? "ring-1 ring-blue-400" : ""}
      `}
    >
      <div className="px-2 py-1 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserCircle2 className={`w-4 h-4 ${utilizationInfo.textColor}`} />
          <span className="font-medium text-gray-900 truncate">
            {assignment.employee.name.split(" ")[0]}
          </span>
        </div>
        <div
          className={`text-xs ${utilizationInfo.textColor} font-medium shrink-0`}
        >
          {assignment.utilisation}%
        </div>
      </div>
    </div>
  );
}

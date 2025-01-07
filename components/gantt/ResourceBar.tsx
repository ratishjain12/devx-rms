// ResourceBar.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Assignment } from "@/types/models";

interface ResourceBarProps {
  assignment: Assignment;
  projectId: number;
}

export function ResourceBar({ assignment, projectId }: ResourceBarProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `${projectId}-${assignment.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return "bg-green-100 border-green-300";
    if (utilization >= 40) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  const utilizationColor = getUtilizationColor(assignment.utilisation);
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`h-8 rounded-lg border flex items-center justify-center text-xs cursor-move overflow-hidden group ${utilizationColor}`}
      title={`${assignment.employee.name} (${assignment.utilisation}%)`}
    >
      <div className="px-2 py-1 text-center min-w-0">
        <div className="font-medium truncate">
          {assignment.employee.name.split(" ")[0]}{" "}
          {/* Show only the first name */}
        </div>
      </div>
    </div>
  );
}

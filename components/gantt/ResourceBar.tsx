// ResourceBar.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Assignment } from "@/types/models";

interface ResourceBarProps {
  assignment: Assignment;
  projectId: number;
  week: Date;
  isSelected: boolean | null; // Add this prop
}

export function ResourceBar({
  assignment,
  projectId,
  week,
  isSelected,
}: ResourceBarProps) {
  // Generate a unique ID for the draggable item
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
    opacity: isDragging ? 0.5 : 1, // Add opacity effect when dragging
    zIndex: isDragging ? 1000 : 1, // Ensure the dragged item is above others
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
      className={`h-full w-full rounded-lg border flex items-center justify-center text-xs cursor-move overflow-hidden group ${utilizationColor} ${
        isSelected ? "ring-2 ring-blue-500 " : "" // Highlight selected resources
      }`}
      title={`${assignment.employee.name} - (${new Date(
        assignment.startDate
      ).toDateString()} - ${new Date(assignment.endDate).toDateString()}) (${
        assignment.utilisation
      }%)`}
    >
      <div className="px-2 py-1 flex gap-3 text-center">
        <div className="font-medium truncate">
          {assignment.employee.name.split(" ")[0]}
        </div>
        {isSelected && <div>{`(${assignment.utilisation})`}%</div>}
      </div>
    </div>
  );
}

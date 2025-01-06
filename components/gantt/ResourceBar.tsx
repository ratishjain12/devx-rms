// ResourceBar.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Assignment } from "@/types/models";

interface ResourceBarProps {
  assignment: Assignment;
  projectId: number;
  width: number;
}

export function ResourceBar({
  assignment,
  projectId,
  width,
}: ResourceBarProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `${projectId}-${assignment.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${width}%`,
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
      className={`h-full relative rounded-lg  border flex items-center justify-center text-xs cursor-move overflow-hidden group ${utilizationColor}`}
      title={`${assignment.employee.name} (${assignment.utilisation}%)`}
    >
      <div className="px-1 text-center">
        <div className="font-medium truncate">
          {assignment.employee.name.split(" ").map((word, index) => (
            <React.Fragment key={index}>
              {word}
              {index < assignment.employee.name.split(" ").length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <div className="text-gray-500 text-[10px]">
          {assignment.utilisation}%
        </div>
      </div>
    </div>
  );
}

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
    minWidth: "100px",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-full bg-blue-500 border-r border-blue-600 last:border-r-0 flex items-center justify-center text-white text-xs cursor-move overflow-hidden"
      title={`${assignment.employee.name} (${assignment.utilisation.toFixed(
        0
      )}%)`}
    >
      {assignment.employee.name.split(" ").map((word, index) => (
        <React.Fragment key={index}>
          {word}
          {index < assignment.employee.name.split(" ").length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}

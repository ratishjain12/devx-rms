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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-full relative z-10 bg-white border  border-black flex items-center justify-center  text-xs cursor-move overflow-hidden"
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

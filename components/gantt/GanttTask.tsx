import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GanttTaskProps {
  id: string;
  name: string;
}

export function GanttTask({ id, name }: GanttTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 p-2 mb-2 rounded cursor-move"
    >
      {name}
    </div>
  );
}

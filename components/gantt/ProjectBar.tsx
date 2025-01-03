// ProjectBar.tsx
import React from "react";
import { addDays, differenceInWeeks } from "date-fns";
import { Project } from "@/types/models";
import { ResourceBar } from "./ResourceBar";
import { PlusCircle } from "lucide-react";

interface ProjectBarProps {
  project: Project;
  timelineStart: Date;
  timelineEnd: Date;
  onAddAssignment: (projectId: number) => void;
  selectedWeek: Date | null;
}

export function ProjectBar({
  project,
  timelineStart,
  timelineEnd,
  onAddAssignment,
  selectedWeek,
}: ProjectBarProps) {
  const startDate = new Date(project.startDate);
  const endDate = project.endDate ? new Date(project.endDate) : timelineEnd;
  const projectStart = differenceInWeeks(startDate, timelineStart);
  const projectEnd = differenceInWeeks(endDate, timelineStart);
  const projectDuration = projectEnd - projectStart;
  const totalWeeks = differenceInWeeks(timelineEnd, timelineStart) + 1;

  const isInWeek =
    selectedWeek &&
    startDate <= addDays(selectedWeek, 6) &&
    endDate >= selectedWeek;

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm mb-2">
      <div className="w-1/4 px-4 py-2 flex items-center justify-between">
        <span className="font-semibold truncate" title={project.name}>
          {project.name}
        </span>
        <button
          onClick={() => onAddAssignment(project.id)}
          className="text-blue-500 hover:text-blue-600"
          title="Add Assignment"
        >
          <PlusCircle size={20} />
        </button>
      </div>
      <div className="w-3/4 relative" style={{ height: "60px" }}>
        <div
          className={`absolute top-0 h-full ${
            isInWeek ? "bg-blue-200" : "bg-blue-100"
          }`}
          style={{
            left: `${(projectStart / totalWeeks) * 100}%`,
            width: `${(projectDuration / totalWeeks) * 100}%`,
          }}
        >
          <div className="flex h-full">
            {project.assignments.map((assignment) => (
              <ResourceBar
                key={assignment.id}
                assignment={assignment}
                projectId={project.id}
                width={100 / project.assignments.length}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { differenceInWeeks } from "date-fns";
import { Project } from "@/types/models";
import { ResourceBar } from "./ResourceBar";

interface ProjectBarProps {
  project: Project;
  timelineStart: Date;
  timelineEnd: Date;
}

export function ProjectBar({
  project,
  timelineStart,
  timelineEnd,
}: ProjectBarProps) {
  const startDate = new Date(project.startDate);
  const endDate = project.endDate ? new Date(project.endDate) : timelineEnd;
  const projectStart = differenceInWeeks(startDate, timelineStart);
  const projectEnd = differenceInWeeks(endDate, timelineStart);
  const projectDuration = projectEnd - projectStart;
  const totalWeeks = differenceInWeeks(timelineEnd, timelineStart) + 1;

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm mb-2">
      <div
        className="w-1/4 px-4 py-2 font-semibold truncate"
        title={`Type: ${project.type}
Tools: ${project.tools.join(", ")}
Client Satisfaction: ${project.client_satisfaction}`}
      >
        {project.name}
      </div>
      <div className="w-3/4 relative" style={{ height: "60px" }}>
        <div
          className="absolute top-0 h-full bg-blue-100"
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

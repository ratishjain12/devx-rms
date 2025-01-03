"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { addWeeks, startOfWeek, endOfWeek, max, min } from "date-fns";
import { ProjectBar } from "./ProjectBar";
import { TimelineHeader } from "./TimelineHeader";
import { UtilizationModal } from "../modals/UtilizationModal";
import { Project, Employee, Assignment } from "@/types/models";

const calculateWeeks = (start: Date, end: Date): Date[] => {
  const weeks: Date[] = [];
  let currentWeek = start;
  while (currentWeek <= end) {
    weeks.push(currentWeek);
    currentWeek = addWeeks(currentWeek, 1);
  }
  return weeks;
};

export function GanttChart() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timelineStart, setTimelineStart] = useState<Date>(
    startOfWeek(new Date())
  );
  const [timelineEnd, setTimelineEnd] = useState<Date>(
    endOfWeek(addWeeks(new Date(), 23))
  ); // 24 weeks (about 6 months)
  const [showUtilizationModal, setShowUtilizationModal] = useState(false);
  const [movedAssignment, setMovedAssignment] = useState<{
    assignment: Assignment;
    fromProject: Project;
    toProject: Project;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const weeks = useMemo(
    () => calculateWeeks(timelineStart, timelineEnd),
    [timelineStart, timelineEnd]
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      const projectStartDates = projects.map((p) => new Date(p.startDate));
      const projectEndDates = projects.map((p) =>
        p.endDate ? new Date(p.endDate) : timelineEnd
      );
      const earliestStart = min(projectStartDates);
      const latestEnd = max(projectEndDates);

      setTimelineStart(startOfWeek(earliestStart));
      setTimelineEnd(endOfWeek(max([latestEnd, addWeeks(earliestStart, 23)])));
    }
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const fromProjectId = parseInt(active.id.toString().split("-")[0]);
      const toProjectId = parseInt(over?.id.toString().split("-")[0] || "");
      const assignmentId = parseInt(active.id.toString().split("-")[1]);

      const fromProject = projects.find((p) => p.id === fromProjectId);
      const toProject = projects.find((p) => p.id === toProjectId);

      if (fromProject && toProject) {
        const assignment = fromProject.assignments.find(
          (a) => a.id === assignmentId
        );
        if (assignment) {
          setMovedAssignment({
            assignment,
            fromProject,
            toProject,
          });
          setShowUtilizationModal(true);
        }
      }
    }
  };

  const handleUtilizationConfirm = (
    employee: Employee,
    newUtilization: number,
    previousUtilization: number
  ) => {
    if (movedAssignment) {
      setProjects((prevProjects) => {
        return prevProjects.map((project) => {
          if (project.id === movedAssignment.fromProject.id) {
            if (previousUtilization > 0) {
              return {
                ...project,
                assignments: project.assignments.map((a) =>
                  a.id === movedAssignment.assignment.id
                    ? { ...a, utilisation: previousUtilization }
                    : a
                ),
              };
            } else {
              return {
                ...project,
                assignments: project.assignments.filter(
                  (a) => a.id !== movedAssignment.assignment.id
                ),
              };
            }
          }
          if (project.id === movedAssignment.toProject.id) {
            const existingAssignment = project.assignments.find(
              (a) => a.id === movedAssignment.assignment.id
            );
            if (existingAssignment) {
              return {
                ...project,
                assignments: project.assignments.map((a) =>
                  a.id === movedAssignment.assignment.id
                    ? { ...a, utilisation: newUtilization }
                    : a
                ),
              };
            } else {
              return {
                ...project,
                assignments: [
                  ...project.assignments,
                  {
                    ...movedAssignment.assignment,
                    utilisation: newUtilization,
                    projectId: project.id,
                  },
                ],
              };
            }
          }
          return project;
        });
      });
      setHasUnsavedChanges(true);
    }
    setShowUtilizationModal(false);
    setMovedAssignment(null);
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        console.log("Changes saved successfully");
      } else {
        console.error("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Project Timeline (Weekly View)
      </h1>
      <TimelineHeader weeks={weeks} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={projects.flatMap((p) =>
            p.assignments.map((a) => `${p.id}-${a.id}`)
          )}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {projects.map((project) => (
              <ProjectBar
                key={project.id}
                project={project}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {showUtilizationModal && movedAssignment && (
        <UtilizationModal
          assignment={movedAssignment.assignment}
          fromProject={movedAssignment.fromProject}
          toProject={movedAssignment.toProject}
          onConfirm={handleUtilizationConfirm}
          onClose={() => {
            setShowUtilizationModal(false);
            setMovedAssignment(null);
          }}
        />
      )}
      <button
        onClick={handleSave}
        disabled={!hasUnsavedChanges}
        className={`mt-4 px-4 py-2 rounded ${
          hasUnsavedChanges
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        Save Changes
      </button>
    </div>
  );
}

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
import { addWeeks, subWeeks, startOfWeek, addDays } from "date-fns";
import { ProjectBar } from "./ProjectBar";
import { TimelineHeader } from "./TimelineHeader";
import { UtilizationModal } from "../modals/UtilizationModal";
import { AssignmentModal } from "../modals/AssignmentModal";
import {
  AvailableEmployee,
  AvailableEmployeesList,
} from "./AvailableEmployeesList";
import { Project, Employee, Assignment } from "@/types/models";

interface TempAssignment {
  fromProjectId: number;
  toProjectId: number;
  assignment: Assignment;
  previousUtilization: number;
  newUtilization: number;
}

const calculateTimelineWeeks = (): Date[] => {
  const today = new Date();
  const start = startOfWeek(subWeeks(today, 12));
  const end = startOfWeek(addWeeks(today, 24));

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
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [showUtilizationModal, setShowUtilizationModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<
    AvailableEmployee[]
  >([]);
  const [tempAssignments, setTempAssignments] = useState<TempAssignment[]>([]);
  const [movedAssignment, setMovedAssignment] = useState<{
    assignment: Assignment;
    fromProject: Project;
    toProject: Project;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const weeks = useMemo(calculateTimelineWeeks, []);
  const timelineStart = weeks[0];
  const timelineEnd = weeks[weeks.length - 1];

  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const handleWeekSelect = async (week: Date) => {
    setSelectedWeek(week);
    try {
      const weekEnd = addDays(week, 6);
      const response = await fetch(
        `/api/employees/available?startDate=${week.toISOString()}&endDate=${weekEnd.toISOString()}&availabilityThreshold=80`
      );
      const data = await response.json();
      setAvailableEmployees(data);
    } catch (error) {
      console.error("Failed to fetch available employees:", error);
    }
  };

  const handleAssignmentConfirm = async (
    projectId: number,
    employeeId: number,
    utilization: number
  ) => {
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          employeeId,
          utilization,
          startDate: selectedWeek?.toISOString(),
          endDate: addDays(selectedWeek!, 6).toISOString(),
        }),
      });

      if (response.ok) {
        await fetchProjects();
        setShowAssignmentModal(false);
        setSelectedProject(null);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
    }
  };

  const handleAddAssignment = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowAssignmentModal(true);
    }
  };
  const handleUtilizationConfirm = (
    employee: Employee,
    newUtilization: number,
    previousUtilization: number
  ) => {
    if (movedAssignment) {
      setTempAssignments((prev) => [
        ...prev,
        {
          fromProjectId: movedAssignment.fromProject.id,
          toProjectId: movedAssignment.toProject.id,
          assignment: movedAssignment.assignment,
          previousUtilization,
          newUtilization,
        },
      ]);

      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id === movedAssignment.fromProject.id) {
            return {
              ...project,
              assignments: project.assignments.map((a) =>
                a.id === movedAssignment.assignment.id
                  ? { ...a, utilisation: previousUtilization }
                  : a
              ),
            };
          }
          if (project.id === movedAssignment.toProject.id) {
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
          return project;
        })
      );

      setHasUnsavedChanges(true);
    }
    setShowUtilizationModal(false);
    setMovedAssignment(null);
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

  const handleSave = async () => {
    try {
      for (const temp of tempAssignments) {
        if (temp.previousUtilization > 0) {
          await fetch(`/api/assignments/${temp.assignment.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employeeId: temp.assignment.employeeId,
              projectId: temp.fromProjectId,
              startDate: temp.assignment.startDate,
              endDate: temp.assignment.endDate,
              utilisation: temp.previousUtilization,
            }),
          });
        }

        await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: temp.assignment.employeeId,
            projectId: temp.toProjectId,
            startDate: temp.assignment.startDate,
            endDate: temp.assignment.endDate,
            utilisation: temp.newUtilization,
          }),
        });
      }

      await fetchProjects();
      setTempAssignments([]);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <TimelineHeader
        weeks={weeks}
        selectedWeek={selectedWeek}
        onSelectWeek={handleWeekSelect}
      />

      <div className="flex space-x-4">
        <div className="flex-grow">
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
                    onAddAssignment={handleAddAssignment}
                    selectedWeek={selectedWeek}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

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
      </div>

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

      {showAssignmentModal && selectedProject && (
        <AssignmentModal
          project={selectedProject}
          availableEmployees={availableEmployees}
          onConfirm={handleAssignmentConfirm}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedProject(null);
          }}
        />
      )}
      {selectedWeek && (
        <div>
          <AvailableEmployeesList
            employees={availableEmployees}
            weekRange={{
              start: selectedWeek,
              end: addDays(selectedWeek, 6),
            }}
          />
        </div>
      )}
    </div>
  );
}

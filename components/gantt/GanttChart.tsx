// GanttChart.tsx
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

interface TempMovedAssignment {
  type: "moved";
  fromProjectId: number;
  toProjectId: number;
  assignment: Assignment;
  previousUtilization: number;
  newUtilization: number;
}

interface TempNewAssignment {
  type: "new";
  projectId: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  utilisation: number;
}

const calculateTimelineWeeks = (): Date[] => {
  // Get the first day of the current month
  const today = new Date();
  const currentWeek = startOfWeek(today);

  // Calculate 3 weeks back and 10 weeks forward
  const start = subWeeks(currentWeek, 3);
  const end = addWeeks(currentWeek, 10);

  const weeks: Date[] = [];
  let currentDate = start;

  while (currentDate <= end) {
    weeks.push(currentDate);
    currentDate = addWeeks(currentDate, 1);
  }

  return weeks;
};

type TempAssignment = TempNewAssignment | TempMovedAssignment;

export function GanttChart() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [showUtilizationModal, setShowUtilizationModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<
    AvailableEmployee[]
  >([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
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
    fetchAllEmployees();
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

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setAllEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };
  const handleWeekSelect = async (week: Date | null) => {
    setSelectedWeek(week);
    if (week) {
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
    } else {
      // Clear available employees when deselecting
      setAvailableEmployees([]);
    }
  };

  const handleAddAssignment = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowAssignmentModal(true);
    }
  };

  const handleAssignmentConfirm = (
    projectId: number,
    employeeId: number,
    utilization: number,
    startDate: string,
    endDate: string
  ) => {
    // Add to temp assignments
    const newAssignment: TempNewAssignment = {
      type: "new",
      projectId,
      employeeId,
      startDate,
      endDate,
      utilisation: utilization,
    };

    setTempAssignments((prev) => [...prev, newAssignment]);

    // Update UI immediately
    const selectedEmployee = allEmployees.find((e) => e.id === employeeId);
    if (selectedEmployee) {
      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id === projectId) {
            // Create a temporary assignment for UI
            const tempUIAssignment: Assignment = {
              id: -Date.now(), // Temporary negative ID
              employeeId,
              projectId,
              startDate,
              endDate,
              utilisation: utilization,
              employee: selectedEmployee,
              project: project,
            };

            return {
              ...project,
              assignments: [...project.assignments, tempUIAssignment],
            };
          }
          return project;
        })
      );
    }

    setShowAssignmentModal(false);
    setSelectedProject(null);
    setHasUnsavedChanges(true);
  };

  const handleUtilizationConfirm = (
    newUtilization: number,
    previousUtilization: number
  ) => {
    if (movedAssignment) {
      // Create properly typed moved assignment
      const tempMovedAssignment: TempMovedAssignment = {
        type: "moved",
        fromProjectId: movedAssignment.fromProject.id,
        toProjectId: movedAssignment.toProject.id,
        assignment: movedAssignment.assignment,
        previousUtilization,
        newUtilization,
      };

      setTempAssignments((prev) => [...prev, tempMovedAssignment]);

      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id === movedAssignment.fromProject.id) {
            return {
              ...project,
              assignments:
                previousUtilization === 0
                  ? project.assignments.filter(
                      (a) => a.id !== movedAssignment.assignment.id
                    )
                  : project.assignments.map((a) =>
                      a.id === movedAssignment.assignment.id
                        ? { ...a, utilisation: previousUtilization }
                        : a
                    ),
            };
          }
          if (
            project.id === movedAssignment.toProject.id &&
            newUtilization > 0
          ) {
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
  // GanttChart.tsx - update handleDragEnd
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      const [fromProjectId, assignmentId] = active.id.toString().split("-");
      // Extract project ID from the droppable area ID
      const toProjectId = (over.id as string).replace("project-", "");

      const fromProject = projects.find(
        (p) => p.id === parseInt(fromProjectId)
      );
      const toProject = projects.find((p) => p.id === parseInt(toProjectId));

      if (fromProject && toProject) {
        const assignment = fromProject.assignments.find(
          (a) => a.id === parseInt(assignmentId)
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
        if (temp.type === "moved") {
          // Handle moved assignments
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
          } else {
            await fetch(`/api/assignments/${temp.assignment.id}`, {
              method: "DELETE",
            });
          }

          if (temp.newUtilization > 0) {
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
        } else if (temp.type === "new") {
          // Handle new assignments
          await fetch("/api/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employeeId: temp.employeeId,
              projectId: temp.projectId,
              startDate: temp.startDate,
              endDate: temp.endDate,
              utilisation: temp.utilisation,
            }),
          });
        }
      }

      await fetchProjects();
      setTempAssignments([]);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };
  // GanttChart.tsx - update the return section
  return (
    <div className="mx-auto p-4">
      {selectedWeek && (
        <div className="border-b">
          <AvailableEmployeesList
            employees={availableEmployees}
            weekRange={{
              start: selectedWeek,
              end: addDays(selectedWeek, 6),
            }}
          />
        </div>
      )}
      <div className="border rounded-lg bg-white shadow">
        {/* Timeline Header */}
        <div className="sticky top-0  bg-white border-b">
          <TimelineHeader
            weeks={weeks}
            selectedWeek={selectedWeek}
            onSelectWeek={handleWeekSelect}
          />
        </div>

        {/* Available Employees Section */}

        {/* Main Timeline Content */}
        <div className="relative">
          {/* Timeline grid background */}
          <div className="absolute inset-0 flex pointer-events-none">
            {weeks.map((week) => (
              <div
                key={week.toISOString()}
                className="min-w-[120px] border-r border-gray-100"
              />
            ))}
          </div>

          {/* Project list and timeline */}
          <div className="relative">
            <div>
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
                  <div>
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-white border-t mt-auto">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`px-4 py-2 rounded ${
              hasUnsavedChanges
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Modals */}
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
          employees={allEmployees} // Changed from availableEmployees
          onConfirm={handleAssignmentConfirm}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}

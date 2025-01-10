/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { AddProjectModal } from "../modals/AddProjectModal";
import { Undo2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TempMovedAssignment {
  type: "moved";
  fromProjectId: number;
  toProjectId: number;
  assignment: Assignment;
  previousUtilization: number;
  newUtilization: number;
  isSameProject: boolean;
}

interface TempNewAssignment {
  type: "new";
  projectId: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  utilisation: number;
}

type TempAssignment = TempNewAssignment | TempMovedAssignment;

const calculateTimelineWeeks = (): Date[] => {
  const today = new Date();
  const currentWeek = startOfWeek(today);
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

export function GanttChart() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsHistory, setProjectsHistory] = useState<
    {
      projects: Project[];
      tempAssignments: TempAssignment[];
    }[]
  >([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [showUtilizationModal, setShowUtilizationModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
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
    isSameProject: boolean;
    targetWeekStart: string; // Start of the target week
    targetWeekEnd: string;
  } | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [availabilityThreshold, setAvailabilityThreshold] = useState(80);

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
      // Initialize history with the fetched state
      setProjectsHistory([
        {
          projects: data.projects,
          tempAssignments: [],
        },
      ]);
      setCurrentHistoryIndex(0);
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

  const handleProjectsChange = (
    newProjects: Project[],
    newTempAssignments: TempAssignment[]
  ) => {
    console.log("Updating projects and tempAssignments:", {
      newProjects,
      newTempAssignments,
    });

    const updatedHistory = projectsHistory.slice(0, currentHistoryIndex + 1);
    const newHistoryEntry = {
      projects: newProjects,
      tempAssignments: newTempAssignments,
    };

    setProjectsHistory([...updatedHistory, newHistoryEntry]);
    setCurrentHistoryIndex(currentHistoryIndex + 1);
    setProjects(newProjects);
    setTempAssignments(newTempAssignments);
    setHasUnsavedChanges(true);
  };

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const previousState = projectsHistory[newIndex];

      setCurrentHistoryIndex(newIndex);
      setProjects(previousState.projects);
      setTempAssignments(previousState.tempAssignments);
    }
  };

  const handleReset = () => {
    if (projectsHistory[0]) {
      setProjects(projectsHistory[0].projects);
      setTempAssignments(projectsHistory[0].tempAssignments);
      setProjectsHistory([projectsHistory[0]]);
      setCurrentHistoryIndex(0);
      setHasUnsavedChanges(false);
    }
  };

  const handleWeekSelect = async (week: Date | null) => {
    setSelectedWeek(week);
    if (week) {
      try {
        const weekEnd = addDays(week, 6);
        const response = await fetch(
          `/api/employees/available?startDate=${week.toISOString()}&endDate=${weekEnd.toISOString()}&availabilityThreshold=${availabilityThreshold}`
        );
        const data = await response.json();
        setAvailableEmployees(data);
      } catch (error) {
        console.error("Failed to fetch available employees:", error);
      }
    } else {
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
    console.log("Adding assignment:", {
      projectId,
      employeeId,
      utilization,
      startDate,
      endDate,
    });

    const newAssignment: TempNewAssignment = {
      type: "new",
      projectId,
      employeeId,
      startDate,
      endDate,
      utilisation: utilization,
    };

    const newTempAssignments = [...tempAssignments, newAssignment];
    console.log("Updated Temp Assignments:", newTempAssignments);

    const selectedEmployee = allEmployees.find((e) => e.id === employeeId);
    if (selectedEmployee) {
      const newProjects = projects.map((project) => {
        if (project.id === projectId) {
          const tempUIAssignment: Assignment = {
            id: -Date.now(), // Temporary ID for UI
            employeeId,
            projectId,
            startDate,
            endDate,
            utilisation: utilization,
            employee: selectedEmployee,
            project: project,
          };

          console.log(
            "Adding assignment to project:",
            project.name,
            tempUIAssignment
          );

          return {
            ...project,
            assignments: [...project.assignments, tempUIAssignment],
          };
        }
        return project;
      });

      console.log("Updated Projects:", newProjects);
      handleProjectsChange(newProjects, newTempAssignments);
    }

    setShowAssignmentModal(false);
    setSelectedProject(null);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      // Log the raw IDs for debugging
      console.log("Raw Active ID:", active.id);
      console.log("Raw Over ID:", over.id);

      // Parse the active ID (format: projectId-assignmentId-week)
      const activeParts = active.id.toString().split("-");
      const activeProjectId = activeParts[0]; // First part: projectId
      const assignmentId = activeParts[1]; // Second part: assignmentId
      const activeWeek = activeParts.slice(2).join("-"); // Rest: week (full date string)

      // Parse the over ID (format: project-projectId-week-week)
      const overParts = over.id.toString().split("-");
      const targetProjectId = overParts[1]; // Second part: projectId
      const targetWeek = overParts.slice(3).join("-"); // Rest: week (full date string)

      // Log the parsed values for debugging
      console.log("Active Project ID:", activeProjectId);
      console.log("Active Week:", activeWeek);
      console.log("Target Project ID:", targetProjectId);
      console.log("Target Week:", targetWeek);

      // Helper function to calculate the start of the week (Sunday)
      const getStartOfWeek = (dateString: string) => {
        // Ensure the date string is valid
        if (!dateString || isNaN(new Date(dateString).getTime())) {
          throw new Error(`Invalid date string: ${dateString}`);
        }

        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - dayOfWeek); // Move to Sunday
        startOfWeek.setHours(0, 0, 0, 0); // Normalize time to midnight
        return startOfWeek.toISOString(); // Return as ISO string for comparison
      };

      try {
        // Calculate the start of the week for both active and target weeks
        const activeStartOfWeek = getStartOfWeek(activeWeek);
        const targetStartOfWeek = getStartOfWeek(targetWeek);

        // Log the start of the week for debugging
        console.log("Active Start of Week:", activeStartOfWeek);
        console.log("Target Start of Week:", targetStartOfWeek);

        // Check if the resource is being dragged within the same project and same week slot
        const isSameProject = activeProjectId === targetProjectId;
        const isSameWeekSlot = activeStartOfWeek === targetStartOfWeek;

        if (!isSameProject || !isSameWeekSlot) {
          // Show the utilization modal if either the project or week slot is different
          const fromProject = projects.find(
            (p) => p.id === parseInt(activeProjectId)
          );
          const toProject = projects.find(
            (p) => p.id === parseInt(targetProjectId)
          );

          if (fromProject && toProject) {
            const assignment = fromProject.assignments.find(
              (a) => a.id === parseInt(assignmentId)
            );
            if (assignment) {
              const targetWeekStart = new Date(targetWeek);
              const targetWeekEnd = new Date(targetWeekStart);
              targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
              setMovedAssignment({
                assignment,
                fromProject,
                toProject,
                isSameProject,
                targetWeekStart: targetWeekStart.toISOString(),
                targetWeekEnd: targetWeekEnd.toISOString(),
              });
              setShowUtilizationModal(true);
            }
          }
        } else {
          console.log(
            "Dragging within the same week slot of the same project. No action needed."
          );
        }
      } catch (error) {
        console.error("Error calculating start of week:", error);
      }
    }
  };
  const handleThresholdChange = async (newThreshold: number) => {
    setAvailabilityThreshold(newThreshold);
    if (selectedWeek) {
      try {
        const weekEnd = addDays(selectedWeek, 6);
        const response = await fetch(
          `/api/employees/available?startDate=${selectedWeek.toISOString()}&endDate=${weekEnd.toISOString()}&availabilityThreshold=${newThreshold}`
        );
        const data = await response.json();
        setAvailableEmployees(data);
      } catch (error) {
        console.error("Failed to fetch available employees:", error);
      }
    }
  };

  const handleUtilizationConfirm = (
    newUtilization: number,
    previousUtilization: number,
    newStartDate: string,
    newEndDate: string
  ) => {
    if (movedAssignment) {
      const { assignment, fromProject, toProject, isSameProject } =
        movedAssignment;

      const tempMovedAssignment: TempMovedAssignment = {
        type: "moved",
        fromProjectId: fromProject.id,
        toProjectId: toProject.id,
        assignment: {
          ...assignment,
          startDate: newStartDate,
          endDate: newEndDate,
        },
        previousUtilization,
        newUtilization,
        isSameProject: fromProject.id === toProject.id,
      };

      const newTempAssignments = [...tempAssignments, tempMovedAssignment];

      const newProjects = projects.map((project) => {
        if (isSameProject && project.id === fromProject.id) {
          // Handle same project move: update dates and utilization
          return {
            ...project,
            assignments: project.assignments.map((a) =>
              a.id === assignment.id
                ? {
                    ...a,
                    startDate: newStartDate,
                    endDate: newEndDate,
                    utilisation: newUtilization,
                  }
                : a
            ),
          };
        } else if (!isSameProject) {
          if (project.id === fromProject.id) {
            // Remove or update assignment in source project
            return {
              ...project,
              assignments:
                previousUtilization === 0
                  ? project.assignments.filter((a) => a.id !== assignment.id)
                  : project.assignments.map((a) =>
                      a.id === assignment.id
                        ? { ...a, utilisation: previousUtilization }
                        : a
                    ),
            };
          }
          if (project.id === toProject.id && newUtilization > 0) {
            // Add new assignment to target project
            return {
              ...project,
              assignments: [
                ...project.assignments,
                {
                  ...assignment,
                  startDate: newStartDate,
                  endDate: newEndDate,
                  utilisation: newUtilization,
                  projectId: project.id,
                },
              ],
            };
          }
        }
        return project;
      });

      handleProjectsChange(newProjects, newTempAssignments);
    }
    setShowUtilizationModal(false);
    setMovedAssignment(null);
  };

  const handleSave = async () => {
    try {
      for (const temp of tempAssignments) {
        if (temp.type === "moved") {
          if (temp.isSameProject) {
            await fetch(`/api/assignments/${temp.assignment.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: temp.assignment.employeeId,
                projectId: temp.toProjectId,
                startDate: temp.assignment.startDate,
                endDate: temp.assignment.endDate,
                utilisation: temp.newUtilization,
              }),
            });
          } else {
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
          }
        } else if (temp.type === "new") {
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

  // Update the grid structure in GanttChart.tsx
  return (
    <div className="mx-auto p-4">
      <div className="border rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Timeline Header */}
            <div className="sticky top-0  bg-white border-b">
              <TimelineHeader
                weeks={weeks}
                selectedWeek={selectedWeek}
                onSelectWeek={handleWeekSelect}
              />
            </div>

            {/* Main Timeline Content */}
            {/* Main Timeline Content in GanttChart.tsx */}
            <div className="relative">
              {/* Fixed grid lines */}
              <div className="absolute inset-0 flex">
                <div className="w-48 shrink-0 border-r border-gray-200" />
                <div className="flex flex-1">
                  {weeks.map((week) => (
                    <div
                      key={week.toISOString()}
                      className={cn(
                        "shrink-0 border-r border-gray-200",
                        selectedWeek?.toISOString() === week.toISOString()
                          ? "w-[180px]"
                          : "w-[120px] "
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Projects Container */}
              <div className="relative">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={projects.flatMap((p) =>
                      p.assignments.flatMap((a) =>
                        weeks.map(
                          (week) => `${p.id}-${a.id}-${week.toISOString()}`
                        )
                      )
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
                          weeks={weeks}
                          allProjects={projects}
                          onSelectWeek={handleWeekSelect}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 flex gap-4 bg-white border-t">
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={currentHistoryIndex <= 0}
              className={`px-4 py-2 rounded flex items-center gap-2
        ${
          currentHistoryIndex > 0
            ? "bg-gray-100 hover:bg-gray-200"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
            >
              <Undo2 size={16} />
              Undo
            </button>
            <button
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
              className={`px-4 py-2 rounded flex items-center gap-2
        ${
          hasUnsavedChanges
            ? "bg-gray-100 hover:bg-gray-200"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
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
          <button
            onClick={() => setShowAddProjectModal(true)}
            className="bg-blue-500 px-4 py-2 rounded  text-white hover:bg-blue-600"
          >
            Add Project
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
          targetWeekStart={movedAssignment.targetWeekStart} // Pass target week start
          targetWeekEnd={movedAssignment.targetWeekEnd}
          isSameProject={movedAssignment.isSameProject}
          onClose={() => {
            setShowUtilizationModal(false);
            setMovedAssignment(null);
          }}
        />
      )}

      {showAssignmentModal && selectedProject && (
        <AssignmentModal
          project={selectedProject}
          employees={allEmployees}
          onConfirm={handleAssignmentConfirm}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedProject(null);
          }}
        />
      )}
      {selectedWeek && (
        <div className="mb-4 mt-3 max-w-[80vw] border rounded-lg bg-white shadow">
          <AvailableEmployeesList
            employees={availableEmployees}
            weekRange={{
              start: selectedWeek,
              end: addDays(selectedWeek, 6),
            }}
            threshold={availabilityThreshold}
            onThresholdChange={handleThresholdChange}
          />
        </div>
      )}

      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        onProjectAdded={fetchProjects}
      />
    </div>
  );
}

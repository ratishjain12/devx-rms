/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  addDays,
  endOfWeek,
  isWithinInterval,
  set,
} from "date-fns";
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
import { Undo2, RotateCcw, Save, Plus } from "lucide-react";
import { cn, toISODateString, toISOEndDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { toUTCEndOfDay, toUTCStartOfDay } from "@/lib/dateUtils";

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

interface TempEditedAssignment {
  type: "edited";
  assignmentId: number;
  updates: {
    employeeId: number;
    projectId: number;
    startDate: string;
    endDate: string;
    utilisation: number;
  };
}

interface TempWeekDeleteAssignment {
  type: "weekDelete";
  assignmentId: number;
  weekStart: string;
}

type TempAssignment =
  | TempNewAssignment
  | TempMovedAssignment
  | TempEditedAssignment
  | TempWeekDeleteAssignment;

export interface SelectedCell {
  projectId: number;
  week: Date;
}

const calculateTimelineWeeks = (): Date[] => {
  const today = new Date();
  const currentWeek = startOfWeek(today, { weekStartsOn: 0 }); // 1 = Monday
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
      selectedResources?: Set<string>;
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
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [selectedResources, setSelectedResources] = useState(new Set<any>());
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    projectId: number;
    week: string;
  } | null>(null);
  const [copiedResources, setCopiedResources] = useState<{
    assignments: Array<{
      assignmentId: number;
      projectId: number;
      employeeId: number;
      utilisation: number;
      startDate: string;
      endDate: string;
    }>;
    sourceWeek: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const weeks = useMemo(calculateTimelineWeeks, []);
  const timelineStart = weeks[0];
  const timelineEnd = weeks[weeks.length - 1];

  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const [pasteTargetWeek, setPasteTargetWeek] = useState<string | null>(null);

  const handleCopy = useCallback(() => {
    if (selectedResources.size > 0) {
      // Get the week of the first selected resource
      const firstResource = selectedResources.values().next().value;
      const [_, __, weekStr] = firstResource.split("-");

      // Filter selected resources to only include those from the same week
      const sameWeekResources = Array.from(selectedResources).filter(
        (resourceId) => {
          const [, , currentWeek] = resourceId.split("-");
          return currentWeek === weekStr;
        }
      );

      // If trying to copy from multiple weeks, show warning and prevent copy
      if (sameWeekResources.length !== selectedResources.size) {
        toast({
          title: "Cannot copy from multiple weeks",
          description: "Please select resources only from the same week slot",
          variant: "destructive",
        });
        return;
      }

      const assignments = sameWeekResources
        .map((resourceId) => {
          const [projectId, assignmentId] = resourceId.split("-");
          const project = projects.find((p) => p.id === parseInt(projectId));
          const assignment = project?.assignments.find(
            (a) => a.id === parseInt(assignmentId)
          );

          if (!assignment) return null;

          return {
            assignmentId: parseInt(assignmentId),
            projectId: parseInt(projectId),
            employeeId: assignment.employeeId,
            utilisation: assignment.utilisation,
            startDate: assignment.startDate || "",
            endDate: assignment.endDate || "",
          };
        })
        .filter((a): a is NonNullable<typeof a> => a !== null);

      if (assignments.length > 0) {
        setCopiedResources({
          assignments,
          sourceWeek: weekStr,
        });

        toast({
          title: "Copied",
          description: `${assignments.length} resources copied. Select a week and press Cmd/Ctrl + V to paste.`,
        });
      }
    }
  }, [selectedResources, projects]);

  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const previousState = projectsHistory[newIndex];

      setCurrentHistoryIndex(newIndex);
      setProjects(previousState.projects);
      setTempAssignments(previousState.tempAssignments);
    }
  }, [currentHistoryIndex, projectsHistory]);

  const handleProjectsChange = useCallback(
    (newProjects: Project[], newTempAssignments: TempAssignment[]) => {
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
    },
    [currentHistoryIndex, projectsHistory]
  );

  const handlePaste = useCallback(() => {
    if (!copiedResources || !selectedCell) {
      toast({
        title: "Cannot paste",
        description: "Select a cell first before pasting",
        variant: "destructive",
      });
      return;
    }

    const newTempAssignments = [...tempAssignments];
    const newProjects = JSON.parse(JSON.stringify(projects));

    // Get the target week
    const targetWeek = new Date(selectedCell.week);
    const targetWeekEnd = addDays(targetWeek, 6); // End of the week

    for (const assignment of copiedResources.assignments) {
      // Create new assignment for the selected week
      const newAssignment: TempNewAssignment = {
        type: "new",
        projectId: selectedCell.projectId,
        employeeId: assignment.employeeId,
        startDate: targetWeek.toISOString(),
        endDate: targetWeekEnd.toISOString(),
        utilisation: assignment.utilisation,
      };

      newTempAssignments.push(newAssignment);

      // Update UI immediately
      const projectIndex = newProjects.findIndex(
        (p: { id: number }) => p.id === selectedCell.projectId
      );
      if (projectIndex !== -1) {
        const employee = allEmployees.find(
          (e) => e.id === assignment.employeeId
        );
        if (employee) {
          const tempUIAssignment = {
            id: -Date.now() - Math.random(),
            employeeId: assignment.employeeId,
            projectId: selectedCell.projectId,
            startDate: targetWeek.toISOString(),
            endDate: targetWeekEnd.toISOString(),
            utilisation: assignment.utilisation,
            employee: employee,
            project: newProjects[projectIndex],
          };

          newProjects[projectIndex].assignments.push(tempUIAssignment);
        }
      }
    }

    handleProjectsChange(newProjects, newTempAssignments);
    setCopiedResources(null);
    setSelectedCell(null);
    setSelectedResources(new Set());

    toast({
      title: "Pasted",
      description: `${copiedResources.assignments.length} resources pasted`,
    });
  }, [
    copiedResources,
    selectedCell,
    projects,
    tempAssignments,
    allEmployees,
    handleProjectsChange,
  ]);

  // GanttChart.tsx - Frontend handling of week deletion
  const handleDeleteSelected = useCallback(() => {
    if (selectedResources.size === 0 || isDeleting) return;

    try {
      // Deep copy projects to ensure proper mutation
      const newProjects = JSON.parse(JSON.stringify(projects));
      const newTempAssignments = [...tempAssignments];

      selectedResources.forEach((resourceId) => {
        const [projectId, assignmentId, weekStr] = resourceId
          .match(/^(\d+)-(\d+)-(.+)$/)!
          .slice(1);
        const weekStart = startOfWeek(new Date(weekStr));
        const weekEnd = endOfWeek(weekStart);

        newTempAssignments.push({
          type: "weekDelete",
          assignmentId: parseInt(assignmentId),
          weekStart: weekStart.toISOString(),
        });

        const projectIndex = newProjects.findIndex(
          (p: Project) => p.id === parseInt(projectId)
        );

        if (projectIndex !== -1) {
          const assignment = newProjects[projectIndex].assignments.find(
            (a: Assignment) => a.id === parseInt(assignmentId)
          );

          if (assignment) {
            const assignmentStartDate = new Date(assignment.startDate);
            const assignmentEndDate = new Date(assignment.endDate);

            // Handle middle week deletion
            if (
              assignmentStartDate < weekStart &&
              assignmentEndDate > weekEnd
            ) {
              // Split the assignment into two parts
              const firstPart = {
                ...assignment,
                endDate: new Date(weekStart.getTime() - 86400000).toISOString(),
              };
              const secondPart = {
                ...assignment,
                id: -Date.now(), // Temporary negative ID for UI
                startDate: new Date(weekEnd.getTime() + 86400000).toISOString(),
              };

              // Replace the original assignment with both parts
              newProjects[projectIndex].assignments = newProjects[
                projectIndex
              ].assignments
                .filter((a: Assignment) => a.id !== parseInt(assignmentId))
                .concat([firstPart, secondPart]);
            } else if (
              isWithinInterval(assignmentStartDate, {
                start: weekStart,
                end: weekEnd,
              })
            ) {
              assignment.startDate = new Date(
                weekEnd.getTime() + 86400000
              ).toISOString();
            } else if (
              isWithinInterval(assignmentEndDate, {
                start: weekStart,
                end: weekEnd,
              })
            ) {
              assignment.endDate = new Date(
                weekStart.getTime() - 86400000
              ).toISOString();
            }

            // Filter out invalid assignments
            newProjects[projectIndex].assignments = newProjects[
              projectIndex
            ].assignments.filter((a: Assignment) => {
              try {
                const startDate = new Date(a.startDate);
                const endDate = new Date(a.endDate);
                return (
                  !isNaN(startDate.getTime()) &&
                  !isNaN(endDate.getTime()) &&
                  startDate <= endDate
                );
              } catch {
                return false;
              }
            });
          }
        }
      });

      // Create new history entry
      const newHistoryEntry = {
        projects: JSON.parse(JSON.stringify(newProjects)),
        tempAssignments: [...newTempAssignments],
        selectedResources: new Set(selectedResources),
      };

      setProjectsHistory((prev) => [
        ...prev.slice(0, currentHistoryIndex + 1),
        newHistoryEntry,
      ]);
      setCurrentHistoryIndex((prev) => prev + 1);

      setProjects(newProjects);
      setTempAssignments(newTempAssignments);
      setHasUnsavedChanges(true);
      setSelectedResources(new Set());
    } catch (error) {
      console.error("Error handling deletions:", error);
      toast({
        title: "Error",
        description: "Failed to process deletions",
        variant: "destructive",
      });
    }
  }, [
    selectedResources,
    isDeleting,
    projects,
    tempAssignments,
    currentHistoryIndex,
  ]);

  const handleResourceSelect = (resourceId: string, selected: boolean) => {
    setSelectedResources((prev) => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(resourceId);
      } else {
        newSelection.delete(resourceId);
      }
      return newSelection;
    });
    console.log(selectedResources);
  };

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      // Create a deep copy of initial data
      const initialProjects = JSON.parse(JSON.stringify(data.projects));
      setProjects(initialProjects);
      // Initialize history with a deep copy
      setProjectsHistory([
        {
          projects: JSON.parse(JSON.stringify(initialProjects)),
          tempAssignments: [],
        },
      ]);
      setCurrentHistoryIndex(0);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      for (const temp of tempAssignments) {
        try {
          if (temp.type === "weekDelete") {
            const response = await fetch(
              `/api/assignments/${temp.assignmentId}/week`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  weekStart: toUTCStartOfDay(
                    new Date(temp.weekStart).toISOString()
                  ),
                }),
              }
            );

            const result = await response.json();

            if (!response.ok) {
              console.error("Delete failed:", {
                status: response.status,
                error: result.error,
                assignmentId: temp.assignmentId,
                weekStart: temp.weekStart,
              });
              throw new Error(
                result.error ||
                  `Failed to delete week for assignment ${temp.assignmentId}`
              );
            }

            const projectIndex = projects.findIndex((p) =>
              p.assignments.some((a) => a.id === temp.assignmentId)
            );

            if (projectIndex !== -1) {
              const updatedProjects = [...projects];
              const projectAssignments =
                updatedProjects[projectIndex].assignments;

              // Remove the original assignment
              updatedProjects[projectIndex].assignments =
                projectAssignments.filter((a) => a.id !== temp.assignmentId);

              // Add the updated assignment if it exists and is valid
              if (result.updatedAssignment) {
                const startDate = new Date(result.updatedAssignment.startDate);
                const endDate = new Date(result.updatedAssignment.endDate);

                if (
                  !isNaN(startDate.getTime()) &&
                  !isNaN(endDate.getTime()) &&
                  startDate <= endDate
                ) {
                  updatedProjects[projectIndex].assignments.push(
                    result.updatedAssignment
                  );
                }
              }

              // Add the new assignment if it exists and is valid (for split cases)
              if (result.newAssignment) {
                const startDate = new Date(result.newAssignment.startDate);
                const endDate = new Date(result.newAssignment.endDate);

                if (
                  !isNaN(startDate.getTime()) &&
                  !isNaN(endDate.getTime()) &&
                  startDate <= endDate
                ) {
                  updatedProjects[projectIndex].assignments.push(
                    result.newAssignment
                  );
                }
              }

              setProjects(updatedProjects);
            }
          } else if (temp.type === "edited") {
            const response = await fetch(
              `/api/assignments/${temp.assignmentId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  employeeId: temp.updates.employeeId,
                  projectId: temp.updates.projectId,
                  startDate: toUTCStartOfDay(
                    new Date(temp.updates.startDate).toISOString()
                  ),
                  endDate: toUTCEndOfDay(
                    new Date(temp.updates.endDate).toISOString()
                  ),
                  utilisation: temp.updates.utilisation,
                }),
              }
            );

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to update assignment");
            }
          } else if (temp.type === "moved") {
            if (temp.isSameProject) {
              const response = await fetch(
                `/api/assignments/${temp.assignment.id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    employeeId: temp.assignment.employeeId,
                    projectId: temp.toProjectId,
                    startDate: toUTCStartOfDay(
                      new Date(temp.assignment.startDate).toISOString()
                    ),
                    endDate: toUTCEndOfDay(
                      new Date(temp.assignment.endDate).toISOString()
                    ),
                    utilisation: temp.newUtilization,
                  }),
                }
              );

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to move assignment");
              }
            } else {
              if (temp.previousUtilization > 0) {
                const response = await fetch(
                  `/api/assignments/${temp.assignment.id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      employeeId: temp.assignment.employeeId,
                      projectId: temp.fromProjectId,
                      startDate: toUTCStartOfDay(
                        new Date(temp.assignment.startDate).toISOString()
                      ),
                      endDate: toUTCEndOfDay(
                        new Date(temp.assignment.endDate).toISOString()
                      ),
                      utilisation: temp.previousUtilization,
                    }),
                  }
                );

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(
                    error.error || "Failed to update previous assignment"
                  );
                }
              } else {
                const response = await fetch(
                  `/api/assignments/${temp.assignment.id}`,
                  {
                    method: "DELETE",
                  }
                );

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(
                    error.error || "Failed to delete previous assignment"
                  );
                }
              }

              if (temp.newUtilization > 0) {
                const response = await fetch("/api/assignments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    employeeId: temp.assignment.employeeId,
                    projectId: temp.toProjectId,
                    startDate: toUTCStartOfDay(
                      new Date(temp.assignment.startDate).toISOString()
                    ),
                    endDate: toUTCEndOfDay(
                      new Date(temp.assignment.endDate).toISOString()
                    ),
                    utilisation: temp.newUtilization,
                  }),
                });

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(
                    error.error || "Failed to create new assignment"
                  );
                }
              }
            }
          } else if (temp.type === "new") {
            const response = await fetch("/api/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: temp.employeeId,
                projectId: temp.projectId,
                startDate: toUTCStartOfDay(
                  new Date(temp.startDate).toISOString()
                ),
                endDate: toUTCEndOfDay(new Date(temp.endDate).toISOString()),
                utilisation: temp.utilisation,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to create assignment");
            }
          }
        } catch (error) {
          // Show error toast for the specific operation
          toast({
            title: "Error",
            description:
              error instanceof Error ? error.message : "Operation failed",
            variant: "destructive",
          });
          // Continue with other operations
          continue;
        }
      }

      // Refresh projects data after all operations
      await fetchProjects();
      setTempAssignments([]);
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [tempAssignments, projects, isSaving, fetchProjects]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setIsShiftPressed(true);
      }
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;

      if (isCmdOrCtrl && event.key === "s") {
        event.preventDefault();
        handleSave();
        toast({
          title: "Changes Saved",
          description: "Your changes have been saved successfully.",
        });
      } else if (isCmdOrCtrl && event.key === "z") {
        event.preventDefault();
        handleUndo();
        toast({
          title: "Undo",
          description: "The last action has been undone.",
        });
      } else if (
        isCmdOrCtrl &&
        event.key === "c" &&
        selectedResources.size > 0
      ) {
        event.preventDefault();
        handleCopy();
      } else if (
        isCmdOrCtrl &&
        event.key === "v" &&
        copiedResources &&
        selectedWeek
      ) {
        event.preventDefault();
        setPasteTargetWeek(selectedWeek.toISOString());
        handlePaste();
      } else if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedResources.size > 0
      ) {
        event.preventDefault();
        await handleDeleteSelected();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    handleSave,
    handleUndo,
    selectedResources,
    handleDeleteSelected,
    handleCopy,
    handlePaste,
    copiedResources,
    selectedWeek,
  ]);

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setAllEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleUpdateAssignment = (
    assignmentId: number,
    updates: {
      employeeId: number;
      projectId: number;
      startDate: string;
      endDate: string;
      utilisation: number;
    }
  ) => {
    const newTempAssignment: TempEditedAssignment = {
      type: "edited",
      assignmentId,
      updates,
    };

    const newTempAssignments = [...tempAssignments, newTempAssignment];

    const newProjects = projects.map((project) => ({
      ...project,
      assignments: project.assignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              ...updates,
            }
          : assignment
      ),
    }));

    handleProjectsChange(newProjects, newTempAssignments);
  };

  const handleReset = () => {
    if (projectsHistory[0]) {
      // Create deep copies to ensure state isolation
      const initialState = JSON.parse(JSON.stringify(projectsHistory[0]));
      setProjects(initialState.projects);
      setTempAssignments([]);
      // Reset history to only contain the initial state
      setProjectsHistory([initialState]);
      setCurrentHistoryIndex(0);
      setHasUnsavedChanges(false);
      setSelectedResources(new Set());
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

  useEffect(() => {
    fetchProjects();
    fetchAllEmployees();
  }, [fetchProjects]);
  // Update the grid structure in GanttChart.tsx
  return (
    <div className="mx-auto p-4 pb-20">
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
                          selectedCell={selectedCell}
                          onCellSelect={(projectId, week) => {
                            setSelectedCell({ projectId, week });
                          }}
                          copiedResources={copiedResources !== null}
                          isShiftPressed={isShiftPressed}
                          onResourceSelect={handleResourceSelect}
                          selectedResources={selectedResources}
                          allProjects={projects}
                          onSelectWeek={handleWeekSelect}
                          onUpdateAssignment={handleUpdateAssignment}
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
        <div className="fixed left-0 right-0 bottom-0 p-4 z-20 flex justify-end gap-4 bg-white border-t">
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
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              hasUnsavedChanges
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setShowAddProjectModal(true)}
            className="bg-blue-500 px-4 py-2 rounded flex items-center gap-2 text-white hover:bg-blue-600"
          >
            <Plus size={16} />
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

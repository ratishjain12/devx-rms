import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Project } from "@/types/models";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RequirementStatus {
  status: "fulfilled" | "partial" | "unfulfilled";
  coverage: number;
}

export const calculateProjectRequirementStatus = (
  project: Project
): RequirementStatus => {
  if (
    !project.projectRequirements ||
    project.projectRequirements.length === 0
  ) {
    return { status: "fulfilled", coverage: 100 };
  }

  const requirements = project.projectRequirements;
  const assignments = project.assignments || [];

  let totalMet = 0;
  let totalRequired = 0;

  requirements.forEach((req) => {
    const requiredCount = req.quantity;
    totalRequired += requiredCount;

    // Count matching assignments
    const matchingAssignments = assignments.filter(
      (assignment) =>
        assignment.employee.seniority === req.seniority &&
        assignment.employee.roles.some((role) => role === req.role.name) &&
        assignment.utilisation >= 50 // Consider at least 50% utilization as fulfilling
    );

    totalMet += Math.min(matchingAssignments.length, requiredCount);
  });

  const coverage = (totalMet / totalRequired) * 100;

  return {
    status:
      coverage === 100
        ? "fulfilled"
        : coverage >= 50
        ? "partial"
        : "unfulfilled",
    coverage,
  };
};

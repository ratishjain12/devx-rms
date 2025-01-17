import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Project } from "@/types/models";
import { Satisfaction } from "@prisma/client";

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

export const satisfactionFormatter = (text: string): string => {
  const formatMap: Record<Satisfaction, string> = {
    [Satisfaction.ABOUT_TO_FIRE]: "About to Fire",
    [Satisfaction.NOT_HAPPY]: "Not Happy",
    [Satisfaction.IDK]: "I Don't Know",
    [Satisfaction.OK]: "Okay",
    [Satisfaction.HAPPY]: "Happy",
    [Satisfaction.OVER_THE_MOON]: "Over the Moon",
  };

  const enumKey = Object.keys(Satisfaction).find(
    (key) => key === text.toUpperCase().replace(/ /g, "_")
  );

  return enumKey !== undefined
    ? formatMap[Satisfaction[enumKey as keyof typeof Satisfaction]]
    : "Unknown Satisfaction Level";
};

export const toISODateString = (date: Date): string => {
  // Ensure date is converted to UTC ISO string
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  ).toISOString();
};

export const toISOEndDateString = (date: Date): string => {
  // Ensure end date is set to end of day in UTC
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999
    )
  ).toISOString();
};

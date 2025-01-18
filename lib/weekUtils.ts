import { startOfWeek, endOfWeek, eachWeekOfInterval, addDays } from "date-fns";

export interface WeeklyAssignment {
  id: number;
  employeeId: number;
  projectId: number;
  startDate: string;
  endDate: string;
  utilisation: number;
}

export class WeeklyAssignmentManager {
  static splitIntoWeeks(assignment: {
    employeeId: number;
    projectId: number;
    startDate: string;
    endDate: string;
    utilisation: number;
  }): WeeklyAssignment[] {
    const start = new Date(assignment.startDate);
    const end = new Date(assignment.endDate);

    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });

    return weeks.map((weekStart, index) => {
      const weekEnd = addDays(weekStart, 6);
      const assignmentStart = start > weekStart ? start : weekStart;
      const assignmentEnd = end < weekEnd ? end : weekEnd;

      return {
        id: -(Date.now() + index), // Temporary negative ID for new assignments
        employeeId: assignment.employeeId,
        projectId: assignment.projectId,
        startDate: assignmentStart.toISOString(),
        endDate: assignmentEnd.toISOString(),
        utilisation: assignment.utilisation,
      };
    });
  }

  static isWithinWeek(date: Date, weekStart: Date): boolean {
    const start = startOfWeek(weekStart, { weekStartsOn: 0 });
    const end = endOfWeek(start, { weekStartsOn: 0 });
    return date >= start && date <= end;
  }
}

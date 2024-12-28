export type Assignment = {
  project: {
    name: string;
  };
};

export interface Employee {
  id: number;
  name: string;
  seniority: "JUNIOR" | "INTERN" | "SENIOR";
  skills: string[];
  roles: string[];
  assignments: Assignment[];
}

export interface OverworkedEmployee {
  employee: Employee;
  utilization: number;
}

// Types for analytics data
export interface AnalyticsData {
  totalEmployees: number | null;
  totalProjects: number | null;
  activeAssignments: number | null;
  totalOverlaps: number | null;
  topOverlappingEmployees: { name: string; overlaps: number }[] | null;
  overworkedEmployees: OverworkedEmployee[] | null;
}

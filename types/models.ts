export interface Employee {
  id: number;
  name: string;
  seniority: string;
  skills: string[];
  currentUtilization?: number;
  availableUtilization?: number;
  assignments: Assignment[];
}

export interface Project {
  id: number;
  name: string;
  status: string;
  tools: string[];
  startDate: string;
  endDate: string | null;
  assignments: Assignment[];
}

export interface Assignment {
  id: number;
  employeeId: number;
  projectId: number;
  startDate: string;
  endDate: string;
  utilisation: number;
  employee: Employee;
  project: Project;
}

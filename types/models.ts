import { Seniority, ProjectStatus } from "@prisma/client";

export interface Employee {
  id: number;
  name: string;
  seniority: Seniority;
  skills: string[];
  roles: string[];
  currentUtilization?: number;
  availableUtilization?: number;
  assignments: Assignment[];
}

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  tools: string[];
  startDate: string;
  endDate: string | null;
  type: string;
  client_satisfaction: string;
  assignments: Assignment[];
  projectRequirements: ProjectRequirement[];
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

export interface ProjectRequirement {
  id: number;
  projectId: number;
  roleId: number;
  seniority: Seniority;
  startDate: string;
  endDate: string;
  quantity: number;
  project: Project;
  role: Role;
}

export interface Role {
  id: number;
  name: string;
  projectRequirements: ProjectRequirement[];
}

export interface Skill {
  id: number;
  name: string;
}

export interface Type {
  id: number;
  name: string;
}

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
  assignments: Assignment[];
}

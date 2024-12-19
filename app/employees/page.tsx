"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import {
  Table,
  TableHeader,
  TableHead,
  DataTableBody,
  DataTableRow,
  TableCell,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "@/hooks/use-debounce";

type Assignment = {
  project: {
    name: string;
  };
};

interface Employee {
  id: number;
  name: string;
  seniority: "JUNIOR" | "INTERN" | "SENIOR";
  skills: string[];
  assignments: Assignment[];
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [seniority, setSeniority] = useState<string>("ALL");
  const [editingEmployee, setEditingEmployee] = useState<
    Partial<Employee> | any
  >(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchEmployees();
  }, [debouncedSearchQuery, seniority]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (debouncedSearchQuery.trim())
        queryParams.append("q", debouncedSearchQuery.trim());
      if (seniority && seniority !== "ALL")
        queryParams.append("seniority", seniority);

      const response = await fetch(
        `/api/employees/search?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSeniorityChange = (value: string) => {
    setSeniority(value);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingEmployee) return;
      const { assignments, ...employeeData } = editingEmployee;
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });
      if (!response.ok) {
        throw new Error("Failed to create employee");
      }
      await fetchEmployees();
      setEditingEmployee(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Employee created successfully.",
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      toast({
        title: "Error",
        description: "Failed to create employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEmployee?.id) return;

    try {
      const skills =
        typeof editingEmployee.skills === "string"
          ? editingEmployee.skills.split(",").map((s: any) => s.trim())
          : editingEmployee.skills || [];

      const employeeData = {
        name: editingEmployee.name,
        seniority: editingEmployee.seniority,
        skills,
      };

      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee");
      }

      await fetchEmployees();
      setEditingEmployee(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Employee updated successfully.",
      });
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (employee: Employee | null = null) => {
    if (employee) {
      setEditingEmployee({
        ...employee,
        skills: employee.skills || [],
      });
    } else {
      setEditingEmployee({
        name: "",
        seniority: "JUNIOR" as const,
        skills: [],
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete employee");
      }
      await fetchEmployees();
      toast({
        title: "Success",
        description: "Employee deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Employees</h1>
      <div className="mb-4 flex space-x-4">
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={handleSearchInputChange}
        />
        <Select value={seniority} onValueChange={handleSeniorityChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="INTERN">Intern</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => openEditDialog()}>Add Employee</Button>
      </div>
      <Table>
        <TableHeader>
          <DataTableRow>
            <TableHead>Name</TableHead>
            <TableHead>Seniority</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead>Current Project</TableHead>
            <TableHead>Actions</TableHead>
          </DataTableRow>
        </TableHeader>
        <DataTableBody>
          {employees.map((employee) => (
            <DataTableRow key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.seniority}</TableCell>
              <TableCell>{employee.skills.join(", ")}</TableCell>
              <TableCell>
                {employee.assignments.length > 0
                  ? employee.assignments[employee.assignments.length - 1]
                      .project.name
                  : "Not Assigned"}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button onClick={() => openEditDialog(employee)}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the employee and remove all associated data
                          from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </Table>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee?.id ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={
              editingEmployee?.id ? handleUpdateEmployee : handleCreateEmployee
            }
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editingEmployee?.name || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="seniority">Seniority</Label>
              <Select
                value={editingEmployee?.seniority || ""}
                onValueChange={(value: "JUNIOR" | "INTERN" | "SENIOR") =>
                  setEditingEmployee({ ...editingEmployee, seniority: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seniority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUNIOR">Junior</SelectItem>
                  <SelectItem value="INTERN">Intern</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={
                  Array.isArray(editingEmployee?.skills)
                    ? editingEmployee?.skills.join(", ")
                    : typeof editingEmployee?.skills === "string"
                    ? editingEmployee?.skills
                    : ""
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    skills: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                required
              />
            </div>
            <Button type="submit">
              {editingEmployee?.id ? "Update Employee" : "Create Employee"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

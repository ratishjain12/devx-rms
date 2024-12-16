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
import { Employee, Assignment } from "@/types/models";

interface EditingEmployee extends Omit<Employee, "id" | "assignments"> {
  id?: number;
  assignments?: Assignment[];
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [seniority, setSeniority] = useState("");
  const [editingEmployee, setEditingEmployee] =
    useState<EditingEmployee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/employees/search?q=${searchQuery}&seniority=${seniority}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data: Employee[] = await response.json();
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

  const handleSearch = () => {
    fetchEmployees();
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

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingEmployee || !editingEmployee.id) return;
      const { assignments, ...employeeData } = editingEmployee;
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
    setEditingEmployee(
      employee
        ? {
            ...employee,
            skills: [...employee.skills], // Create a new array to avoid mutating the original
          }
        : { name: "", seniority: "", skills: [], assignments: [] }
    );
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Employees</h1>
      <div className="mb-4 flex space-x-4">
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select value={seniority} onValueChange={setSeniority}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
            <SelectItem value="MID">Mid</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
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
                {employee.assignments && employee.assignments.length > 0
                  ? employee.assignments[employee.assignments.length - 1]
                      .project.name
                  : "Not Assigned"}
              </TableCell>
              <TableCell>
                <Button onClick={() => openEditDialog(employee)}>Edit</Button>
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
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    name: e.target.value,
                  } as EditingEmployee)
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="seniority">Seniority</Label>
              <Select
                value={editingEmployee?.seniority || ""}
                onValueChange={(value) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    seniority: value,
                  } as EditingEmployee)
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seniority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUNIOR">Junior</SelectItem>
                  <SelectItem value="MID">Mid</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={editingEmployee?.skills.join(", ") || ""}
                onChange={(e) =>
                  setEditingEmployee({
                    ...editingEmployee,
                    skills: e.target.value.split(",").map((s) => s.trim()),
                  } as EditingEmployee)
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

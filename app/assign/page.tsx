"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableHead,
  DataTableBody,
  DataTableRow,
  TableCell,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Assignment, Employee, Project } from "@/types/models";
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

export default function Assign() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [editingAssignment, setEditingAssignment] =
    useState<Partial<Assignment> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [availabilityThreshold, setAvailabilityThreshold] = useState(80);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAssignments();
    fetchEmployees();
    fetchProjects();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments");
      if (!response.ok) throw new Error("Failed to fetch assignments");
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAssignment && selectedEmployee) {
      try {
        const response = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editingAssignment,
            employeeId: parseInt(selectedEmployee, 10),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create assignment");
        }

        await fetchAssignments();
        setEditingAssignment(null);
        setIsEditDialogOpen(false);
        setSelectedEmployee("");
        toast({
          title: "Success",
          description: "Assignment created successfully.",
        });
      } catch (error) {
        console.error("Error creating assignment:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to create assignment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAssignment && editingAssignment.id) {
      try {
        const response = await fetch(
          `/api/assignments/${editingAssignment.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...editingAssignment,
              employeeId: parseInt(selectedEmployee, 10),
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update assignment");
        }

        await fetchAssignments();
        setEditingAssignment(null);
        setSelectedEmployee("");
        setIsEditDialogOpen(false);
        toast({
          title: "Success",
          description: "Assignment updated successfully.",
        });
      } catch (error) {
        console.error("Error updating assignment:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update assignment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete assignment");
      }
      await fetchAssignments();
      toast({
        title: "Success",
        description: "Assignment deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (assignment?: Assignment) => {
    setEditingAssignment(
      assignment
        ? {
            ...assignment,
            startDate: assignment.startDate.split("T")[0], // Format as YYYY-MM-DD
            endDate: assignment.endDate.split("T")[0],
          }
        : {
            startDate: "",
            endDate: "",
            utilisation: 100,
          }
    );
    setSelectedEmployee(assignment ? assignment.employee.id.toString() : "");
    setIsEditDialogOpen(true);
  };

  const fetchAvailableEmployees = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/employees/available?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&availabilityThreshold=${availabilityThreshold}`
      );
      if (!response.ok) throw new Error("Failed to fetch available employees");
      const data = await response.json();
      setAvailableEmployees(data);
    } catch (error) {
      console.error("Error fetching available employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available employees. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const searchTerm = searchQuery.toLowerCase();
    return assignment.employee.name.toLowerCase().includes(searchTerm);
  });

  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold mb-6">Assign Employees</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => openEditDialog()}>Create Assignment</Button>
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search by employee or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <DataTableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Utilisation</TableHead>
            <TableHead>Actions</TableHead>
          </DataTableRow>
        </TableHeader>
        <DataTableBody>
          {filteredAssignments.length === 0 ? (
            <DataTableRow>
              <TableCell colSpan={6} className="text-center py-4">
                {searchQuery
                  ? "No assignments found matching your search."
                  : "No assignments available."}
              </TableCell>
            </DataTableRow>
          ) : (
            filteredAssignments.map((assignment) => (
              <DataTableRow key={assignment.id}>
                <TableCell>{assignment.employee.name}</TableCell>
                <TableCell>{assignment.project.name}</TableCell>
                <TableCell>
                  {new Date(assignment.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(assignment.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{assignment.utilisation}%</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button onClick={() => openEditDialog(assignment)}>
                      Edit
                    </Button>
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
                            delete the assignment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteAssignment(assignment.id)
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </Table>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Available Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-4">
            <div className="flex space-x-4">
              <div>
                <Label htmlFor="availableStartDate">Start Date</Label>
                <Input
                  id="availableStartDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="availableEndDate">End Date</Label>
                <Input
                  id="availableEndDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="availabilityThreshold">
                Minimum Available Utilization: {availabilityThreshold}%
              </Label>
              <Slider
                id="availabilityThreshold"
                min={0}
                max={100}
                step={5}
                value={[availabilityThreshold]}
                onValueChange={(value) => setAvailabilityThreshold(value[0])}
              />
            </div>
            <Button onClick={fetchAvailableEmployees}>
              Find Available Employees
            </Button>
          </div>

          <Table>
            <TableHeader>
              <DataTableRow>
                <TableHead>Name</TableHead>
                <TableHead>Seniority</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Current Utilization</TableHead>
                <TableHead>Available Utilization</TableHead>
              </DataTableRow>
            </TableHeader>
            <DataTableBody>
              {availableEmployees.map((employee) => (
                <DataTableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.seniority}</TableCell>
                  <TableCell>{employee.skills.join(", ")}</TableCell>
                  <TableCell>
                    {employee.currentUtilization?.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    {employee.availableUtilization?.toFixed(1)}%
                  </TableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAssignment?.id
                ? "Edit Assignment"
                : "Create New Assignment"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={
              editingAssignment?.id
                ? handleUpdateAssignment
                : handleCreateAssignment
            }
            className="space-y-4"
          >
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee.id}
                      value={employee.id.toString()}
                    >
                      {employee.name} ({employee.seniority}) (
                      {employee.roles.join(", ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEmployee && (
              <div>
                {employees
                  .filter(
                    (employee) => employee.id.toString() === selectedEmployee
                  )
                  .map((employee) => (
                    <div key={employee.id}>
                      <Label className="flex gap-2">
                        Currently Assigned:{" "}
                        {employee.assignments.map((assignment) => (
                          <span key={assignment.id}>
                            {assignment.project.name}
                          </span>
                        ))}
                      </Label>

                      <Label>Roles: {employee.roles.join(", ")}</Label>
                    </div>
                  ))}
              </div>
            )}
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                value={editingAssignment?.projectId?.toString() || ""}
                onValueChange={(value) =>
                  setEditingAssignment((prev) => ({
                    ...prev,
                    projectId: parseInt(value, 10),
                  }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects &&
                    projects.length > 0 &&
                    projects?.map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={editingAssignment?.startDate || ""}
                onChange={(e) =>
                  setEditingAssignment((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={editingAssignment?.endDate || ""}
                onChange={(e) =>
                  setEditingAssignment((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="utilisation">Utilisation (%)</Label>
              <Input
                id="utilisation"
                type="number"
                min="0"
                max="100"
                value={editingAssignment?.utilisation || ""}
                onChange={(e) =>
                  setEditingAssignment((prev) => ({
                    ...prev,
                    utilisation: parseInt(e.target.value, 10),
                  }))
                }
                required
              />
            </div>
            <Button type="submit">
              {editingAssignment?.id
                ? "Update Assignment"
                : "Create Assignment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

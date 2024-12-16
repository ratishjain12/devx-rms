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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  const [utilizationThreshold, setUtilizationThreshold] = useState(80);

  useEffect(() => {
    fetchAssignments();
    fetchEmployees();
    fetchProjects();
  }, []);

  const fetchAssignments = async () => {
    const response = await fetch("/api/assignments");
    const data: Assignment[] = await response.json();
    setAssignments(data);
  };

  const fetchEmployees = async () => {
    const response = await fetch("/api/employees");
    const data: Employee[] = await response.json();
    setEmployees(data);
  };

  const fetchProjects = async () => {
    const response = await fetch("/api/projects");
    const data: Project[] = await response.json();
    setProjects(data);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAssignment) {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAssignment),
      });
      if (response.ok) {
        fetchAssignments();
        setEditingAssignment(null);
        setIsEditDialogOpen(false);
      }
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAssignment && editingAssignment.id) {
      const response = await fetch(`/api/assignments/${editingAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAssignment),
      });
      if (response.ok) {
        fetchAssignments();
        setEditingAssignment(null);
        setIsEditDialogOpen(false);
      }
    }
  };

  const openEditDialog = (assignment: Assignment | null = null) => {
    setEditingAssignment(
      assignment
        ? { ...assignment }
        : {
            employeeId: 0,
            projectId: 0,
            startDate: "",
            endDate: "",
            utilisation: 100,
          }
    );
    setIsEditDialogOpen(true);
  };

  const fetchAvailableEmployees = async () => {
    const response = await fetch(
      `/api/employees/available?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&utilizationThreshold=${utilizationThreshold}`
    );
    const data: Employee[] = await response.json();
    setAvailableEmployees(data);
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Assign Employees</h1>
      <div className="mb-4">
        <Button onClick={() => openEditDialog()}>Create Assignment</Button>
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
          {assignments.map((assignment) => (
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
                <Button onClick={() => openEditDialog(assignment)}>Edit</Button>
              </TableCell>
            </DataTableRow>
          ))}
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
              <Label htmlFor="utilizationThreshold">
                Minimum Available Utilization: {100 - utilizationThreshold}%
              </Label>
              <Slider
                id="utilizationThreshold"
                min={0}
                max={100}
                step={5}
                value={[utilizationThreshold]}
                onValueChange={(value) => setUtilizationThreshold(value[0])}
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
                value={editingAssignment?.employeeId?.toString() || ""}
                onValueChange={(value) =>
                  setEditingAssignment((prev) => ({
                    ...prev,
                    employeeId: parseInt(value, 10),
                  }))
                }
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
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
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
    </Layout>
  );
}

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
import { Project, Assignment } from "@/types/models";
import { ProjectStatus } from "@prisma/client";

interface EditingProject extends Omit<Project, "id" | "assignments"> {
  id?: number;
  assignments?: Assignment[];
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [editingProject, setEditingProject] = useState<EditingProject | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects?q=${searchQuery}&status=${status}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data: Project[] = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProjects();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingProject) return;
      const { assignments, ...projectData } = editingProject;
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      const responseText = await response.text();
      console.log("Raw server response:", responseText); // Log the raw response

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(
          "Error parsing JSON:",
          jsonError,
          "Response text:",
          responseText
        );
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create project");
      }

      await fetchProjects();
      setEditingProject(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully.",
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingProject || !editingProject.id) return;
      const { assignments, ...projectData } = editingProject;
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      if (!response.ok) {
        throw new Error("Failed to update project");
      }
      await fetchProjects();
      setEditingProject(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Project updated successfully.",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (project: Project | null = null) => {
    setEditingProject(
      project
        ? {
            ...project,
            tools: [...project.tools],
            startDate: project.startDate.split("T")[0], // Format date for input
            endDate: project.endDate ? project.endDate.split("T")[0] : null,
          }
        : {
            name: "",
            status: "UPCOMING" as ProjectStatus,
            tools: [],
            startDate: "",
            endDate: null,
          }
    );
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <div className="mb-4 flex space-x-4">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ProjectStatus | "ALL")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="CURRENT">Current</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
        <Button onClick={() => openEditDialog()}>Add Project</Button>
      </div>
      <Table>
        <TableHeader>
          <DataTableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tools</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Assigned Employees</TableHead>
            <TableHead>Actions</TableHead>
          </DataTableRow>
        </TableHeader>
        <DataTableBody>
          {projects.map((project) => (
            <DataTableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.status}</TableCell>
              <TableCell>{project.tools.join(", ")}</TableCell>
              <TableCell>
                {new Date(project.startDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "N/A"}
              </TableCell>
              <TableCell>
                {project.assignments &&
                  project.assignments
                    .map((assignment) => assignment.employee.name)
                    .join(", ")}
              </TableCell>
              <TableCell>
                <Button onClick={() => openEditDialog(project)}>Edit</Button>
              </TableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </Table>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject?.id ? "Edit Project" : "Add New Project"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={
              editingProject?.id ? handleUpdateProject : handleCreateProject
            }
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editingProject?.name || ""}
                onChange={(e) =>
                  setEditingProject((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editingProject?.status || ""}
                onValueChange={(value) =>
                  setEditingProject((prev) =>
                    prev ? { ...prev, status: value as ProjectStatus } : null
                  )
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tools">Tools (comma-separated)</Label>
              <Input
                id="tools"
                value={editingProject?.tools?.join(", ") || ""}
                onChange={(e) =>
                  setEditingProject((prev) =>
                    prev
                      ? {
                          ...prev,
                          tools: e.target.value.split(",").map((s) => s.trim()),
                        }
                      : null
                  )
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={editingProject?.startDate || ""}
                onChange={(e) =>
                  setEditingProject((prev) =>
                    prev ? { ...prev, startDate: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={editingProject?.endDate || ""}
                onChange={(e) =>
                  setEditingProject((prev) =>
                    prev ? { ...prev, endDate: e.target.value } : null
                  )
                }
              />
            </div>
            <Button type="submit">
              {editingProject?.id ? "Update Project" : "Create Project"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

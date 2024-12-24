"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
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
import { Project, Assignment, ProjectRequirement, Role } from "@/types/models";
import { ProjectStatus, Seniority } from "@prisma/client";

interface EditingProject
  extends Omit<
    Project,
    "id" | "assignments" | "projectRequirements" | "status"
  > {
  id?: number;
  assignments?: Assignment[];
  projectRequirements: (
    | ProjectRequirement
    | Partial<Omit<ProjectRequirement, "id" | "project" | "role">>
  )[];
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
  const [roles, setRoles] = useState<Role[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchProjects();
    fetchRoles();
  }, [debouncedSearchQuery, status]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (debouncedSearchQuery.trim())
        queryParams.append("q", debouncedSearchQuery.trim());
      if (status !== "ALL") queryParams.append("status", status);

      const response = await fetch(
        `/api/projects/search?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error("Unexpected data format:", data);
        throw new Error("Invalid data format received from API");
      }

      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch projects. Please try again.",
        variant: "destructive",
      });
      setProjects([]); // Set to empty array in case of error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");

      const data: Role[] = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getProjectStatus = (
    startDate: string,
    endDate: string | null
  ): ProjectStatus => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (now < start) {
      return ProjectStatus.UPCOMING;
    } else if (!end || now <= end) {
      return ProjectStatus.CURRENT;
    } else {
      return ProjectStatus.COMPLETED;
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingProject) return;
      const { startDate, endDate, ...projectData } = editingProject;
      const status = getProjectStatus(startDate, endDate);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...projectData, startDate, endDate, status }),
      });

      if (!response.ok) throw new Error("Failed to create project");

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
        description: "Failed to create project.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingProject || !editingProject.id) return;
      const { startDate, endDate, ...projectData } = editingProject;
      const status = getProjectStatus(startDate, endDate);

      const response = await fetch(`/api/projects?id=${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...projectData, startDate, endDate, status }),
      });

      if (!response.ok) throw new Error("Failed to update project");

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
        description: "Failed to update project.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete project");

      await fetchProjects();
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project.",
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
            startDate: project.startDate.split("T")[0],
            endDate: project.endDate ? project.endDate.split("T")[0] : null,
            projectRequirements: (project.projectRequirements || []).map(
              (req) => ({
                ...req,
                startDate: req.startDate.split("T")[0],
                endDate: req.endDate ? req.endDate.split("T")[0] : "",
              })
            ),
          }
        : {
            name: "",
            tools: [],
            startDate: "",
            endDate: null,
            projectRequirements: [],
          }
    );
    setIsEditDialogOpen(true);
  };

  const handleAddRequirement = () => {
    setEditingProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        projectRequirements: [
          ...prev.projectRequirements,
          {
            roleId: 0,
            seniority: Seniority.JUNIOR,
            startDate: "",
            endDate: "",
            quantity: 1,
          },
        ],
      };
    });
  };

  const handleUpdateRequirement = (
    index: number,
    field: keyof ProjectRequirement,
    value: unknown
  ) => {
    setEditingProject((prev) => {
      if (!prev || !prev.projectRequirements) return prev;
      const updatedRequirements = [...prev.projectRequirements];
      updatedRequirements[index] = {
        ...updatedRequirements[index],
        [field]: value,
      };
      return { ...prev, projectRequirements: updatedRequirements };
    });
  };

  const handleRemoveRequirement = (index: number) => {
    setEditingProject((prev) => {
      if (!prev || !prev.projectRequirements) return prev;
      const updatedRequirements = prev.projectRequirements.filter(
        (_, i) => i !== index
      );
      return { ...prev, projectRequirements: updatedRequirements };
    });
  };

  return (
    <div className="px-4">
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
            <SelectItem value={ProjectStatus.CURRENT}>Current</SelectItem>
            <SelectItem value={ProjectStatus.UPCOMING}>Upcoming</SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => openEditDialog()}>Add Project</Button>
      </div>
      {isLoading ? (
        <p>Loading projects...</p>
      ) : (
        <Table>
          <TableHeader>
            <DataTableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tools</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Assigned Employees</TableHead>
              <TableHead>Requirements</TableHead>
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
                  {project.projectRequirements &&
                    project.projectRequirements.map((req, index) => (
                      <div key={index}>
                        {req.role.name} - {req.seniority} ({req.quantity})
                      </div>
                    ))}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button onClick={() => openEditDialog(project)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </Table>
      )}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
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
            <div>
              <Label>Project Requirements</Label>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {editingProject?.projectRequirements?.map((req, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 items-end"
                  >
                    <Select
                      value={req.roleId?.toString() || ""}
                      onValueChange={(value) =>
                        handleUpdateRequirement(
                          index,
                          "roleId",
                          parseInt(value)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={req.seniority}
                      onValueChange={(value) =>
                        handleUpdateRequirement(
                          index,
                          "seniority",
                          value as Seniority
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seniority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Seniority.JUNIOR}>Junior</SelectItem>
                        <SelectItem value={Seniority.SENIOR}>Senior</SelectItem>
                        <SelectItem value={Seniority.INTERN}>Intern</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={req.startDate}
                      onChange={(e) =>
                        handleUpdateRequirement(
                          index,
                          "startDate",
                          e.target.value
                        )
                      }
                    />
                    <Input
                      type="date"
                      value={req.endDate}
                      onChange={(e) =>
                        handleUpdateRequirement(
                          index,
                          "endDate",
                          e.target.value
                        )
                      }
                    />
                    <Input
                      type="number"
                      value={req.quantity}
                      onChange={(e) =>
                        handleUpdateRequirement(
                          index,
                          "quantity",
                          parseInt(e.target.value)
                        )
                      }
                      min="1"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveRequirement(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                onClick={handleAddRequirement}
                className="mt-2"
              >
                Add Requirement
              </Button>
            </div>
            <Button type="submit">
              {editingProject?.id ? "Update Project" : "Create Project"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

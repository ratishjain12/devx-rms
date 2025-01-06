"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
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
  Project,
  Assignment,
  ProjectRequirement,
  Role,
  Type,
} from "@/types/models";
import { ProjectStatus, Seniority, Satisfaction } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, PenToolIcon as Tool } from "lucide-react";
import Link from "next/link";

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
  const [types, setTypes] = useState<Type[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchProjects();
    fetchRoles();
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (!Array.isArray(data.projects)) {
        console.error("Unexpected data format:", data);
        throw new Error("Invalid data format received from API");
      }

      setProjects(data.projects);
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

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/types");
      if (!response.ok) throw new Error("Failed to fetch project types");

      const data: Type[] = await response.json();
      setTypes(data);
    } catch (error) {
      console.error("Error fetching project types:", error);
      toast({
        title: "Error",
        description: "Failed to fetch project types. Please try again.",
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

  const handleCreateOrUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingProject) return;
      const { startDate, endDate, ...projectData } = editingProject;
      const status = getProjectStatus(startDate, endDate);

      const method = editingProject.id ? "PUT" : "POST";
      const url = editingProject.id
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...projectData, startDate, endDate, status }),
      });

      if (!response.ok)
        throw new Error(
          `Failed to ${editingProject.id ? "update" : "create"} project`
        );

      await fetchProjects();
      setEditingProject(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: `Project ${
          editingProject.id ? "updated" : "created"
        } successfully.`,
      });
    } catch (error) {
      console.error(
        `Error ${editingProject?.id ? "updating" : "creating"} project:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to ${
          editingProject?.id ? "update" : "create"
        } project.`,
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
            type: project.type,
            client_satisfaction: project.client_satisfaction,
          }
        : {
            name: "",
            tools: [],
            startDate: "",
            endDate: null,
            projectRequirements: [],
            type: "",
            client_satisfaction: Satisfaction.IDK,
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

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.CURRENT:
        return "bg-green-500";
      case ProjectStatus.UPCOMING:
        return "bg-yellow-500";
      case ProjectStatus.COMPLETED:
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Projects</h1>
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-grow">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
        <div className="text-center py-8">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader className="bg-secondary rounded-t-lg text-secondary-foreground">
                <CardTitle className="flex justify-between items-center">
                  <Link
                    href={`/projects/${project.id}`}
                    className="hover:underline"
                  >
                    {project.name}
                  </Link>
                  <Badge
                    className={`${getStatusColor(project.status)} text-white`}
                  >
                    {project.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString()} -
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{project.assignments?.length || 0} Assigned</span>
                  </div>
                  <div className="flex items-center">
                    <Tool className="mr-2 h-4 w-4" />
                    <span>
                      {project.tools?.join(", ") || "No tools specified"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(project)}
                  >
                    Edit
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/projects/${project.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingProject?.id ? "Edit Project" : "Add New Project"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdateProject} className="space-y-4">
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
              <Label htmlFor="type">Type</Label>
              <Select
                value={editingProject?.type || ""}
                onValueChange={(value) =>
                  setEditingProject((prev) =>
                    prev ? { ...prev, type: value } : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client_satisfaction">Client Satisfaction</Label>
              <Select
                value={editingProject?.client_satisfaction || ""}
                onValueChange={(value) =>
                  setEditingProject((prev) =>
                    prev
                      ? { ...prev, client_satisfaction: value as Satisfaction }
                      : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client satisfaction" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Satisfaction).map((satisfaction) => (
                    <SelectItem key={satisfaction} value={satisfaction}>
                      {satisfaction}
                    </SelectItem>
                  ))}
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

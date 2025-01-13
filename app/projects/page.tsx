"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useDebounce } from "@/hooks/use-debounce";
import { Project, Role, Type } from "@/types/models";
import { ProjectStatus, Seniority, Satisfaction } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Eye, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface EditingProjectRequirement {
  roleId: number;
  seniority: Seniority;
  startDate: string;
  endDate: string | null;
  quantity: number;
}

interface EditingProject
  extends Omit<Project, "id" | "assignments" | "projectRequirements"> {
  id?: number;
  projectRequirements: EditingProjectRequirement[];
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "ALL">(
    "ALL"
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [editingProject, setEditingProject] = useState<EditingProject | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(Math.ceil(data.projects.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage]);

  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/types");
      if (!response.ok) throw new Error("Failed to fetch types");
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      console.error("Error fetching types:", error);
      toast({
        title: "Error",
        description: "Failed to fetch types",
        variant: "destructive",
      });
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch("/api/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchTypes();
    fetchRoles();
  }, [
    fetchProjects,
    fetchTypes,
    fetchRoles,
    debouncedSearchQuery,
    selectedStatus,
    selectedType,
    currentPage,
  ]);

  const handleCreateOrUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const isUpdate = !!editingProject.id;
    const endpoint = isUpdate
      ? `/api/projects?id=${editingProject.id}`
      : "/api/projects";
    const method = isUpdate ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProject,
          status: getProjectStatus(
            editingProject.startDate,
            editingProject.endDate
          ),
        }),
      });

      if (!response.ok) {
        throw new Error(
          isUpdate ? "Failed to update project" : "Failed to create project"
        );
      }

      await fetchProjects();
      setEditingProject(null);
      setIsEditDialogOpen(false);

      toast({
        title: "Success",
        description: isUpdate
          ? "Project updated successfully"
          : "Project created successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: isUpdate
          ? "Failed to update project"
          : "Failed to create project",
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
    } else if (end && now > end) {
      return ProjectStatus.COMPLETED;
    } else {
      return ProjectStatus.CURRENT;
    }
  };

  // Filter and paginate projects
  const filteredProjects = projects
    .filter((project) => {
      const matchesSearch = project.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || project.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" || project.type === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    })
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  console.log(roles);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Projects</h1>
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-grow">
          <div className="relative">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </div>
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            setSelectedStatus(value as ProjectStatus | "ALL")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value={ProjectStatus.CURRENT}>Current</SelectItem>
            <SelectItem value={ProjectStatus.UPCOMING}>Upcoming</SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.name}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditingProject({
              name: "",
              type: "",
              status: getProjectStatus(new Date().toISOString(), null),
              startDate: new Date().toISOString(),
              endDate: null,
              tools: [],
              client_satisfaction: Satisfaction.IDK,
              projectRequirements: [
                {
                  // Initial single requirement
                  roleId: roles.length > 0 ? roles[0].id : 0,
                  seniority: Seniority.JUNIOR,
                  startDate: new Date().toISOString().split("T")[0],
                  endDate: null,
                  quantity: 1,
                },
              ],
            });
            setIsEditDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <Table className="border rounded-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead>Tools</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="capitalize">{project.name}</TableCell>
                  <TableCell>{project.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(project.startDate).toLocaleDateString()} -
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative group">
                      {project.projectRequirements &&
                      project.projectRequirements.length > 0 ? (
                        <div>
                          <span className="capitalize flex items-center">
                            {`${project.projectRequirements[0].quantity} ${project.projectRequirements[0].role?.name} (${project.projectRequirements[0].seniority})`}
                            {project.projectRequirements.length > 1 && (
                              <span className="border rounded-full flex items-center justify-center w-8 h-8 ml-2">
                                {`+${project.projectRequirements.length - 1}`}
                              </span>
                            )}
                          </span>
                          {project.projectRequirements.length > 1 && (
                            <div className="absolute left-0 top-full mt-1 hidden w-64 bg-white border border-gray-200 rounded-md shadow-md group-hover:block z-10">
                              <div className="p-2 text-sm">
                                {project.projectRequirements.map((req) => (
                                  <div key={req.id} className="py-1">
                                    {req.quantity} {req.role?.name} (
                                    {req.seniority})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative group capitalize">
                      {project.tools && project.tools.length > 0 ? (
                        <div>
                          <span className="flex items-center gap-1">
                            <Badge variant="secondary">
                              {project.tools[0]}
                            </Badge>
                            {project.tools.length > 1 && (
                              <Badge variant="secondary">
                                {project.tools[1]}
                              </Badge>
                            )}
                            {project.tools.length > 2 && (
                              <span className="border rounded-full flex items-center justify-center w-8 h-8">
                                {`+${project.tools.length - 2}`}
                              </span>
                            )}
                          </span>
                          {project.tools.length > 2 && (
                            <div className="absolute left-0 top-full mt-1 hidden w-48 bg-white border border-gray-200 rounded-md shadow-md group-hover:block z-10">
                              <div className="p-2 text-sm">
                                {project.tools.slice(2).map((tool) => (
                                  <div key={tool} className="py-1">
                                    {tool}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingProject({
                            ...project,
                            projectRequirements:
                              project.projectRequirements || [],
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this project?"
                            )
                          ) {
                            try {
                              const response = await fetch(
                                `/api/projects/${project.id}`,
                                {
                                  method: "DELETE",
                                }
                              );
                              if (!response.ok)
                                throw new Error("Failed to delete project");
                              await fetchProjects();
                              toast({
                                title: "Success",
                                description: "Project deleted successfully",
                              });
                            } catch (error) {
                              console.error("Error deleting project:", error);
                              toast({
                                title: "Error",
                                description: "Failed to delete project",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProjects.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(Math.max(1, currentPage - 1));
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(Math.min(totalPages, currentPage + 1));
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject?.id ? "Edit Project" : "Add New Project"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdateProject} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editingProject?.name || ""}
                placeholder="Enter name"
                onChange={(e) =>
                  setEditingProject((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div>
              <Label>Type</Label>
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
              <Label>Client Satisfaction</Label>
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
              <Label>Tools (comma-separated)</Label>
              <Input
                placeholder="React, TypeScript, Node.js"
                value={editingProject?.tools?.join(", ") || ""}
                onChange={(e) =>
                  setEditingProject((prev) =>
                    prev
                      ? {
                          ...prev,
                          tools: e.target.value
                            ? e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : [],
                        }
                      : null
                  )
                }
              />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={editingProject?.startDate?.split("T")[0] || ""}
                onChange={(e) =>
                  setEditingProject((prev) =>
                    prev ? { ...prev, startDate: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={editingProject?.endDate?.split("T")[0] || ""}
                onChange={(e) =>
                  setEditingProject((prev) =>
                    prev ? { ...prev, endDate: e.target.value || null } : null
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Project Requirements</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingProject((prev) => {
                      if (!prev) return null;
                      const newRequirement: EditingProjectRequirement = {
                        roleId: roles.length > 0 ? roles[0].id : 0,
                        seniority: Seniority.JUNIOR,
                        startDate: prev.startDate,
                        endDate: prev.endDate,
                        quantity: 1,
                      };
                      return {
                        ...prev,
                        projectRequirements: [
                          ...prev.projectRequirements,
                          newRequirement,
                        ],
                      };
                    });
                  }}
                >
                  Add Requirement
                </Button>
              </div>

              <div className="space-y-4 ">
                {editingProject?.projectRequirements?.map((req, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-4 items-end border rounded-lg p-4"
                  >
                    <div className="">
                      <Label>Role</Label>
                      <Select
                        onValueChange={(value) => {
                          setEditingProject((prev) => {
                            if (!prev) return null;
                            const updatedReqs = [...prev.projectRequirements];
                            updatedReqs[index] = {
                              ...updatedReqs[index],
                              roleId: parseInt(value),
                            };
                            return {
                              ...prev,
                              projectRequirements: updatedReqs,
                            };
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id.toString()}
                            >
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="">
                      <Label>Seniority</Label>
                      <Select
                        value={req.seniority}
                        onValueChange={(value) => {
                          const updatedReqs = [
                            ...(editingProject?.projectRequirements || []),
                          ];
                          updatedReqs[index] = {
                            ...req,
                            seniority: value as Seniority,
                          };
                          setEditingProject((prev) =>
                            prev
                              ? { ...prev, projectRequirements: updatedReqs }
                              : null
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seniority" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Seniority).map((seniority) => (
                            <SelectItem key={seniority} value={seniority}>
                              {seniority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-1">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={req.quantity}
                        onChange={(e) => {
                          const updatedReqs = [
                            ...(editingProject?.projectRequirements || []),
                          ];
                          updatedReqs[index] = {
                            ...req,
                            quantity: parseInt(e.target.value) || 1,
                          };
                          setEditingProject((prev) =>
                            prev
                              ? { ...prev, projectRequirements: updatedReqs }
                              : null
                          );
                        }}
                      />
                    </div>
                    <div className="">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={req.startDate?.split("T")[0] || ""}
                        onChange={(e) => {
                          const updatedReqs = [
                            ...(editingProject?.projectRequirements || []),
                          ];
                          updatedReqs[index] = {
                            ...req,
                            startDate: e.target.value,
                          };
                          setEditingProject((prev) =>
                            prev
                              ? { ...prev, projectRequirements: updatedReqs }
                              : null
                          );
                        }}
                      />
                    </div>

                    <div className="">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={req.endDate?.split("T")[0] || ""}
                        onChange={(e) => {
                          const updatedReqs = [
                            ...(editingProject?.projectRequirements || []),
                          ];
                          updatedReqs[index] = {
                            ...req,
                            endDate: e.target.value || null,
                          };
                          setEditingProject((prev) =>
                            prev
                              ? { ...prev, projectRequirements: updatedReqs }
                              : null
                          );
                        }}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="mt-6"
                        onClick={() => {
                          const updatedReqs =
                            editingProject?.projectRequirements.filter(
                              (_, i) => i !== index
                            );
                          setEditingProject((prev) =>
                            prev
                              ? { ...prev, projectRequirements: updatedReqs }
                              : null
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit">
                {editingProject?.id ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

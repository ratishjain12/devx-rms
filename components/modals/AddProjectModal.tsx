// components/modals/AddProjectModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectStatus, Satisfaction, Seniority } from "@prisma/client";
import { toast } from "@/hooks/use-toast";
import { Role, Type } from "@/types/models";
import { satisfactionFormatter } from "@/lib/utils";

interface ProjectRequirement {
  roleId: string;
  seniority: Seniority;
  startDate: string;
  endDate: string;
  quantity: string;
}

interface ProjectData {
  name: string;
  type: string;
  tools: string[];
  startDate: string;
  endDate: string;
  client_satisfaction: Satisfaction;
  projectRequirements: ProjectRequirement[];
}

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectAdded: () => Promise<void>;
}

export function AddProjectModal({
  isOpen,
  onClose,
  onProjectAdded,
}: AddProjectModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    type: "",
    tools: [],
    startDate: "",
    endDate: "",
    client_satisfaction: Satisfaction.IDK,
    projectRequirements: [],
  });

  useEffect(() => {
    fetchRoles();
    fetchTypes();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/types");
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      console.error("Error fetching types:", error);
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

  const handleAddRequirement = () => {
    setProjectData((prev) => ({
      ...prev,
      projectRequirements: [
        ...prev.projectRequirements,
        {
          roleId: "",
          seniority: Seniority.JUNIOR,
          startDate: projectData.startDate,
          endDate: projectData.endDate || "",
          quantity: "1",
        },
      ],
    }));
  };

  const handleRemoveRequirement = (index: number) => {
    setProjectData((prev) => ({
      ...prev,
      projectRequirements: prev.projectRequirements.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleRequirementChange = (
    index: number,
    field: keyof ProjectRequirement,
    value: string
  ) => {
    setProjectData((prev) => ({
      ...prev,
      projectRequirements: prev.projectRequirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      ),
    }));
  };

  const resetForm = () => {
    setProjectData({
      name: "",
      type: "",
      tools: [],
      startDate: "",
      endDate: "",
      client_satisfaction: Satisfaction.IDK,
      projectRequirements: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const status = getProjectStatus(
        projectData.startDate,
        projectData.endDate
      );

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectData,
          status,
          tools: projectData.tools.length > 0 ? projectData.tools : ["None"],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      toast({
        title: "Success",
        description: "Project created successfully",
      });
      await onProjectAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={projectData.name}
                onChange={(e) =>
                  setProjectData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Project Type</Label>
              <Select
                value={projectData.type}
                onValueChange={(value) =>
                  setProjectData((prev) => ({ ...prev, type: value }))
                }
                required
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={projectData.startDate}
                onChange={(e) =>
                  setProjectData((prev) => ({
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
                value={projectData.endDate}
                min={projectData.startDate}
                onChange={(e) =>
                  setProjectData((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tools">Tools (comma-separated)</Label>
            <Input
              id="tools"
              value={projectData.tools.join(", ")}
              onChange={(e) =>
                setProjectData((prev) => ({
                  ...prev,
                  tools: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="React, Node.js, etc."
            />
          </div>

          <div>
            <Label htmlFor="client_satisfaction">Client Satisfaction</Label>
            <Select
              value={satisfactionFormatter(projectData.client_satisfaction)}
              onValueChange={(value) =>
                setProjectData((prev) => ({
                  ...prev,
                  client_satisfaction: value as Satisfaction,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select satisfaction level" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Satisfaction).map((satisfaction) => (
                  <SelectItem key={satisfaction} value={satisfaction}>
                    {satisfactionFormatter(satisfaction)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Project Requirements</Label>
              <Button
                type="button"
                onClick={handleAddRequirement}
                variant="outline"
                disabled={!projectData.startDate}
              >
                Add Requirement
              </Button>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {projectData.projectRequirements.map((req, index) => (
                <div
                  key={index}
                  className="grid grid-cols-6 gap-2 items-end bg-gray-50 p-2 rounded"
                >
                  <div className="col-span-2">
                    <Label>Role</Label>
                    <Select
                      value={req.roleId}
                      onValueChange={(value) =>
                        handleRequirementChange(index, "roleId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Seniority</Label>
                    <Select
                      value={req.seniority}
                      onValueChange={(value) =>
                        handleRequirementChange(
                          index,
                          "seniority",
                          value as Seniority
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Seniority).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={req.quantity}
                      onChange={(e) =>
                        handleRequirementChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleRemoveRequirement(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-300">
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

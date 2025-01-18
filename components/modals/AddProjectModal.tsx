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
import { Trash2 } from "lucide-react";

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

  // Initialize with default values in local time
  const defaultStartDate = new Date().toISOString().split("T")[0];
  const defaultEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    type: "",
    tools: [],
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    client_satisfaction: Satisfaction.IDK,
    projectRequirements: [], // Initialize with empty array since requirements are optional
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
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/types");
      const data = await response.json();
      setTypes(data);

      // Set default type when types are fetched
      if (data.length > 0) {
        setProjectData((prev) => ({
          ...prev,
          type: data[0].name,
        }));
      }
    } catch (error) {
      console.error("Error fetching types:", error);
      toast({
        title: "Error",
        description: "Failed to fetch types",
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

  const handleAddRequirement = () => {
    setProjectData((prev) => ({
      ...prev,
      projectRequirements: [
        ...prev.projectRequirements,
        {
          roleId: roles.length > 0 ? roles[0].id.toString() : "",
          seniority: Seniority.JUNIOR,
          startDate: prev.startDate,
          endDate: prev.endDate,
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

  const resetForm = () => {
    const newStartDate = new Date().toISOString().split("T")[0];
    const newEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    setProjectData({
      name: "",
      type: types.length > 0 ? types[0].name : "",
      tools: [],
      startDate: newStartDate,
      endDate: newEndDate,
      client_satisfaction: Satisfaction.IDK,
      projectRequirements: [], // Reset to empty array
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const status = getProjectStatus(
        projectData.startDate,
        projectData.endDate
      );

      const payload = {
        ...projectData,
        status,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        tools: projectData.tools.length > 0 ? projectData.tools : ["None"],
        projectRequirements: projectData.projectRequirements.map((req) => ({
          ...req,
          startDate: req.startDate,
          endDate: req.endDate,
          quantity: parseInt(req.quantity),
        })),
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <Input
              value={projectData.name}
              onChange={(e) =>
                setProjectData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter project name (e.g., Website Redesign)"
              required
            />
          </div>

          <div>
            <Label>Project Type</Label>
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

          <div>
            <Label>Client Satisfaction</Label>
            <Select
              value={projectData.client_satisfaction}
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

          <div>
            <Label>Tools</Label>
            <Input
              placeholder="Enter tools separated by commas (e.g., React, TypeScript, Node.js)"
              value={projectData.tools.join(", ")}
              onChange={(e) =>
                setProjectData((prev) => ({
                  ...prev,
                  tools: e.target.value
                    ? e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : [],
                }))
              }
            />
          </div>

          {/* Date Input Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={projectData.startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setProjectData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }));
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={projectData.endDate}
                min={projectData.startDate}
                onChange={(e) => {
                  setProjectData((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }));
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Project Requirements (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRequirement}
              >
                Add Requirement
              </Button>
            </div>

            {projectData.projectRequirements.map((req, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 items-end border rounded-lg p-4 bg-gray-50"
              >
                <div>
                  <Label>Role</Label>
                  <Select
                    value={req.roleId}
                    onValueChange={(value) => {
                      const updatedReqs = [...projectData.projectRequirements];
                      updatedReqs[index] = { ...req, roleId: value };
                      setProjectData((prev) => ({
                        ...prev,
                        projectRequirements: updatedReqs,
                      }));
                    }}
                    required
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
                    onValueChange={(value) => {
                      const updatedReqs = [...projectData.projectRequirements];
                      updatedReqs[index] = {
                        ...req,
                        seniority: value as Seniority,
                      };
                      setProjectData((prev) => ({
                        ...prev,
                        projectRequirements: updatedReqs,
                      }));
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seniority" />
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

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={req.quantity}
                    onChange={(e) => {
                      const updatedReqs = [...projectData.projectRequirements];
                      updatedReqs[index] = { ...req, quantity: e.target.value };
                      setProjectData((prev) => ({
                        ...prev,
                        projectRequirements: updatedReqs,
                      }));
                    }}
                    placeholder="Enter quantity needed"
                    required
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <input
                    type="date"
                    value={req.startDate}
                    onChange={(e) => {
                      const updatedReqs = [...projectData.projectRequirements];
                      updatedReqs[index] = {
                        ...req,
                        startDate: e.target.value,
                      };
                      setProjectData((prev) => ({
                        ...prev,
                        projectRequirements: updatedReqs,
                      }));
                    }}
                    min={projectData.startDate}
                    max={req.endDate}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <input
                    type="date"
                    value={req.endDate}
                    onChange={(e) => {
                      const updatedReqs = [...projectData.projectRequirements];
                      updatedReqs[index] = {
                        ...req,
                        endDate: e.target.value,
                      };
                      setProjectData((prev) => ({
                        ...prev,
                        projectRequirements: updatedReqs,
                      }));
                    }}
                    min={req.startDate}
                    max={projectData.endDate}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-3 flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveRequirement(index)}
                    className="mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
            >
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

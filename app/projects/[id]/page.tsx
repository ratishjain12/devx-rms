"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/types/models";
import { ProjectStatus, Satisfaction } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  PenToolIcon as Tool,
  Briefcase,
  Star,
  Users,
  Clock,
  CheckSquare,
} from "lucide-react";
import { satisfactionFormatter } from "@/lib/utils";

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error("Failed to fetch project details");
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete project");
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
        router.push("/projects");
      } catch (error) {
        console.error("Error deleting project:", error);
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.CURRENT:
        return "bg-green-600";
      case ProjectStatus.UPCOMING:
        return "bg-yellow-600";
      case ProjectStatus.COMPLETED:
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-center py-8">Project not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        <span className="mr-2">←</span> Back to Projects
      </Button>

      <Card className="shadow-lg">
        <CardHeader className="bg-secondary">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-4xl capitalize font-bold mb-2">
                {project.name}
              </CardTitle>
              <CardDescription className="text-lg">
                <Badge className="font-semibold bg-blue-50 text-blue-500">
                  {project.type}
                </Badge>
              </CardDescription>
            </div>
            <Badge
              className={`${getStatusColor(
                project.status
              )} text-white text-lg px-3 py-1`}
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-lg">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                <span className="font-semibold">Duration:</span>
              </div>
              <p className="ml-7">
                {new Date(project.startDate).toLocaleDateString()} -
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "Ongoing"}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-lg">
                <Star className="mr-2 h-5 w-5 text-primary" />
                <span className="font-semibold">Client Satisfaction:</span>
              </div>
              <p className="ml-7">
                {satisfactionFormatter(
                  project.client_satisfaction || Satisfaction.IDK
                )}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-2xl font-semibold mb-3 flex items-center">
              <Tool className="mr-2 h-6 w-6 text-primary" />
              Tools Used
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.tools && project.tools.length > 0 ? (
                project.tools.map((tool, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-md px-3 py-1 capitalize"
                  >
                    {tool}
                  </Badge>
                ))
              ) : (
                <p>No tools specified</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-2xl font-semibold mb-3 flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" />
              Assigned Employees
            </h3>
            {project.assignments && project.assignments.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {project.assignments.map((assignment) => (
                  <li key={assignment.id} className="flex items-center">
                    <CheckSquare className="mr-2 h-4 w-4 text-green-500" />
                    {assignment.employee.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No employees assigned</p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-2xl font-semibold mb-3 flex items-center">
              <Briefcase className="mr-2 h-6 w-6 text-primary" />
              Project Requirements
            </h3>
            {project.projectRequirements &&
            project.projectRequirements.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.projectRequirements.map((req) => (
                  <li key={req.id} className="bg-secondary rounded-lg p-3">
                    <p className="font-semibold">
                      {req.role.name || "Unknown Role"}
                    </p>
                    <p>Seniority: {req.seniority}</p>
                    <p>Quantity: {req.quantity}</p>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="inline mr-1 h-4 w-4" />
                      {new Date(req.startDate).toLocaleDateString()} -
                      {req.endDate
                        ? new Date(req.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No project requirements specified</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" asChild>
              <a href={`/projects/${project.id}/edit`}>Edit Project</a>
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/types/models";
import { ProjectStatus, Satisfaction } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, PenToolIcon as Tool, Briefcase, Star } from "lucide-react";
import Link from "next/link";

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
        return "bg-green-500";
      case ProjectStatus.UPCOMING:
        return "bg-yellow-500";
      case ProjectStatus.COMPLETED:
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-center py-8">Project not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/projects">
        <Button variant="outline" className="mb-4">
          Back to Projects
        </Button>
      </Link>
      <Card>
        <CardHeader className="bg-secondary text-secondary-foreground">
          <CardTitle className="flex justify-between items-center">
            <span className="text-3xl">{project.name}</span>
            <Badge className={`${getStatusColor(project.status)} text-white`}>
              {project.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            <span>
              {new Date(project.startDate).toLocaleDateString()} -
              {project.endDate
                ? new Date(project.endDate).toLocaleDateString()
                : "Ongoing"}
            </span>
          </div>
          <div className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            <span>{project.type}</span>
          </div>
          <div className="flex items-center">
            <Star className="mr-2 h-5 w-5" />
            <span>
              Client Satisfaction:{" "}
              {project.client_satisfaction || Satisfaction.IDK}
            </span>
          </div>
          <div className="flex items-center">
            <Tool className="mr-2 h-5 w-5" />
            <span>{project.tools?.join(", ") || "No tools specified"}</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Assigned Employees</h3>
            {project.assignments && project.assignments.length > 0 ? (
              <ul className="list-disc pl-5">
                {project.assignments.map((assignment) => (
                  <li key={assignment.id}>{assignment.employee.name}</li>
                ))}
              </ul>
            ) : (
              <p>No employees assigned</p>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Project Requirements</h3>
            {project.projectRequirements &&
            project.projectRequirements.length > 0 ? (
              <ul className="list-disc pl-5">
                {project.projectRequirements.map((req) => (
                  <li key={req.id}>
                    {req.role.name || "Unknown Role"} - {req.seniority} (
                    {req.quantity})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No project requirements specified</p>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

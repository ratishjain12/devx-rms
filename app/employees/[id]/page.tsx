"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Assignment, Employee } from "@/types/models";
import { Users, ChevronLeft, Calendar, Briefcase, Code } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function EmployeeDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployeeDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/employees/${id}`);
      if (!response.ok) throw new Error("Failed to fetch employee details");
      const data = await response.json();
      setEmployee(data);
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employee details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [fetchEmployeeDetails]);

  if (isLoading) {
    return <EmployeeDetailsSkeleton />;
  }

  if (!employee) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Employee not found</h2>
        <Button onClick={() => router.push("/employees")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button
        variant="ghost"
        onClick={() => router.push("/employees")}
        className="mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Employees
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 max-h-fit">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${employee.name}`}
                  alt={employee.name}
                />
                <AvatarFallback>
                  {employee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {employee.name}
                </CardTitle>
                <CardDescription>{employee.seniority}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Roles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {employee.roles && employee.roles.length > 0
                    ? employee.roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {role}
                        </Badge>
                      ))
                    : "No Roles"}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Code className="mr-2 h-5 w-5" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {employee.skills && employee.skills.length > 0
                    ? employee.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))
                    : "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employee.assignments && employee.assignments.length > 0
                ? employee.assignments.map((assignment) => (
                    <ProjectCard key={assignment.id} assignment={assignment} />
                  ))
                : "Not Assigned to any projects"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProjectCard({ assignment }: { assignment: Assignment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{assignment.project.name}</CardTitle>
        <CardDescription>
          {assignment.project.type || "No description available."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              <strong>Start:</strong>{" "}
              {format(new Date(assignment.startDate), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              <strong>End:</strong>{" "}
              {assignment.endDate
                ? format(new Date(assignment.endDate), "MMM d, yyyy")
                : "Ongoing"}
            </span>
          </div>
          <div className="col-span-2">
            <div className="flex items-center mb-1">
              <Briefcase className="mr-2 h-4 w-4" />
              <strong>Utilization:</strong> {assignment.utilisation}%
            </div>
            <Progress value={assignment.utilisation} className="mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeeDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

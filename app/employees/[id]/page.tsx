"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Employee } from "@/types/models";
import { Calendar, Users, Briefcase } from "lucide-react";
import Link from "next/link";

export default function EmployeeDetails() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  const fetchEmployeeDetails = async () => {
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
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading employee details...</div>;
  }

  if (!employee) {
    return <div className="text-center py-8">Employee not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/employees">
        <Button variant="outline" className="mb-4">
          Back to Employees
        </Button>
      </Link>
      <Card>
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-3xl">{employee.name}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              <span className="font-semibold mr-2">Seniority:</span>
              <Badge>{employee.seniority}</Badge>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <Users className="mr-2 h-5 w-5" />
                <span className="font-semibold">Roles:</span>
              </div>
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
              <div className="flex items-center mb-2">
                <Calendar className="mr-2 h-5 w-5" />
                <span className="font-semibold">Skills:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {employee.skills && employee.skills.length > 0
                  ? employee.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  : "No Skills"}
              </div>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <Briefcase className="mr-2 h-5 w-5" />
                <span className="font-semibold">Current Project:</span>
              </div>
              <span>
                {employee.assignments && employee.assignments.length > 0
                  ? employee.assignments[employee.assignments.length - 1]
                      .project.name
                  : "Not Assigned"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

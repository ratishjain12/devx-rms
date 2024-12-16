"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Calendar, TrendingUp } from "lucide-react";

interface AnalyticsData {
  totalEmployees: number;
  totalProjects: number;
  activeAssignments: number;
  utilizationRate: number;
}

export function AnalyticsCards() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalEmployees: 0,
    totalProjects: 0,
    activeAssignments: 0,
    utilizationRate: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [employeesRes, projectsRes, assignmentsRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/projects"),
          fetch("/api/assignments"),
        ]);

        if (!employeesRes.ok || !projectsRes.ok || !assignmentsRes.ok) {
          throw new Error("One or more API calls failed");
        }

        const employees = await employeesRes.json();
        const projects = await projectsRes.json();
        const assignments = await assignmentsRes.json();

        if (
          !Array.isArray(employees) ||
          !Array.isArray(projects) ||
          !Array.isArray(assignments)
        ) {
          throw new Error("Invalid data format received from API");
        }

        const activeAssignments = assignments.filter(
          (a: any) => new Date(a.endDate) >= new Date()
        ).length;

        const totalUtilization = assignments.reduce(
          (sum: number, a: any) =>
            sum + (typeof a.utilisation === "number" ? a.utilisation : 0),
          0
        );

        setAnalyticsData({
          totalEmployees: employees.length,
          totalProjects: projects.length,
          activeAssignments,
          utilizationRate:
            assignments.length > 0 ? totalUtilization / assignments.length : 0,
        });
        setError(null);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setError("Failed to load analytics data. Please try again later.");
      }
    };

    fetchAnalytics();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analyticsData.totalEmployees}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analyticsData.totalProjects}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Assignments
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analyticsData.activeAssignments}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg. Utilization Rate
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(analyticsData.utilizationRate * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

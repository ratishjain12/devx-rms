"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Calendar } from "lucide-react";

interface AnalyticsData {
  totalEmployees: number | null;
  totalProjects: number | null;
  activeAssignments: number | null;
}

export function AnalyticsCards() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalEmployees: null,
    totalProjects: null,
    activeAssignments: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const fetchWithFallback = async (url: string): Promise<any> => {
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error();
            return await response.json();
          } catch {
            return null;
          }
        };

        const [employees, projects, assignments] = await Promise.all([
          fetchWithFallback("/api/employees"),
          fetchWithFallback("/api/projects"),
          fetchWithFallback("/api/assignments"),
        ]);

        const activeAssignments = assignments
          ? assignments.filter((a: any) => new Date(a.endDate) >= new Date())
              .length
          : null;

        setAnalyticsData({
          totalEmployees: employees ? employees.length : null,
          totalProjects: projects ? projects.length : null,
          activeAssignments,
        });
        setError(null);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setError("Failed to load some analytics data.");
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analyticsData.totalEmployees !== null
              ? analyticsData.totalEmployees
              : "No data found"}
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
            {analyticsData.totalProjects !== null
              ? analyticsData.totalProjects
              : "No data found"}
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
            {analyticsData.activeAssignments !== null
              ? analyticsData.activeAssignments
              : "No data found"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

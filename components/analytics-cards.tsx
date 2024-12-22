"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Calendar, AlertTriangle } from "lucide-react";
import { AnalyticsData } from "@/types/types";

export function AnalyticsCards() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalEmployees: null,
    totalProjects: null,
    activeAssignments: null,
    totalOverlaps: null,
    topOverlappingEmployees: null,
    overworkedEmployees: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch data from APIs
        const fetchWithFallback = async (url: string): Promise<any> => {
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error();
            return await response.json();
          } catch {
            return null;
          }
        };

        const [employees, projects, assignments, overlappingData, overworked] =
          await Promise.all([
            fetchWithFallback("/api/employees"),
            fetchWithFallback("/api/projects"),
            fetchWithFallback("/api/assignments"),
            fetchWithFallback("/api/overlapping-assignments"),
            fetchWithFallback("/api/overworked-employees"),
          ]);

        const activeAssignments = assignments
          ? assignments.filter((a: any) => new Date(a.endDate) >= new Date())
              .length
          : null;

        setAnalyticsData({
          totalEmployees: employees ? employees.length : null,
          totalProjects: projects ? projects.length : null,
          activeAssignments,
          totalOverlaps: overlappingData ? overlappingData.totalCount : null,
          topOverlappingEmployees: overlappingData
            ? overlappingData.topOverlappingEmployees.map((item: any) => ({
                name: item.employee.name,
                overlaps: item.overlapCount,
              }))
            : null,
          overworkedEmployees: overworked
            ? overworked.overworkedEmployees
            : null,
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Employees */}
      <Card className="md:col-span-2">
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

      {/* Total Projects */}
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

      {/* Active Assignments */}
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

      {/* Overlapping Assignments */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Overlapping Assignments
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {analyticsData.totalOverlaps !== null ? (
            <>
              <div className="text-lg font-bold">
                Total Overlaps: {analyticsData.totalOverlaps}
              </div>
              <div className="mt-2 text-sm">
                <strong>Top 5 Overlapping Employees:</strong>
                <ul className="mt-1 space-y-1">
                  {analyticsData.topOverlappingEmployees?.map((item, index) => (
                    <li key={index}>
                      {item.name} ({item.overlaps} overlaps)
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div>No data found</div>
          )}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Overworked Employees
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {analyticsData.overworkedEmployees &&
          analyticsData.overworkedEmployees.length > 0 ? (
            <ul className="text-md">
              {analyticsData.overworkedEmployees.map((employeeData, index) => (
                <li key={index}>
                  {employeeData.employee.name} (
                  {employeeData.employee.seniority}):{" "}
                  {employeeData.utilization.toFixed(1)}%
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-2xl font-bold">No overworked employees</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeGanttChart } from "@/components/employee-gantt-chart";
import { toast } from "@/hooks/use-toast";

const fetchEmployeesWithAssignments = async () => {
  try {
    const response = await fetch("/api/employees/with-assignments");
    if (!response.ok) {
      throw new Error("Failed to fetch employees with assignments");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching employees with assignments:", error);
    toast({
      title: "Error",
      description:
        "Failed to fetch employee utilization data. Please try again.",
      variant: "destructive",
    });
    return []; // Return empty array on error
  }
};

export default function UtilizationPage() {
  const [employeesData, setEmployeesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchEmployeesWithAssignments();
      setEmployeesData(data);
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Employee Utilization</h1>
      <Card>
        <CardHeader>
          <CardTitle>Project Utilization Gantt Chart</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <EmployeeGanttChart data={employeesData} />
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

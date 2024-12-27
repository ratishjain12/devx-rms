/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { Assignment } from "@/types/models";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

type overUtilizedEmployees = {
  employeeName: string;
  totalUtilization: number;
};

const EmployeeUtilizationChart: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [overUtilizedEmployees, setOverUtilizedEmployees] = useState<
    overUtilizedEmployees[]
  >([]);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || theme === "system";
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchAssignments();
    }
  }, [isClient]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAssignments(data);

      // Calculate total utilization for each employee
      const employeeUtilizationMap: Record<string, number> = {};

      data.forEach((assignment: Assignment) => {
        const { employee, utilisation } = assignment;

        if (!employeeUtilizationMap[employee.name]) {
          employeeUtilizationMap[employee.name] = 0;
        }

        employeeUtilizationMap[employee.name] += utilisation;
      });

      // Filter employees with utilization > 120%
      const overUtilizedEmployees = Object.entries(employeeUtilizationMap)
        .filter(([, totalUtilization]) => totalUtilization > 120)
        .map(([employeeName, totalUtilization]) => ({
          employeeName,
          totalUtilization,
        }));

      setOverUtilizedEmployees(overUtilizedEmployees);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getUtilizationRange = (
    utilization: number
  ): { color: string; range: string } => {
    if (utilization < 50)
      return { color: "#F44336", range: "Underutilized (<50%)" };
    if (utilization >= 50 && utilization < 80)
      return { color: "#FF9800", range: "Moderately Utilized (50-79%)" };
    return { color: "#4CAF50", range: "Well Utilized (80%+)" };
  };

  const prepareChartData = () => {
    const employeeData: Record<string, { utilizationData: any[] }> = {};

    // Group assignments by employee and calculate their utilization
    assignments?.forEach((assignment) => {
      const { employee, project, utilisation, startDate, endDate } = assignment;

      if (!employeeData[employee.name]) {
        employeeData[employee.name] = { utilizationData: [] };
      }

      const { color, range } = getUtilizationRange(utilisation);

      employeeData[employee.name].utilizationData.push({
        projectName: project.name,
        utilization: utilisation,
        color,
        range,
        startDate,
        endDate,
      });
    });

    const datasets = Object.entries(employeeData).map(
      ([employeeName, data]) => {
        // Sort assignments by start date for each employee
        const sortedAssignments = data.utilizationData.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

        const utilizationData: any[] = [];
        for (let i = 0; i < sortedAssignments.length; i++) {
          const current = sortedAssignments[i];
          utilizationData.push({
            x: [current.startDate, current.endDate],
            y: employeeName,
            projectName: current.projectName,
            utilization: current.utilization,
            range: current.range,
            backgroundColor: current.color,
          });

          // Check for gaps between assignments
          if (i < sortedAssignments.length - 1) {
            const next = sortedAssignments[i + 1];
            const currentEnd = new Date(current.endDate).getTime();
            const nextStart = new Date(next.startDate).getTime();

            if (nextStart > currentEnd) {
              utilizationData.push({
                x: [current.endDate, next.startDate],
                y: employeeName,
                projectName: "No Assignment",
                utilization: 0,
                range: "No Utilization",
                backgroundColor: "#E0E0E0", // Neutral gray
              });
            }
          }
        }

        return {
          label: employeeName,
          data: utilizationData,

          backgroundColor: utilizationData.map(
            (entry) => entry.backgroundColor
          ),
          categoryPercentage: 0.6,
          barPercentage: 0.8,
          borderWidth: 1,
        };
      }
    );

    return { datasets, labels: Object.keys(employeeData) };
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (assignments && assignments.length === 0) {
    return <div>No data available</div>;
  }

  const { datasets, labels } = prepareChartData();

  const chartOptions: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "week",
          tooltipFormat: "MMM d",
          displayFormats: {
            week: "MMM d",
          },
        },
        position: "top",
        title: {
          display: true,
          text: "Timeline",
          color: isDarkMode ? "#FFFFFF" : "#000000",
        },
        // Restrict x-axis to three months
        min: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString(),
        max: new Date(
          new Date().setMonth(new Date().getMonth() + 6)
        ).toISOString(),

        ticks: {
          color: isDarkMode ? "#FFFFFF" : "#000000",
        },
      },
      y: {
        type: "category",
        labels: labels,
        title: {
          display: true,
          text: "Employees",
          color: isDarkMode ? "#FFFFFF" : "#000000",
        },
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          crossAlign: "near",
          color: isDarkMode ? "#FFFFFF" : "#000000",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: { color: isDarkMode ? "#FFFFFF" : "#000000" },
      },
      title: {
        display: true,
        text: "Employee Utilization Chart",
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            const data = tooltipItem.raw;
            const dateRange = `Dates: ${new Date(data.x[0])} - ${new Date(
              data.x[1]
            )}`;
            return [
              `Employee: ${data.y}`,
              `Project: ${data.projectName}`,
              `Utilization: ${data.utilization.toFixed(2)}%`,
              `Range: ${data.range}`,
              dateRange, // Add date range to the tooltip
            ];
          },
        },
      },
    },
  };

  return (
    <div>
      <div
        style={{
          height: "600px ",
          overflowY: "auto",
          overflowX: "scroll",
        }}
      >
        <Bar options={chartOptions} data={{ datasets }} />
      </div>
      {overUtilizedEmployees.length > 0 && (
        <div className="mt-8 px-4">
          <h2 className="text-xl font-semibold mb-4">
            Overutilized Employees (&gt;120% Total Utilization)
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Total Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overUtilizedEmployees.map((employee) => (
                <TableRow key={employee.employeeName}>
                  <TableCell>{employee.employeeName}</TableCell>
                  <TableCell>{employee.totalUtilization.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default EmployeeUtilizationChart;

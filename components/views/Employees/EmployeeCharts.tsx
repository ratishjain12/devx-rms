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
      console.log(data);

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

      // Set overutilized employees
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

      // Ensure employeeData for each employee is initialized
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
        // Calculate the earliest start date and latest end date for the employee
        const allStartDates = data.utilizationData.map(
          (entry) => new Date(entry.startDate)
        );
        const allEndDates = data.utilizationData.map(
          (entry) => new Date(entry.endDate)
        );
        const earliestStartDate = new Date(
          Math.min(...allStartDates.map((date) => date.getTime()))
        );
        const latestEndDate = new Date(
          Math.max(...allEndDates.map((date) => date.getTime()))
        );

        // Calculate the total duration of the employee's assignments
        const totalDuration =
          latestEndDate.getTime() - earliestStartDate.getTime();

        // Now divide the bar into equal parts based on the number of assignments
        const utilizationData = data.utilizationData.map((entry, index) => {
          const { color } = getUtilizationRange(entry.utilization);

          // Calculate the relative start and end date for each segment
          const segmentDuration = totalDuration / data.utilizationData.length;
          const segmentStartDate = new Date(
            earliestStartDate.getTime() + index * segmentDuration
          );
          const segmentEndDate = new Date(
            earliestStartDate.getTime() + (index + 1) * segmentDuration
          );

          return {
            x: [segmentStartDate.toISOString(), segmentEndDate.toISOString()], // Time range for the x-axis
            y: employeeName,
            projectName: entry.projectName,
            utilization: entry.utilization,
            range: entry.range,
            backgroundColor: color, // Set the color dynamically for each segment
          };
        });

        return {
          label: employeeName,
          data: utilizationData,
          borderWidth: 1,
          backgroundColor: utilizationData.map(
            (entry) => entry.backgroundColor
          ), // Dynamically set the backgroundColor for each segment
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
    indexAxis: "y", // Set horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time", // Time-based x-axis
        time: {
          unit: "week",
          tooltipFormat: "MMM d",
          displayFormats: {
            week: "MMM d",
          },
        },
        title: {
          display: true,
          text: "Timeline",
        },
        min: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString(),
        max: new Date(
          new Date().setMonth(new Date().getMonth() + 3)
        ).toISOString(),
      },
      y: {
        type: "category",
        labels: labels,
        title: {
          display: true,
          text: "Employees",
        },
        stacked: true, // Enable stacked bars on y-axis
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Employee Utilization Chart",
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            const data = tooltipItem.raw;
            return [
              `Employee: ${data.y}`,
              `Project: ${data.projectName}`,
              `Utilization: ${data.utilization.toFixed(2)}%`,
              `Range: ${data.range}`,
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
          height: "600px",
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

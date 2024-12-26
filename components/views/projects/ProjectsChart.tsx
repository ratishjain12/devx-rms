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
import { Project, ProjectRequirement } from "@/types/models";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const ProjectsChart: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchProjects();
    }
  }, [isClient]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getRequirementStatus = (
    project: Project,
    requirement: ProjectRequirement
  ): number => {
    // Find employees assigned to this requirement based on role, designation, and dates
    const relevantAssignments = project.assignments.filter(
      (assignment) =>
        assignment.employee.roles.includes(requirement.role.name) &&
        assignment.employee.seniority === requirement.seniority &&
        // Ensure the employee's dates encompass the requirement's start and end dates
        new Date(assignment.startDate) <= new Date(requirement.startDate) &&
        new Date(assignment.endDate) >= new Date(requirement.endDate)
    );

    const assignedCount = relevantAssignments.length; // Count of employees assigned to the requirement

    if (assignedCount < requirement.quantity) {
      return 3; // Blue: Underfilled
    } else if (assignedCount > requirement.quantity) {
      return 2; // Red: Overfilled
    }
    return 1; // Green: Requirements met
  };

  const prepareChartData = () => {
    const datasets = projects.map((project) => {
      const aggregatedRequirements = project.projectRequirements.map(
        (requirement) => {
          const status = getRequirementStatus(project, requirement);
          return {
            role: requirement.role.name,
            designation: requirement.seniority, // Include designation
            required: requirement.quantity,
            assigned: project.assignments.filter((assignment) =>
              assignment.employee.roles.includes(requirement.role.name)
            ).length, // Count of employees assigned to this requirement
            status,
          };
        }
      );

      // Determine overall project status based on requirements
      const overallStatus = aggregatedRequirements.some(
        (req) => req.status === 2 // If any requirement is overfilled
      )
        ? "#F44336" // Red: Overfilled
        : aggregatedRequirements.some((req) => req.status === 3)
        ? "#2196F3" // Blue: Underfilled
        : "#4CAF50"; // Green: All requirements met

      return {
        label: project.name,
        data: [
          {
            x: [project.startDate, project.endDate], // Timeline range
            y: project.name, // Project name for y-axis
            aggregatedRequirements, // Pass aggregated requirements for tooltips
          },
        ],
        backgroundColor: overallStatus, // Set the color based on the overall status
        borderWidth: 1,
      };
    });

    return { datasets };
  };

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
        labels: projects.map((project) => project.name),
        title: {
          display: true,
          text: "Projects",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Project Requirements Fulfillment",
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            const data = tooltipItem.raw; // Access raw data for the tooltip
            const aggregatedRequirements = data.aggregatedRequirements;

            const requirementsDetails = aggregatedRequirements.map(
              (req: any) =>
                `Role: ${req.role}, Designation: ${
                  req.designation
                }, Required: ${req.required}, Assigned: ${
                  req.assigned
                }, Status: ${
                  req.status === 1
                    ? "Met"
                    : req.status === 2
                    ? "Overfilled"
                    : "Underfilled"
                }`
            );

            return [`Project: ${data.y}`, ...requirementsDetails];
          },
        },
      },
    },
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

  if (projects.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div
      style={{
        height: "600px",
        overflowY: "auto",
        overflowX: "scroll",
      }}
    >
      <Bar options={chartOptions} data={prepareChartData()} />
    </div>
  );
};

export default ProjectsChart;

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
    const relevantAssignments = project.assignments.filter(
      (assignment) =>
        assignment.employee.roles.includes(requirement.role.name) &&
        assignment.employee.seniority === requirement.seniority &&
        new Date(assignment.startDate) >= new Date(requirement.startDate) &&
        new Date(assignment.endDate) <= new Date(requirement.endDate)
    );

    const assignedQuantity = relevantAssignments.reduce(
      (sum, assignment) => sum + assignment.utilisation / 100,
      0
    );

    if (assignedQuantity < requirement.quantity) {
      return 3; // Blue: Underfilled
    } else if (assignedQuantity > requirement.quantity) {
      return 2; // Red: Overfilled
    }
    return 1; // Green: Requirements met
  };

  const prepareChartData = () => {
    const datasets = projects.flatMap((project) =>
      project.projectRequirements.map((requirement) => {
        const status = getRequirementStatus(project, requirement);

        return {
          label: project.name,
          data: [
            {
              x: [project.startDate, project.endDate], // Timeline range
              y: project.name, // Project name for y-axis
              status,
            },
          ],
          backgroundColor:
            status === 1
              ? "#4CAF50" // Green: Requirements met
              : status === 2
              ? "#F44336" // Red: Overfilled
              : status === 3
              ? "#2196F3" // Blue: Underfilled
              : "rgba(0,0,0,0.1)",
          borderWidth: 1,
        };
      })
    );

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
        ).toISOString(), // First day of the current month
        max: new Date(
          new Date().setMonth(new Date().getMonth() + 3)
        ).toISOString(), // Three months from now
      },
      y: {
        type: "category", // Ensure y-axis treats labels as categories
        labels: projects.map((project) => project.name), // Map project names explicitly
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
          label: (context: any) => {
            const projectName = context.dataset.label;
            const statusIndex = context.dataIndex;
            const status = context.dataset.status[statusIndex];

            const statusText =
              status === 1
                ? "Met"
                : status === 2
                ? "Overfilled"
                : status === 3
                ? "Underfilled"
                : "Unknown";

            return [`${projectName}`, `Status: ${statusText}`];
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

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

const ProjectsChart: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || theme === "system";
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
        new Date(assignment.startDate) <= new Date(requirement.startDate) &&
        new Date(assignment.endDate) >= new Date(requirement.endDate)
    );

    const assignedCount = relevantAssignments.length;

    if (assignedCount < requirement.quantity) {
      return 3; // Blue: Underfilled
    } else if (assignedCount > requirement.quantity) {
      return 2; // Red: Overfilled
    }
    return 1; // Green: Requirements met
  };

  const prepareChartData = () => {
    const datasets = projects.map((project) => {
      const currentEndDate = new Date(
        new Date().setMonth(new Date().getMonth() + 6)
      ).toISOString();

      if (
        !project.projectRequirements ||
        project.projectRequirements.length === 0
      ) {
        const hasAssignments = project.assignments.length > 0;
        return {
          label: project.name,
          data: [
            {
              x: [project.startDate, project.endDate || currentEndDate],
              y: project.name,
              aggregatedRequirements: [],
            },
          ],
          backgroundColor: hasAssignments ? "#F44336" : "#E0E0E0",
          barPercentage: 0.7,
          categoryPercentage: 0.6,
        };
      }

      const aggregatedRequirements = project.projectRequirements.map(
        (requirement) => {
          const status = getRequirementStatus(project, requirement);
          return {
            role: requirement.role.name,
            designation: requirement.seniority,
            required: requirement.quantity,
            assigned: project.assignments.filter((assignment) =>
              assignment.employee.roles.includes(requirement.role.name)
            ).length,
            status,
          };
        }
      );

      const overallStatus = aggregatedRequirements.some(
        (req) => req.status === 2
      )
        ? "#F44336"
        : aggregatedRequirements.some((req) => req.status === 3)
        ? "#2196F3"
        : "#4CAF50";

      return {
        label: project.name,
        data: [
          {
            x: [project.startDate, project.endDate || currentEndDate],
            y: project.name,
            aggregatedRequirements,
          },
        ],
        backgroundColor: overallStatus,
        barPercentage: 0.7,
        categoryPercentage: 0.6,
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
        ticks: {
          color: isDarkMode ? "#FFFFFF" : "#000000",
        },
        position: "top",
        title: {
          display: true,
          text: "Timeline",
          color: isDarkMode ? "white" : "black",
        },
        min: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString(),
        max: new Date(
          new Date().setMonth(new Date().getMonth() + 6)
        ).toISOString(),
      },
      y: {
        type: "category",
        labels: projects.map((project) => project.name),
        title: {
          display: true,
          text: "Projects",
          color: isDarkMode ? "white" : "black",
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
        display: true,
        labels: {
          color: isDarkMode ? "#FFFFFF" : "#000000",
        },
      },
      title: {
        display: true,
        text: "Project Requirements Fulfillment",
        color: isDarkMode ? "white" : "black",
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            const data = tooltipItem.raw;
            const aggregatedRequirements = data.aggregatedRequirements;
            const projectStartDate = new Date(data.x[0]);
            const projectEndDate = new Date(data.x[1]);
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

            return [
              `Project: ${data.y}`,
              `Start Date: ${projectStartDate.toLocaleDateString()}`,
              `End Date: ${projectEndDate.toLocaleDateString()}`,
              ...requirementsDetails,
            ];
          },
        },
      },
    },
  };

  if (!isClient) return <div>Loading...</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (projects.length === 0) return <div>No data available</div>;

  return (
    <div
      className="w-full"
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

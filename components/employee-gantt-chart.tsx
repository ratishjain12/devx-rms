import { useState, useEffect } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Employee, Assignment, Project } from "@/types/models";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

interface EmployeeData {
  name: string;
  [key: string]:
    | {
        projectName: string;
        startDate: Date;
        endDate: Date;
        utilization: number;
      }
    | string;
}

interface CustomBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  utilization: number;
}

export function EmployeeGanttChart({ data }: { data: Employee[] }) {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});

  useEffect(() => {
    const newChartConfig: ChartConfig = {};
    // Process the data and set up the chart config
    data.forEach((employee) => {
      employee.assignments.forEach((assignment) => {
        const projectKey = `project_${assignment.project.id}`;
        if (!newChartConfig[projectKey]) {
          newChartConfig[projectKey] = {
            label: assignment.project.name,
            color: COLORS[Object.keys(newChartConfig).length % COLORS.length],
          };
        }
      });
    });
    setChartConfig(newChartConfig);
  }, [data]);

  const processData = (employeesData: Employee[]): EmployeeData[] => {
    const today = new Date();
    const oneYearAgo = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate()
    );
    const oneYearFromNow = new Date(
      today.getFullYear() + 1,
      today.getMonth(),
      today.getDate()
    );

    const processedData = employeesData.map((employee) => {
      const employeeData: EmployeeData = {
        name: employee.name,
      };

      employee.assignments.forEach((assignment) => {
        const startDate = new Date(assignment.startDate);
        const endDate = new Date(assignment.endDate);

        if (endDate >= oneYearAgo && startDate <= oneYearFromNow) {
          const projectKey = `project_${assignment.project.id}`;
          employeeData[projectKey] = {
            projectName: assignment.project.name,
            startDate: startDate < oneYearAgo ? oneYearAgo : startDate,
            endDate: endDate > oneYearFromNow ? oneYearFromNow : endDate,
            utilization: assignment.utilisation,
          };
        }
      });

      return employeeData;
    });

    return processedData;
  };

  const chartData = processData(data);

  const CustomBar = (props: CustomBarProps) => {
    const { x, y, width, height, fill, utilization } = props;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fill} />
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={10}
        >
          {utilization}%
        </text>
      </g>
    );
  };

  return (
    <ChartContainer config={chartConfig} className="h-[600px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          barGap={0}
          barSize={20}
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <XAxis
            type="number"
            domain={[
              new Date().getFullYear() - 1,
              new Date().getFullYear() + 1,
            ]}
            tickFormatter={(value) =>
              new Date(value, 0).getFullYear().toString()
            }
          />
          <YAxis dataKey="name" type="category" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(
                  value: any,
                  name: string,
                  entry: { payload: EmployeeData }
                ) => {
                  const projectData = entry.payload[
                    name
                  ] as EmployeeData[string];
                  if (typeof projectData === "object" && projectData !== null) {
                    return [
                      projectData.projectName,
                      `Start: ${new Date(
                        projectData.startDate
                      ).toLocaleDateString()}`,
                      `End: ${new Date(
                        projectData.endDate
                      ).toLocaleDateString()}`,
                      `Utilization: ${projectData.utilization}%`,
                    ];
                  }
                  return [`${name}: ${value}`];
                }}
              />
            }
          />
          <Legend />
          {Object.keys(chartConfig).map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={chartConfig[key].color}
              shape={(props: any) => (
                <CustomBar
                  {...props}
                  utilization={props.payload[key]?.utilization || 0}
                />
              )}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

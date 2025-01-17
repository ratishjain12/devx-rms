// AvailableEmployeesList.tsx
import React from "react";
import { format } from "date-fns";
import { Sliders } from "lucide-react";

export interface AvailableEmployee {
  id: number;
  name: string;
  seniority: string;
  skills: string[];
  currentUtilization: number;
  availableUtilization: number;
}

interface AvailableEmployeesListProps {
  employees: AvailableEmployee[] | undefined;
  weekRange: {
    start: Date;
    end: Date;
  };
  threshold: number;
  onThresholdChange: (value: number) => void;
}

export function AvailableEmployeesList({
  employees,
  weekRange,
  threshold,
  onThresholdChange,
}: AvailableEmployeesListProps) {
  return (
    <div className="p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Available Employees</h2>
          <p className="text-sm text-gray-600">
            {format(weekRange.start, "MMM d")} -{" "}
            {format(weekRange.end, "MMM d")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-gray-500" />
          <label className="text-sm text-gray-600">
            Availability Threshold:
          </label>
          <select
            value={threshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="p-1 border rounded text-sm"
          >
            {[20, 40, 60, 80, 100].map((value) => (
              <option key={value} value={value}>
                {value}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {employees?.length === 0 ? (
        <p className="text-gray-500">
          No employees available at {threshold}% threshold for the selected week
          range.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {employees?.map((employee) => (
            <div
              key={employee.id}
              className="bg-gray-50 p-3 rounded border border-gray-100 hover:border-blue-200 transition-colors flex-grow basis-[250px] max-w-[300px]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-[#444444]">
                    {employee.name}
                  </div>
                  <div className="text-sm capitalize text-[#B6B6B6]">
                    {employee.seniority.toLowerCase()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {employee.availableUtilization}% available
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

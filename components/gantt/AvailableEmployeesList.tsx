// AvailableEmployeesList.tsx
import React from "react";
import { format } from "date-fns";
import { Employee } from "@/types/models";

export interface AvailableEmployee
  extends Omit<Employee, "currentUtilization" | "availableUtilization"> {
  currentUtilization: number;
  availableUtilization: number;
}

interface AvailableEmployeesListProps {
  employees: AvailableEmployee[];
  weekRange: {
    start: Date;
    end: Date;
  };
}

export function AvailableEmployeesList({
  employees,
  weekRange,
}: AvailableEmployeesListProps) {
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-1">Available Employees</h2>
      <p className="text-sm text-gray-600 mb-4">
        {format(weekRange.start, "MMM d")} - {format(weekRange.end, "MMM d")}
      </p>
      {employees.length === 0 ? (
        <p className="text-gray-500">
          No employees available for the selected week range.
        </p>
      ) : (
        <ul className=" flex gap-4 flex-wrap">
          {employees.map((employee) => (
            <li
              key={employee.id}
              className="bg-gray-50 p-3 rounded border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-gray-600">
                    {employee.seniority}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {employee.availableUtilization}% available
                  </div>
                  <div className="text-xs text-gray-500">
                    {employee.currentUtilization}% utilized
                  </div>
                </div>
              </div>
              {employee.skills?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {employee.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

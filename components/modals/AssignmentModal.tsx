import React, { useState } from "react";
import { format } from "date-fns";
import { Project, Employee } from "@/types/models";
import { Calendar, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider"; // Import the shadcn Slider
import { Button } from "../ui/button";

interface AssignmentModalProps {
  project: Project;
  employees: Employee[]; // Changed from availableEmployees to all employees
  initialStartDate?: string;
  initialEndDate?: string;
  onConfirm: (
    projectId: number,
    employeeId: number,
    utilization: number,
    startDate: string,
    endDate: string
  ) => void;
  onClose: () => void;
}

export function AssignmentModal({
  project,
  employees,
  initialStartDate,
  initialEndDate,
  onConfirm,
  onClose,
}: AssignmentModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [utilization, setUtilization] = useState([100]); // Slider value is an array
  const [startDate, setStartDate] = useState<string>(initialStartDate || "");
  const [endDate, setEndDate] = useState<string>(initialEndDate || "");

  console.log("Start date", startDate);
  console.log("End date", endDate);

  // Group employees by seniority for better organization
  const groupedEmployees = employees.reduce((acc, employee) => {
    if (!acc[employee.seniority]) {
      acc[employee.seniority] = [];
    }
    acc[employee.seniority].push(employee);
    return acc;
  }, {} as Record<string, Employee[]>);

  const handleConfirm = () => {
    if (selectedEmployee !== null && startDate && endDate) {
      onConfirm(
        project.id,
        selectedEmployee,
        utilization[0], // Slider value is an array, so use the first element
        startDate,
        endDate
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-[600px] max-w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Assign</h2>
        </div>

        {/* Project Info Section */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{project.name}</h3>
            <span className="px-3 py-1 bg-black text-white cursor-default rounded-full text-sm">
              {project.type}
            </span>
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Project Duration:</span>
              <span className="font-medium">
                {format(new Date(project.startDate), "MMM d, yyyy")} -{" "}
                {project.endDate
                  ? format(new Date(project.endDate), "MMM d, yyyy")
                  : "Ongoing"}
              </span>
            </div>
          </div>
          {project.projectRequirements &&
            project.projectRequirements.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Requirements:</h4>
                <div className="flex flex-wrap gap-2">
                  {project.projectRequirements.map((req, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 flex flex-col gap-2 bg-gray-100 rounded-md text-sm"
                    >
                      {req.role.name} ({req.seniority}) - {req.quantity}
                      <br />
                      <span className="text-gray-500">
                        {new Date(req.startDate).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        -{" "}
                        {new Date(req.endDate).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Form Section - Scrollable */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Employee
            </label>
            <div className="relative w-full">
              <select
                value={selectedEmployee || ""}
                onChange={(e) => setSelectedEmployee(Number(e.target.value))}
                className="w-full px-2  py-3 border border-gray-300 rounded-md appearance-none"
              >
                <option value="">Select an employee</option>
                {Object.entries(groupedEmployees).map(
                  ([seniority, seniorityEmployees]) => (
                    <optgroup key={seniority} label={seniority}>
                      {seniorityEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.roles.join(", ")}
                        </option>
                      ))}
                    </optgroup>
                  )
                )}
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <ChevronDown className="text-black" size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate.split("T")[0]}
                min={project.startDate.split("T")[0]}
                max={project.endDate?.split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate.split("T")[0]}
                min={startDate || project.startDate.split("T")[0]}
                max={project.endDate?.split("T")[0]}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Utilization Percentage
            </label>
            <div className="flex items-center gap-4">
              {/* Shadcn Slider */}
              <Slider
                value={utilization}
                onValueChange={(value) => setUtilization(value)}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="w-16 text-center bg-gray-100 px-2 py-1 rounded">
                {utilization[0]}%
              </span>
            </div>
          </div>

          {selectedEmployee && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Employee Details</h4>
              {(() => {
                const employee = employees.find(
                  (e) => e.id === selectedEmployee
                );
                if (!employee) return null;
                return (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Skills:</span>{" "}
                      <span className="font-medium">{employee.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Roles:</span>{" "}
                      <span className="font-medium">
                        {employee.roles.join(", ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Seniority:</span>{" "}
                      <span className="font-medium capitalize">
                        {employee.seniority.toLowerCase()}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-2 mt-auto">
          <Button
            onClick={onClose}
            variant={"secondary"}
            className=" rounded-md"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedEmployee || !startDate || !endDate}
            className="rounded-md   disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Assignment
          </Button>
        </div>
      </div>
    </div>
  );
}

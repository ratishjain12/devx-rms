// AssignmentModal.tsx
import React, { useState } from "react";
import { Project } from "@/types/models";

interface AvailableEmployee {
  id: number;
  name: string;
  seniority: string;
  skills: string[];
  currentUtilization: number;
  availableUtilization: number;
}

interface AssignmentModalProps {
  project: Project;
  availableEmployees: AvailableEmployee[]; // Changed from Employee[] to AvailableEmployee[]
  onConfirm: (
    projectId: number,
    employeeId: number,
    utilization: number
  ) => void;
  onClose: () => void;
}

export function AssignmentModal({
  project,
  availableEmployees,
  onConfirm,
  onClose,
}: AssignmentModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [utilization, setUtilization] = useState(1);

  const handleConfirm = () => {
    if (selectedEmployee !== null) {
      onConfirm(project.id, selectedEmployee, utilization);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[32rem] max-w-full">
        <h2 className="text-xl font-bold mb-4">
          Add Assignment to {project.name}
        </h2>
        <div className="mb-4">
          <label className="block mb-2">Select Employee:</label>
          <select
            value={selectedEmployee || ""}
            onChange={(e) => setSelectedEmployee(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select an employee</option>
            {availableEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({employee.availableUtilization}% available)
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2">Utilization:</label>
          <input
            type="number"
            value={utilization}
            onChange={(e) => setUtilization(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
            min="0"
            max="1"
            step="0.1"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedEmployee}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Add Assignment
          </button>
        </div>
      </div>
    </div>
  );
}

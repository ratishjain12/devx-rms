import React, { useState } from "react";
import { Assignment, Employee, Project } from "@/types/models";

interface UtilizationModalProps {
  assignment: Assignment;
  fromProject: Project;
  toProject: Project;
  onConfirm: (
    employee: Employee,
    newUtilization: number,
    previousUtilization: number
  ) => void;
  onClose: () => void;
}

export function UtilizationModal({
  assignment,
  fromProject,
  toProject,
  onConfirm,
  onClose,
}: UtilizationModalProps) {
  const [newUtilization, setNewUtilization] = useState(assignment.utilisation);
  const [previousUtilization, setPreviousUtilization] = useState(
    assignment.utilisation
  );

  const handleConfirm = () => {
    onConfirm(assignment.employee, newUtilization, previousUtilization);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[32rem] max-w-full">
        <h2 className="text-xl font-bold mb-4">Set Resource Utilization</h2>
        <p className="mb-4">
          Assign {assignment.employee.name} from {fromProject.name} to{" "}
          {toProject.name} :
        </p>
        <div className="mb-4">
          <label htmlFor="previousUtilization" className="block mb-2">
            Previous Utilization in {fromProject.name} :
          </label>
          <input
            type="number"
            id="previousUtilization"
            value={previousUtilization}
            onChange={(e) => setPreviousUtilization(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
            min="0"
            max="1"
            step="0.1"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="newUtilization" className="block mb-2">
            New Utilization in {toProject.name}:
          </label>
          <input
            type="number"
            id="newUtilization"
            value={newUtilization}
            onChange={(e) => setNewUtilization(Number(e.target.value))}
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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

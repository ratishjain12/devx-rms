import React, { useState } from "react";
import { Assignment, Employee } from "@/types/models";

interface UtilizationModalProps {
  assignment: Assignment;
  onConfirm: (employee: Employee, utilization: number) => void;
  onClose: () => void;
}

export function UtilizationModal({
  assignment,
  onConfirm,
  onClose,
}: UtilizationModalProps) {
  const [utilization, setUtilization] = useState(assignment.utilisation);

  const handleConfirm = () => {
    onConfirm(assignment.employee, utilization);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Set Resource Utilization</h2>
        <p className="mb-4">
          Assign {assignment.employee.name} to the new project:
        </p>
        <div className="mb-4">
          <label htmlFor="utilization" className="block mb-2">
            Utilization Percentage:
          </label>
          <input
            type="number"
            id="utilization"
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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

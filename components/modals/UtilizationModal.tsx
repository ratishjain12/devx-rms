// UtilizationModal.tsx
import React, { useState } from "react";
import { Assignment, Project } from "@/types/models";

interface UtilizationModalProps {
  assignment: Assignment;
  fromProject: Project;
  toProject: Project;
  onConfirm: (newUtilization: number, previousUtilization: number) => void; // Simplified props
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
    onConfirm(newUtilization, previousUtilization);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[32rem] max-w-full">
        <h2 className="text-xl font-bold mb-4">Update Resource Assignment</h2>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">{assignment.employee.name}</span>
            <span className="text-sm text-blue-600">
              {assignment.employee.seniority}
            </span>
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Moving from {fromProject.name} to {toProject.name}
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="previousUtilization"
            className="block mb-2 font-medium"
          >
            Utilization in {fromProject.name}:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              id="previousUtilization"
              value={previousUtilization}
              onChange={(e) => setPreviousUtilization(Number(e.target.value))}
              className="flex-1"
              min="0"
              max="100"
              step="10"
            />
            <span className="w-16 text-center bg-gray-100 px-2 py-1 rounded">
              {previousUtilization}%
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="newUtilization" className="block mb-2 font-medium">
            Utilization in {toProject.name}:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              id="newUtilization"
              value={newUtilization}
              onChange={(e) => setNewUtilization(Number(e.target.value))}
              className="flex-1"
              min="0"
              max="100"
              step="10"
            />
            <span className="w-16 text-center bg-gray-100 px-2 py-1 rounded">
              {newUtilization}%
            </span>
          </div>
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

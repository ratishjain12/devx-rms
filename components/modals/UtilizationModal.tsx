import React, { useState } from "react";
import { Assignment, Project } from "@/types/models";

interface UtilizationModalProps {
  assignment: Assignment;
  fromProject: Project;
  toProject: Project;
  isSameProject: boolean;
  targetWeekStart: string; // Start of the target week
  targetWeekEnd: string; // End of the target week
  onConfirm: (
    newUtilization: number,
    previousUtilization: number,
    newStartDate: string,
    newEndDate: string
  ) => void;
  onClose: () => void;
}

export function UtilizationModal({
  assignment,
  fromProject,
  toProject,
  isSameProject,
  targetWeekStart,
  targetWeekEnd,
  onConfirm,
  onClose,
}: UtilizationModalProps) {
  const [newUtilization, setNewUtilization] = useState(assignment.utilisation);
  const [previousUtilization, setPreviousUtilization] = useState(
    isSameProject ? assignment.utilisation : 0
  );
  const [newStartDate, setNewStartDate] = useState(targetWeekStart); // Prefill with target week start
  const [newEndDate, setNewEndDate] = useState(targetWeekEnd); // Prefill with target week end

  const handleConfirm = () => {
    onConfirm(newUtilization, previousUtilization, newStartDate, newEndDate);
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
            {isSameProject
              ? `Moving within ${fromProject.name}`
              : `Moving from ${fromProject.name} to ${toProject.name}`}
          </div>
        </div>

        {/* New Start Date Field */}
        <div className="mb-4">
          <label htmlFor="newStartDate" className="block mb-2 font-medium">
            New Start Date:
          </label>
          <input
            type="date"
            id="newStartDate"
            value={newStartDate.split("T")[0]}
            onChange={(e) => setNewStartDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* New End Date Field */}
        <div className="mb-4">
          <label htmlFor="newEndDate" className="block mb-2 font-medium">
            New End Date:
          </label>
          <input
            type="date"
            id="newEndDate"
            value={newEndDate.split("T")[0]}
            onChange={(e) => setNewEndDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Previous Utilization Field (only for different projects) */}
        {!isSameProject && (
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
        )}

        {/* New Utilization Field */}
        <div className="mb-6">
          <label htmlFor="newUtilization" className="block mb-2 font-medium">
            Utilization in {isSameProject ? fromProject.name : toProject.name}:
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

        {/* Action Buttons */}
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

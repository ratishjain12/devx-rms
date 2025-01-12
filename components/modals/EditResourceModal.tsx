import React, { useState } from "react";
import { Assignment, Project } from "@/types/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface EditResourceModalProps {
  assignment: Assignment;
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    assignmentId: number,
    employeeId: number,
    projectId: number,
    startDate: string,
    endDate: string,
    utilization: number
  ) => void;
}

export function EditResourceModal({
  assignment,
  project,
  isOpen,
  onClose,
  onConfirm,
}: EditResourceModalProps) {
  const [utilization, setUtilization] = useState(assignment.utilisation);
  const [startDate, setStartDate] = useState(
    assignment.startDate.split("T")[0]
  );
  const [endDate, setEndDate] = useState(assignment.endDate.split("T")[0]);

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();

    onConfirm(
      assignment.id,
      assignment?.employeeId,
      assignment?.projectId,
      startDate,
      endDate,
      utilization
    );
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const { id, value } = e.target;
    if (id === "startDate") setStartDate(value);
    else if (id === "endDate") setEndDate(value);
    else if (id === "utilization") setUtilization(Number(value));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogOverlay
        className="fixed inset-0 bg-black/30 z-50"
        onClick={handleOverlayClick}
      />
      <DialogContent
        className="sm:max-w-[425px] z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
        onClick={handleOverlayClick}
      >
        <DialogHeader>
          <DialogTitle>Edit Resource Assignment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4" onClick={handleOverlayClick}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{assignment?.employee?.name}</span>
              <span className="text-sm text-blue-600">
                {assignment?.employee?.seniority}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Project: {project.name!}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date</Label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date</Label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              min={startDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utilization">Utilization</Label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                id="utilization"
                value={utilization}
                onChange={handleInputChange}
                className="flex-1"
                min="0"
                max="100"
                step="10"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="w-16 text-center bg-gray-100 px-2 py-1 rounded">
                {utilization}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
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
      </DialogContent>
    </Dialog>
  );
}

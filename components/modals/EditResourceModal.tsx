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
import { formatDateForInput } from "@/lib/dateUtils"; // Remove unnecessary imports
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";

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
    formatDateForInput(assignment.startDate)
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(assignment.endDate)
  );

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Convert dates to UTC if required
    const utcStartDate = new Date(startDate).toISOString(); // Convert to UTC
    const utcEndDate = new Date(endDate).toISOString(); // Convert to UTC

    console.log("Selected Start Date:", startDate);
    console.log("Selected End Date:", endDate);
    console.log("UTC Start Date:", utcStartDate);
    console.log("UTC End Date:", utcEndDate);

    onConfirm(
      assignment.id,
      assignment?.employeeId,
      assignment?.projectId,
      utcStartDate, // Pass the UTC startDate
      utcEndDate, // Pass the UTC endDate
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
  };

  // New function to handle slider changes
  const handleSliderChange = (value: number[]) => {
    setUtilization(value[0]); // Update utilization state with the first value from the array
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
              <Slider
                value={[utilization]} // Slider expects an array of numbers
                onValueChange={handleSliderChange} // Handle slider changes
                min={0}
                max={100}
                step={10}
                className="flex-1"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="w-16 text-center bg-gray-100 px-2 py-1 rounded">
                {utilization}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            variant={"secondary"}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

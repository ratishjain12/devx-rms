import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

// Helper functions for date handling
const setStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const setEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getEndOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay())); // Go to Saturday
  return setEndOfDay(d);
};

const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await params;
    const assignmentId = parseInt(data.id);
    const requestBody = await request.json();
    const { weekStart } = requestBody;

    if (!weekStart) {
      return NextResponse.json(
        { error: "Week start date is required" },
        { status: 400 }
      );
    }

    // Get the current assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        employee: true,
        project: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Set up dates with proper boundaries
    const weekStartDate = setStartOfDay(new Date(weekStart));
    const weekEndDate = getEndOfWeek(weekStartDate);
    const assignmentStartDate = setStartOfDay(new Date(assignment.startDate));
    const assignmentEndDate = setEndOfDay(new Date(assignment.endDate));

    // Debug logging
    console.log({
      weekStartDate: weekStartDate.toISOString(),
      weekEndDate: weekEndDate.toISOString(),
      assignmentStartDate: assignmentStartDate.toISOString(),
      assignmentEndDate: assignmentEndDate.toISOString(),
      isBeforeWeek: assignmentStartDate < weekStartDate,
      isAfterWeek: assignmentEndDate > weekEndDate,
    });

    // If the week is in the middle of the assignment
    if (
      assignmentStartDate.getTime() < weekStartDate.getTime() &&
      assignmentEndDate.getTime() > weekEndDate.getTime()
    ) {
      console.log("Splitting assignment in middle");
      // Create two new assignments with clean midnight boundaries
      const [firstPart, secondPart] = await prisma.$transaction([
        prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            endDate: new Date(weekStartDate.getTime() - 1), // End at 23:59:59.999 of previous day
          },
          include: {
            employee: true,
            project: true,
          },
        }),
        prisma.assignment.create({
          data: {
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            startDate: new Date(weekEndDate.getTime() + 1), // Start at 00:00:00.000 of next day
            endDate: assignment.endDate,
            utilisation: assignment.utilisation,
          },
          include: {
            employee: true,
            project: true,
          },
        }),
      ]);

      return NextResponse.json({
        updatedAssignment: firstPart,
        newAssignment: secondPart,
      });
    }
    // If the week is at the start of the assignment
    else if (isDateInRange(assignmentStartDate, weekStartDate, weekEndDate)) {
      console.log("Updating assignment start");
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          startDate: new Date(weekEndDate.getTime() + 1), // Start at 00:00:00.000 of next day
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json({ updatedAssignment });
    }
    // If the week is at the end of the assignment
    else if (isDateInRange(assignmentEndDate, weekStartDate, weekEndDate)) {
      console.log("Updating assignment end");
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          endDate: new Date(weekStartDate.getTime() - 1), // End at 23:59:59.999 of previous day
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json({ updatedAssignment });
    }

    console.log("No condition matched - Invalid week range");
    return NextResponse.json({ error: "Invalid week range" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting assignment week:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment week" },
      { status: 500 }
    );
  }
}

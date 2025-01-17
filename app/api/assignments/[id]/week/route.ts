import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

// Helper functions for date handling with explicit UTC conversion
const setStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  // Set to midnight UTC
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const setEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  // Set to last millisecond of the day UTC
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const getEndOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const daysToAdd = 6; // Add 6 days to get the end of the week
  d.setUTCDate(d.getUTCDate() + daysToAdd); // Add days to reach the end of the week
  return setEndOfDay(d); // Set to the end of the day (23:59:59.999)
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

    // Validate input
    if (!weekStart) {
      return NextResponse.json(
        { error: "Week start date is required" },
        { status: 400 }
      );
    }

    if (!assignmentId || isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 }
      );
    }

    // Debug logging
    console.log("Delete request received:", {
      assignmentId,
      weekStart,
      params: params,
    });

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
        { error: `Assignment with ID ${assignmentId} not found` },
        { status: 404 }
      );
    }

    // Convert all dates to UTC and set proper boundaries
    const weekStartDate = setStartOfDay(new Date(weekStart));
    const weekEndDate = getEndOfWeek(weekStartDate); // Correctly calculate the end of the week
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
      try {
        // Create two new assignments with clean boundaries
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

        console.log("Split successful:", { firstPart, secondPart });

        return NextResponse.json({
          updatedAssignment: firstPart,
          newAssignment: secondPart,
        });
      } catch (error) {
        console.error("Error during split:", error);
        return NextResponse.json(
          { error: "Failed to split assignment" },
          { status: 500 }
        );
      }
    }
    // If the week is at the start of the assignment
    else if (isDateInRange(assignmentStartDate, weekStartDate, weekEndDate)) {
      console.log("Updating assignment start");
      try {
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
      } catch (error) {
        console.error("Error updating assignment start:", error);
        return NextResponse.json(
          { error: "Failed to update assignment start date" },
          { status: 500 }
        );
      }
    }
    // If the week is at the end of the assignment
    else if (isDateInRange(assignmentEndDate, weekStartDate, weekEndDate)) {
      console.log("Updating assignment end");
      try {
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
      } catch (error) {
        console.error("Error updating assignment end:", error);
        return NextResponse.json(
          { error: "Failed to update assignment end date" },
          { status: 500 }
        );
      }
    }

    console.log("No condition matched - Invalid week range");
    return NextResponse.json(
      {
        error: "Invalid week range",
        details: {
          weekStart: weekStartDate,
          weekEnd: weekEndDate,
          assignmentStart: assignmentStartDate,
          assignmentEnd: assignmentEndDate,
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting assignment week:", error);
    return NextResponse.json(
      {
        error: "Failed to delete assignment week",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

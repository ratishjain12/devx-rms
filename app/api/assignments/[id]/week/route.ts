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

// const getEndOfWeek = (date: Date): Date => {
//   const d = new Date(date);
//   const daysToAdd = 6; // Add 6 days to get the end of the week
//   d.setUTCDate(d.getUTCDate() + daysToAdd); // Add days to reach the end of the week
//   return setEndOfDay(d); // Set to the end of the day (23:59:59.999)
// };

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await params;
    const assignmentId = parseInt(data.id);
    const requestBody = await request.json();
    const { weekStart, mergedStartDate, mergedEndDate } = requestBody;

    // Validate input
    if (!weekStart || !mergedStartDate || !mergedEndDate) {
      return NextResponse.json(
        {
          error:
            "Week start, merged start date, and merged end date are required",
        },
        { status: 400 }
      );
    }

    if (!assignmentId || isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
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
        { error: `Assignment with ID ${assignmentId} not found` },
        { status: 404 }
      );
    }

    // Convert all dates to UTC and set proper boundaries
    // const weekStartDate = setStartOfDay(new Date(weekStart));
    // const weekEndDate = getEndOfWeek(weekStartDate);
    const mergedStart = setStartOfDay(new Date(mergedStartDate));
    const mergedEnd = setEndOfDay(new Date(mergedEndDate));

    const assignmentStartDate = setStartOfDay(new Date(assignment.startDate));
    const assignmentEndDate = setEndOfDay(new Date(assignment.endDate));

    // Check if the assignment completely fits within the merged week range
    if (assignmentStartDate >= mergedStart && assignmentEndDate <= mergedEnd) {
      // If the assignment completely fits within the merged week range, delete it
      await prisma.assignment.delete({
        where: { id: assignmentId },
      });

      return NextResponse.json({
        message: "Assignment deleted successfully",
      });
    } else {
      // Handle partial overlaps or spans
      if (assignmentStartDate < mergedStart && assignmentEndDate > mergedEnd) {
        // Split the assignment into two parts: before and after the merged week range
        const [beforeWeek, afterWeek] = await prisma.$transaction([
          // Part 1: Before the merged week range
          prisma.assignment.create({
            data: {
              employeeId: assignment.employeeId,
              projectId: assignment.projectId,
              startDate: assignmentStartDate.toISOString(),
              endDate: new Date(mergedStart.getTime() - 1).toISOString(), // End at 23:59:59.999 of the previous day
              utilisation: assignment.utilisation,
            },
          }),
          // Part 2: After the merged week range
          prisma.assignment.create({
            data: {
              employeeId: assignment.employeeId,
              projectId: assignment.projectId,
              startDate: new Date(mergedEnd.getTime() + 1).toISOString(), // Start at 00:00:00.000 of the next day
              endDate: assignmentEndDate.toISOString(),
              utilisation: assignment.utilisation,
            },
          }),
        ]);

        // Delete the original assignment
        await prisma.assignment.delete({
          where: { id: assignmentId },
        });

        return NextResponse.json({
          message:
            "Assignment split into two parts (before and after the merged week range)",
          beforeWeek,
          afterWeek,
        });
      } else if (assignmentStartDate < mergedStart) {
        // Adjust the end date to exclude the merged week range
        await prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            endDate: new Date(mergedStart.getTime() - 1).toISOString(), // End at 23:59:59.999 of the previous day
          },
        });

        return NextResponse.json({
          message:
            "Assignment end date updated to exclude the merged week range",
        });
      } else if (assignmentEndDate > mergedEnd) {
        // Adjust the start date to exclude the merged week range
        await prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            startDate: new Date(mergedEnd.getTime() + 1).toISOString(), // Start at 00:00:00.000 of the next day
          },
        });

        return NextResponse.json({
          message:
            "Assignment start date updated to exclude the merged week range",
        });
      }
    }
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

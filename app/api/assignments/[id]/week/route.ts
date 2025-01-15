import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { endOfWeek, isWithinInterval, startOfDay, endOfDay } from "date-fns";

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

    // Set up dates with proper start/end of day
    const weekStartDate = startOfDay(new Date(weekStart));
    const weekEndDate = endOfDay(endOfWeek(weekStartDate));
    const assignmentStartDate = startOfDay(new Date(assignment.startDate));
    const assignmentEndDate = endOfDay(new Date(assignment.endDate));

    // If the week is in the middle of the assignment
    if (
      assignmentStartDate < weekStartDate &&
      assignmentEndDate > weekEndDate
    ) {
      // Create two new assignments with clean midnight boundaries
      const [firstPart, secondPart] = await prisma.$transaction([
        prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            // End at 23:59:59.999 of the day before week starts
            endDate: new Date(weekStartDate.getTime() - 1),
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
            // Start at 00:00:00.000 of the day after week ends
            startDate: new Date(weekEndDate.getTime() + 1),
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
    else if (
      isWithinInterval(assignmentStartDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          // Start at 00:00:00.000 of the day after week ends
          startDate: new Date(weekEndDate.getTime() + 1),
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json({ updatedAssignment });
    }
    // If the week is at the end of the assignment
    else if (
      isWithinInterval(assignmentEndDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          // End at 23:59:59.999 of the day before week starts
          endDate: new Date(weekStartDate.getTime() - 1),
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json({ updatedAssignment });
    }

    return NextResponse.json({ error: "Invalid week range" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting assignment week:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment week" },
      { status: 500 }
    );
  }
}

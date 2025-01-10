import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { endOfWeek, isWithinInterval } from "date-fns";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = parseInt(params.id);
    const body = await request.json();
    const { weekStart } = body;

    if (!weekStart) {
      return NextResponse.json(
        { error: "Week start date is required" },
        { status: 400 }
      );
    }

    // Get the current assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const weekStartDate = new Date(weekStart);
    const weekEndDate = endOfWeek(weekStartDate);
    const assignmentStartDate = new Date(assignment.startDate);
    const assignmentEndDate = new Date(assignment.endDate);

    // If the week is at the start of the assignment
    if (
      isWithinInterval(assignmentStartDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      // Update the start date to be after the week
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          startDate: new Date(weekEndDate.getTime() + 86400000).toISOString(), // Add one day
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json(updatedAssignment);
    }
    // If the week is at the end of the assignment
    else if (
      isWithinInterval(assignmentEndDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      // Update the end date to be before the week
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          endDate: new Date(weekStartDate.getTime() - 86400000).toISOString(), // Subtract one day
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json(updatedAssignment);
    }
    // If the week is in the middle of the assignment
    else {
      // Split the assignment into two parts
      const [updatedAssignment, newAssignment] = await prisma.$transaction([
        prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            endDate: new Date(weekStartDate.getTime() - 86400000).toISOString(), // End before the week
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
            startDate: new Date(weekEndDate.getTime() + 86400000).toISOString(), // Start after the week
            endDate: assignment.endDate,
            utilisation: assignment.utilisation,
          },
          include: {
            employee: true,
            project: true,
          },
        }),
      ]);

      return NextResponse.json({ updatedAssignment, newAssignment });
    }
  } catch (error) {
    console.error("Error deleting assignment week:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment week" },
      { status: 500 }
    );
  }
}
